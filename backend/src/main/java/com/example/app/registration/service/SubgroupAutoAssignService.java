package com.example.app.registration.service;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.exception.ApiException;
import com.example.app.registration.document.Enrollment;
import com.example.app.registration.document.Intake;
import com.example.app.registration.document.Student;
import com.example.app.registration.dto.SubgroupAutoAssignRequest;
import com.example.app.registration.dto.SubgroupAutoAssignResponse;
import com.example.app.registration.enums.SubgroupAllocationMode;
import com.example.app.registration.repository.EnrollmentRepository;
import com.example.app.registration.repository.IntakeRepository;
import com.example.app.registration.repository.StudentRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SubgroupAutoAssignService {

    private static final int SUBGROUP_MAX_LEN = 40;

    private final IntakeRepository intakeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final MongoTemplate mongoTemplate;

    public SubgroupAutoAssignResponse autoAssign(SubgroupAutoAssignRequest request) {
        validateRequest(request);

        String intakeId = request.getIntakeId().trim();
        Intake intake =
                intakeRepository
                        .findByIdAndDeletedFalse(intakeId)
                        .orElseThrow(
                                () ->
                                        new ApiException(
                                                HttpStatus.NOT_FOUND, "Selected intake was not found"));

        List<CandidateRow> candidates = listCandidatesFromDb(intakeId);
        int n = candidates.size();

        SubgroupAllocationMode mode = request.getMode();
        int targetSubgroupCount;
        Integer requestedSubgroupCount = null;
        Integer requestedStudentsPerSubgroup = null;

        if (mode == SubgroupAllocationMode.GROUP_COUNT) {
            int g = request.getSubgroupCount();
            requestedSubgroupCount = g;
            targetSubgroupCount = g;
        } else {
            int sp = request.getStudentsPerSubgroup();
            requestedStudentsPerSubgroup = sp;
            targetSubgroupCount = n == 0 ? 0 : (int) Math.ceil((double) n / sp);
        }

        int[] groupIndexPerStudent = buildGroupAssignments(mode, n, request, targetSubgroupCount);

        Map<String, String> plannedSubgroupByEnrollmentId = new HashMap<>();
        for (int i = 0; i < n; i++) {
            CandidateRow row = candidates.get(i);
            int gi = groupIndexPerStudent[i];
            String code = subgroupCodeByIndex(gi);
            plannedSubgroupByEnrollmentId.put(row.enrollmentId(), code);
        }

        List<SubgroupAutoAssignResponse.SubgroupCountDto> currentDistribution = buildCurrentDistribution(candidates);
        List<SubgroupAutoAssignResponse.SubgroupPreviewDto> previewDistribution =
                buildPreviewDistribution(candidates, groupIndexPerStudent, targetSubgroupCount);

        int changedCount = 0;
        int unchangedCount = 0;
        for (CandidateRow row : candidates) {
            String planned = plannedSubgroupByEnrollmentId.get(row.enrollmentId());
            String cur = normalizeSubgroupForCompare(row.currentSubgroup());
            String next = normalizeSubgroupForCompare(planned);
            if (!Objects.equals(cur, next)) {
                changedCount++;
            } else {
                unchangedCount++;
            }
        }

        String termCode = request.getTermCode() != null ? request.getTermCode().trim() : null;
        if (termCode != null && termCode.isEmpty()) {
            termCode = null;
        }
        boolean termMatchesCurrent =
                termCode == null || termCode.equalsIgnoreCase(Optional.ofNullable(intake.getCurrentTerm()).orElse(""));

        boolean apply = Boolean.TRUE.equals(request.getApply());
        boolean applied = false;
        if (apply && changedCount > 0) {
            applyUpdates(candidates, plannedSubgroupByEnrollmentId);
            applied = true;
        }

        String intakeName = intake.resolveDisplayName();

        return SubgroupAutoAssignResponse.builder()
                .intake(
                        SubgroupAutoAssignResponse.IntakeSummaryDto.builder()
                                .id(intake.getId())
                                .name(intakeName)
                                .currentTerm(intake.getCurrentTerm())
                                .build())
                .selectedTerm(termCode)
                .termMatchesCurrent(termMatchesCurrent)
                .mode(mode)
                .requestedSubgroupCount(requestedSubgroupCount)
                .requestedStudentsPerSubgroup(requestedStudentsPerSubgroup)
                .totalStudents(n)
                .totalSubgroups(targetSubgroupCount)
                .currentDistribution(currentDistribution)
                .previewDistribution(previewDistribution)
                .changedCount(changedCount)
                .unchangedCount(unchangedCount)
                .applied(applied)
                .build();
    }

    private void validateRequest(SubgroupAutoAssignRequest request) {
        if (request.getIntakeId() == null || request.getIntakeId().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake is required");
        }
        if (request.getMode() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid allocation mode");
        }
        if (request.getMode() != SubgroupAllocationMode.GROUP_COUNT
                && request.getMode() != SubgroupAllocationMode.STUDENTS_PER_SUBGROUP) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid allocation mode");
        }
        if (request.getMode() == SubgroupAllocationMode.GROUP_COUNT) {
            Integer c = request.getSubgroupCount();
            if (c == null || c <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Subgroup count must be greater than zero");
            }
        } else {
            Integer sp = request.getStudentsPerSubgroup();
            if (sp == null || sp <= 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Students per subgroup must be greater than zero");
            }
        }
    }

    private List<CandidateRow> listCandidatesFromDb(String intakeId) {
        List<Enrollment> enrollments =
                enrollmentRepository.findByIntakeIdAndEnrollmentStatus(intakeId, AccountStatus.ACTIVE);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        List<String> profileIds =
                enrollments.stream().map(Enrollment::getStudentProfileId).distinct().toList();
        Map<String, Student> studentsById =
                studentRepository.findByIdIn(profileIds).stream()
                        .filter(s -> s.getStatus() == AccountStatus.ACTIVE)
                        .collect(Collectors.toMap(Student::getId, s -> s, (a, b) -> a));

        List<CandidateRow> rows = new ArrayList<>();
        for (Enrollment e : enrollments) {
            Student st = studentsById.get(e.getStudentProfileId());
            if (st == null) {
                continue;
            }
            rows.add(
                    new CandidateRow(
                            e.getId(),
                            e.getStudentProfileId(),
                            st.getStudentId(),
                            e.getSubgroup()));
        }
        rows.sort(Comparator.comparing(CandidateRow::studentId, Comparator.nullsLast(String::compareTo)));
        return rows;
    }

    /** major = floor(index/2)+1, minor = (index % 2) + 1 → 1.1, 1.2, 2.1, 2.2, … */
    public static String subgroupCodeByIndex(int index) {
        int major = (index / 2) + 1;
        int minor = (index % 2) + 1;
        return major + "." + minor;
    }

    private int[] buildGroupAssignments(
            SubgroupAllocationMode mode,
            int n,
            SubgroupAutoAssignRequest request,
            int targetSubgroupCount) {
        int[] groupIndexPerStudent = new int[Math.max(n, 0)];
        if (n == 0 || targetSubgroupCount == 0) {
            return groupIndexPerStudent;
        }
        if (mode == SubgroupAllocationMode.GROUP_COUNT) {
            int g = request.getSubgroupCount();
            int base = n / g;
            int remainder = n % g;
            int studentIdx = 0;
            for (int gi = 0; gi < g; gi++) {
                int size = base + (gi < remainder ? 1 : 0);
                for (int j = 0; j < size; j++) {
                    groupIndexPerStudent[studentIdx++] = gi;
                }
            }
        } else {
            int sp = request.getStudentsPerSubgroup();
            for (int i = 0; i < n; i++) {
                groupIndexPerStudent[i] = i / sp;
            }
        }
        return groupIndexPerStudent;
    }

    private List<SubgroupAutoAssignResponse.SubgroupCountDto> buildCurrentDistribution(List<CandidateRow> candidates) {
        Map<String, Integer> counts = new HashMap<>();
        for (CandidateRow row : candidates) {
            String s = sanitizeSubgroup(row.currentSubgroup());
            if (s == null || s.isEmpty()) {
                continue;
            }
            counts.merge(s, 1, Integer::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey(SubgroupAutoAssignService::compareSubgroupCode))
                .map(
                        e ->
                                SubgroupAutoAssignResponse.SubgroupCountDto.builder()
                                        .code(e.getKey())
                                        .count(e.getValue())
                                        .build())
                .toList();
    }

    private List<SubgroupAutoAssignResponse.SubgroupPreviewDto> buildPreviewDistribution(
            List<CandidateRow> candidates, int[] groupIndexPerStudent, int targetSubgroupCount) {
        if (targetSubgroupCount <= 0) {
            return List.of();
        }
        List<List<CandidateRow>> groups = new ArrayList<>();
        for (int i = 0; i < targetSubgroupCount; i++) {
            groups.add(new ArrayList<>());
        }
        for (int i = 0; i < candidates.size(); i++) {
            int gi = groupIndexPerStudent[i];
            if (gi >= 0 && gi < groups.size()) {
                groups.get(gi).add(candidates.get(i));
            }
        }
        List<SubgroupAutoAssignResponse.SubgroupPreviewDto> out = new ArrayList<>();
        for (int gi = 0; gi < targetSubgroupCount; gi++) {
            List<CandidateRow> g = groups.get(gi);
            String code = subgroupCodeByIndex(gi);
            int count = g.size();
            String first = count > 0 ? g.get(0).studentId() : null;
            String last = count > 0 ? g.get(count - 1).studentId() : null;
            out.add(
                    SubgroupAutoAssignResponse.SubgroupPreviewDto.builder()
                            .code(code)
                            .count(count)
                            .firstStudentId(first)
                            .lastStudentId(last)
                            .build());
        }
        return out;
    }

    private static int compareSubgroupCode(String a, String b) {
        String[] pa = a.split("\\.");
        String[] pb = b.split("\\.");
        int len = Math.max(pa.length, pb.length);
        for (int i = 0; i < len; i++) {
            int na = i < pa.length ? parseIntSafe(pa[i]) : 0;
            int nb = i < pb.length ? parseIntSafe(pb[i]) : 0;
            int c = Integer.compare(na, nb);
            if (c != 0) {
                return c;
            }
        }
        return a.compareToIgnoreCase(b);
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static String normalizeSubgroupForCompare(String raw) {
        String s = sanitizeSubgroup(raw);
        return s == null || s.isEmpty() ? null : s;
    }

    public static String sanitizeSubgroup(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim().replaceAll("\\s+", " ");
        if (t.isEmpty()) {
            return null;
        }
        if (t.length() > SUBGROUP_MAX_LEN) {
            return t.substring(0, SUBGROUP_MAX_LEN);
        }
        return t;
    }

    private void applyUpdates(List<CandidateRow> candidates, Map<String, String> plannedSubgroupByEnrollmentId) {
        Instant now = Instant.now();
        BulkOperations bulk =
                mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, Enrollment.class, "enrollments");
        List<String> touchedProfiles = new ArrayList<>();

        for (CandidateRow row : candidates) {
            String planned = plannedSubgroupByEnrollmentId.get(row.enrollmentId());
            String newVal = planned;
            String oldSan = normalizeSubgroupForCompare(row.currentSubgroup());
            String newSan = normalizeSubgroupForCompare(planned);
            if (Objects.equals(oldSan, newSan)) {
                continue;
            }
            bulk.updateOne(
                    Query.query(Criteria.where("_id").is(row.enrollmentId())),
                    new Update().set("subgroup", newVal).set("updatedAt", now));
            touchedProfiles.add(row.studentProfileId());
        }

        if (touchedProfiles.isEmpty()) {
            return;
        }

        bulk.execute();

        List<Student> toSave = new ArrayList<>();
        for (String pid : touchedProfiles.stream().distinct().toList()) {
            studentRepository
                    .findById(pid)
                    .ifPresent(
                            st -> {
                                st.setUpdatedAt(now);
                                toSave.add(st);
                            });
        }
        if (!toSave.isEmpty()) {
            studentRepository.saveAll(toSave);
        }
    }

    private record CandidateRow(
            String enrollmentId, String studentProfileId, String studentId, String currentSubgroup) {}
}

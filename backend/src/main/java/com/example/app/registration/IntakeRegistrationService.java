package com.example.app.registration;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import com.example.app.registration.document.Intake;
import com.example.app.registration.document.IntakeNotificationEntry;
import com.example.app.registration.document.TermScheduleRow;
import com.example.app.registration.dto.IntakeApiResponse;
import com.example.app.registration.dto.IntakeCreateRequest;
import com.example.app.registration.dto.IntakeMinimalResponse;
import com.example.app.registration.dto.IntakeSummaryResponse;
import com.example.app.registration.dto.PagedIntakeListResponse;
import com.example.app.registration.dto.TermScheduleRowDto;
import com.example.app.registration.enums.IntakeBatchStatus;
import com.example.app.registration.repository.IntakeRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntakeRegistrationService {

    private final IntakeRepository intakeRepository;
    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final MongoTemplate mongoTemplate;

    public PagedIntakeListResponse listPaged(
            String search,
            String statusRaw,
            String sortRaw,
            String facultyRaw,
            String degreeRaw,
            String currentTermRaw,
            int page,
            int pageSize) {

        int safePage = Math.max(1, page);
        int safeSize = switch (pageSize) {
            case 10, 25, 50, 100 -> pageSize;
            default -> 25;
        };

        Criteria c = Criteria.where("deleted").ne(true);

        if (statusRaw != null && !statusRaw.isBlank()) {
            try {
                c = c.and("status").is(IntakeBatchStatus.valueOf(statusRaw.trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) {
                // ignore invalid status filter
            }
        }

        String facultyCode = normalizeFaculty(facultyRaw);
        if (facultyCode != null) {
            c = c.and("facultyCode").is(facultyCode);
        }

        String degreeCode = normalizeDegree(degreeRaw);
        if (degreeCode != null) {
            c = c.and("degreeCode").is(degreeCode);
        }

        if (currentTermRaw != null && !currentTermRaw.isBlank()) {
            c = c.and("currentTerm").is(currentTermRaw.trim().toUpperCase(Locale.ROOT));
        }

        if (search != null && !search.isBlank()) {
            Pattern p = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            c =
                    c.andOperator(
                            new Criteria()
                                    .orOperator(
                                            Criteria.where("name").regex(p),
                                            Criteria.where("label").regex(p),
                                            Criteria.where("facultyCode").regex(p),
                                            Criteria.where("degreeCode").regex(p),
                                            Criteria.where("id").regex(p)));
        }

        Query countQuery = Query.query(c);
        long total = mongoTemplate.count(countQuery, Intake.class);

        Query q = Query.query(c);
        q.with(resolveSort(sortRaw));
        q.skip((long) (safePage - 1) * safeSize);
        q.limit(safeSize);

        List<Intake> rows = mongoTemplate.find(q, Intake.class);
        List<IntakeApiResponse> items = rows.stream().map(this::toApi).collect(Collectors.toList());

        return PagedIntakeListResponse.builder()
                .items(items)
                .page(safePage)
                .pageSize(safeSize)
                .total(total)
                .totalCount(total)
                .build();
    }

    /** Lightweight list for dropdowns (faculty + degree filter). */
    public List<IntakeSummaryResponse> listForDropdown(String facultyCodeRaw, String degreeCodeRaw) {
        String facultyCode = normalizeFaculty(facultyCodeRaw);
        String degreeCode = normalizeDegree(degreeCodeRaw);
        List<Intake> list;
        if (facultyCode != null && degreeCode != null) {
            list = intakeRepository.findByFacultyCodeAndDegreeCodeOrderByCreatedAtDesc(facultyCode, degreeCode);
        } else if (facultyCode != null) {
            list = intakeRepository.findByFacultyCodeOrderByCreatedAtDesc(facultyCode);
        } else {
            list = intakeRepository.findAllByOrderByCreatedAtDesc();
        }
        return list.stream()
                .filter(i -> !i.isDeleted())
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public IntakeApiResponse getFull(String id) {
        Intake intake = intakeRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> notFound());
        return toApi(intake);
    }

    public IntakeMinimalResponse getMinimal(String id) {
        Intake intake = intakeRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> notFound());
        String nm = intake.resolveDisplayName();
        return IntakeMinimalResponse.builder()
                .id(intake.getId())
                .underscoreId(intake.getId())
                .name(nm)
                .currentTerm(intake.getCurrentTerm())
                .build();
    }

    public IntakeApiResponse create(IntakeCreateRequest req) {
        Intake entity = buildFromRequest(req, null);
        entity.setId(buildIntakeId(entity.getFacultyCode(), entity.getDegreeCode(), entity.resolveDisplayName()));
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        Intake saved = intakeRepository.save(entity);
        runDailyIntakeChecks(saved);
        return toApi(saved);
    }

    public IntakeApiResponse update(String id, IntakeCreateRequest req) {
        Intake existing = intakeRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> notFound());
        Intake merged = buildFromRequest(req, existing);
        merged.setId(existing.getId());
        merged.setCreatedAt(existing.getCreatedAt());
        merged.setUpdatedAt(Instant.now());
        Intake saved = intakeRepository.save(merged);
        runDailyIntakeChecks(saved);
        return toApi(saved);
    }

    public void softDelete(String id) {
        Intake intake = intakeRepository.findByIdAndDeletedFalse(id).orElseThrow(() -> notFound());
        intake.setDeleted(true);
        intake.setUpdatedAt(Instant.now());
        intakeRepository.save(intake);
    }

    private Intake buildFromRequest(IntakeCreateRequest req, Intake existing) {
        validateFacultyDegree(req.getFacultyCode(), req.getDegreeCode());
        String faculty = req.getFacultyCode().trim().toUpperCase(Locale.ROOT);
        String degree = req.getDegreeCode().trim();

        Integer year = req.getIntakeYear();
        String monthCanon = IntakeMonthUtils.sanitizeIntakeMonth(req.getIntakeMonth());
        String name = sanitizeIntakeName(req.getName(), year, monthCanon);

        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Intake name is required");
        }
        if (year == null || year < 2000 || year > 2100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid intake year");
        }
        if (monthCanon.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid intake month");
        }

        int defaultWeeks = req.getDefaultWeeksPerTerm() != null ? req.getDefaultWeeksPerTerm() : 16;
        defaultWeeks = Math.min(52, Math.max(1, defaultWeeks));
        int defaultNotify = req.getDefaultNotifyBeforeDays() != null ? req.getDefaultNotifyBeforeDays() : 3;
        if (defaultNotify != 1 && defaultNotify != 3 && defaultNotify != 7) {
            defaultNotify = 3;
        }

        List<TermScheduleRow> rawRows = mapDtoRows(req.getTermSchedules());
        boolean emptySched = rawRows.isEmpty();
        List<TermScheduleRow> schedules;
        if (emptySched) {
            schedules = IntakeTermScheduleHelper.emptyTermSchedule(defaultWeeks, defaultNotify);
        } else {
            schedules = IntakeTermScheduleHelper.sanitizeTermSchedules(rawRows, defaultWeeks, defaultNotify);
        }

        boolean autoGen = Boolean.TRUE.equals(req.getAutoGenerateFutureTerms())
                || Boolean.TRUE.equals(req.getAutoGenerateTerms());
        if (autoGen && emptySched) {
            schedules = IntakeTermScheduleHelper.sanitizeTermSchedules(schedules, defaultWeeks, defaultNotify);
        }

        if (IntakeTermScheduleHelper.hasInvalidTermScheduleRange(schedules)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Term end date must be after term start date");
        }

        String exclude = existing != null ? existing.getId() : null;
        if (hasConflict(faculty, degree, name, year, monthCanon, exclude)) {
            throw new ApiException(
                    HttpStatus.CONFLICT, "Intake already exists for the selected faculty and degree");
        }

        IntakeBatchStatus st = req.getStatus() != null ? req.getStatus() : IntakeBatchStatus.ACTIVE;

        String cohort = req.getStream() != null ? req.getStream().trim() : "";

        String studentIdPrefix = null;
        if (existing != null && existing.getStudentIdPrefix() != null && !existing.getStudentIdPrefix().isBlank()) {
            studentIdPrefix = existing.getStudentIdPrefix().trim();
        } else {
            int m = IntakeMonthUtils.monthNumber(monthCanon);
            if (m > 0 && year != null) {
                String shortDeg =
                        degree.length() >= 2 ? degree.substring(0, 2).toUpperCase(Locale.ROOT) : "XX";
                studentIdPrefix = shortDeg + String.format(Locale.ROOT, "%02d%02d", year % 100, m);
            }
        }

        List<IntakeNotificationEntry> notifs =
                existing != null && existing.getNotifications() != null
                        ? new ArrayList<>(existing.getNotifications())
                        : new ArrayList<>();

        return Intake.builder()
                .name(name)
                .label(name)
                .facultyCode(faculty)
                .degreeCode(degree)
                .intakeYear(year)
                .intakeMonth(monthCanon)
                .cohortStream(cohort)
                .status(st)
                .currentTerm(
                        existing != null && existing.getCurrentTerm() != null
                                ? existing.getCurrentTerm()
                                : "Y1S1")
                .autoJumpEnabled(req.getAutoJumpEnabled() != null ? req.getAutoJumpEnabled() : true)
                .lockPastTerms(Boolean.TRUE.equals(req.getLockPastTerms()))
                .defaultWeeksPerTerm(defaultWeeks)
                .defaultNotifyBeforeDays(defaultNotify)
                .autoGenerateFutureTerms(
                        req.getAutoGenerateFutureTerms() != null ? req.getAutoGenerateFutureTerms() : true)
                .termSchedules(schedules)
                .notifications(notifs)
                .deleted(false)
                .studentIdPrefix(studentIdPrefix)
                .build();
    }

    private static String sanitizeIntakeName(String raw, Integer year, String monthCanon) {
        if (raw != null && !raw.isBlank()) {
            return raw.trim();
        }
        if (year != null && monthCanon != null && !monthCanon.isEmpty()) {
            return year + " " + monthCanon;
        }
        return "";
    }

    private void validateFacultyDegree(String facultyRaw, String degreeRaw) {
        if (facultyRaw == null || facultyRaw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid faculty");
        }
        if (degreeRaw == null || degreeRaw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid degree for the selected faculty");
        }
        String facultyCode = facultyRaw.trim().toUpperCase(Locale.ROOT);
        Faculty faculty =
                facultyRepository.findByCodeAndIsDeletedFalse(facultyCode).orElse(null);
        if (faculty == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid faculty");
        }
        String degreeCode = degreeRaw.trim();
        LmsDegreeProgram degree =
                degreeProgramRepository.findByCodeAndIsDeletedFalse(degreeCode).orElse(null);
        if (degree == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid degree for the selected faculty");
        }
        if (!faculty.getCode().equalsIgnoreCase(degree.getFacultyCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid degree for the selected faculty");
        }
    }

    private boolean hasConflict(
            String faculty, String degree, String displayName, Integer year, String monthCanon, String excludeId) {
        String n = IntakeMonthUtils.normalizeName(displayName);
        for (Intake o : intakeRepository.findByFacultyCodeAndDegreeCodeAndDeletedFalse(faculty, degree)) {
            if (excludeId != null && excludeId.equals(o.getId())) {
                continue;
            }
            if (!n.isEmpty()
                    && IntakeMonthUtils.normalizeName(o.resolveDisplayName()).equals(n)) {
                return true;
            }
            if (year != null
                    && monthCanon != null
                    && !monthCanon.isEmpty()
                    && Objects.equals(year, o.getIntakeYear())) {
                String om = IntakeMonthUtils.sanitizeIntakeMonth(o.getIntakeMonth());
                if (monthCanon.equals(om)) {
                    return true;
                }
            }
        }
        return false;
    }

    private String buildIntakeId(String faculty, String degree, String displayName) {
        String slug =
                displayName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (slug.isEmpty()) {
            slug = "batch";
        }
        String base = "intk-" + faculty + "-" + degree + "-" + slug;
        if (base.length() > 120) {
            base = base.substring(0, 120);
        }
        String candidate = base;
        int tries = 0;
        while (intakeRepository.existsById(candidate) && tries < 40) {
            candidate = base + "-" + System.currentTimeMillis();
            tries++;
        }
        return candidate;
    }

    private List<TermScheduleRow> mapDtoRows(List<TermScheduleRowDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return new ArrayList<>();
        }
        List<TermScheduleRow> out = new ArrayList<>();
        for (TermScheduleRowDto d : dtos) {
            if (d == null || d.getTermCode() == null) {
                continue;
            }
            out.add(
                    TermScheduleRow.builder()
                            .termCode(d.getTermCode().trim().toUpperCase(Locale.ROOT))
                            .startDate(d.getStartDate())
                            .endDate(d.getEndDate())
                            .weeks(d.getWeeks())
                            .notifyBeforeDays(d.getNotifyBeforeDays())
                            .isManuallyCustomized(Boolean.TRUE.equals(d.getIsManuallyCustomized()))
                            .notificationSentAt(d.getNotificationSentAt())
                            .build());
        }
        return out;
    }

    private Sort resolveSort(String sortRaw) {
        if (sortRaw == null || sortRaw.isBlank() || "updated".equalsIgnoreCase(sortRaw)) {
            return Sort.by(Sort.Direction.DESC, "updatedAt");
        }
        if ("created".equalsIgnoreCase(sortRaw)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        if ("az".equalsIgnoreCase(sortRaw)) {
            return Sort.by(Sort.Direction.ASC, "name");
        }
        if ("za".equalsIgnoreCase(sortRaw)) {
            return Sort.by(Sort.Direction.DESC, "name");
        }
        return Sort.by(Sort.Direction.DESC, "updatedAt");
    }

    private String normalizeFaculty(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeDegree(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private IntakeApiResponse toApi(Intake i) {
        List<TermScheduleRow> rows = i.getTermSchedules() != null ? i.getTermSchedules() : List.of();
        return IntakeApiResponse.builder()
                .id(i.getId())
                .underscoreId(i.getId())
                .name(i.resolveDisplayName())
                .facultyCode(i.getFacultyCode())
                .degreeCode(i.getDegreeCode())
                .intakeYear(i.getIntakeYear())
                .intakeMonth(i.getIntakeMonth())
                .cohortStream(i.getCohortStream())
                .status(i.getStatus())
                .currentTerm(i.getCurrentTerm())
                .autoJumpEnabled(i.getAutoJumpEnabled())
                .lockPastTerms(i.getLockPastTerms())
                .defaultWeeksPerTerm(i.getDefaultWeeksPerTerm())
                .defaultNotifyBeforeDays(i.getDefaultNotifyBeforeDays())
                .autoGenerateFutureTerms(i.getAutoGenerateFutureTerms())
                .schedules(new ArrayList<>(rows))
                .termSchedules(new ArrayList<>(rows))
                .studentIdPrefix(i.getStudentIdPrefix())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }

    private IntakeSummaryResponse toSummary(Intake i) {
        return IntakeSummaryResponse.builder()
                .id(i.getId())
                .facultyCode(i.getFacultyCode())
                .degreeCode(i.getDegreeCode())
                .name(i.resolveDisplayName())
                .label(i.resolveDisplayName())
                .intakeYear(i.getIntakeYear())
                .intakeMonth(i.getIntakeMonth())
                .studentIdPrefix(i.getStudentIdPrefix())
                .status(i.getStatus())
                .build();
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "Intake not found");
    }

    private void runDailyIntakeChecks(Intake intake) {
        log.debug("runDailyIntakeChecks intakeId={}", intake.getId());
    }
}

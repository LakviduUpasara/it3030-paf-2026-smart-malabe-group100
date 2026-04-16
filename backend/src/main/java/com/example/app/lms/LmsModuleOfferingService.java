package com.example.app.lms;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.exception.ApiException;
import com.example.app.lms.document.CatalogModule;
import com.example.app.lms.document.LmsModuleOffering;
import com.example.app.lms.document.OfferingOutlineWeek;
import com.example.app.lms.document.OutlineWeek;
import com.example.app.lms.document.StaffAssigneeSnapshot;
import com.example.app.lms.dto.AssigneeIdRef;
import com.example.app.lms.dto.LmsModuleOfferingApiResponse;
import com.example.app.lms.dto.LmsModuleOfferingPageResponse;
import com.example.app.lms.dto.LmsModuleOfferingWriteRequest;
import com.example.app.lms.enums.ApplicableTermCode;
import com.example.app.lms.enums.LmsOfferingStatus;
import com.example.app.lms.enums.SyllabusVersion;
import com.example.app.lms.repository.CatalogModuleRepository;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import com.example.app.lms.repository.LmsModuleOfferingRepository;
import com.example.app.registration.document.Intake;
import com.example.app.registration.document.LabAssistant;
import com.example.app.registration.document.Lecturer;
import com.example.app.registration.document.TermScheduleRow;
import com.example.app.registration.repository.IntakeRepository;
import com.example.app.registration.repository.LabAssistantRepository;
import com.example.app.registration.repository.LecturerRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LmsModuleOfferingService {

    private static final Set<Integer> PAGE_SIZES = Set.of(10, 25, 50, 100);

    private final MongoHealthService mongoHealthService;
    private final LmsModuleOfferingRepository lmsModuleOfferingRepository;
    private final IntakeRepository intakeRepository;
    private final CatalogModuleRepository catalogModuleRepository;
    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final LecturerRepository lecturerRepository;
    private final LabAssistantRepository labAssistantRepository;
    private final MongoTemplate mongoTemplate;

    public LmsModuleOfferingApiResponse create(LmsModuleOfferingWriteRequest body) {
        mongoHealthService.requireConnection();
        ResolvedContext ctx = resolveOfferingContext(body);

        if (lmsModuleOfferingRepository.existsByIntakeIdAndTermCodeAndModuleCodeAndDeletedFalse(
                ctx.intakeId(), ctx.termCode(), ctx.moduleCode())) {
            throw new ApiException(HttpStatus.CONFLICT, "Module is already assigned for this intake term");
        }

        List<String> lecIds = mergeSanitizedIdLists(body.getAssignedLecturerIds(), body.getAssignedLecturers());
        List<String> labIds = mergeSanitizedIdLists(body.getAssignedLabAssistantIds(), body.getAssignedLabAssistants());
        validateLecturerAssignments(lecIds, ctx);
        validateLabAssistantAssignments(labIds, ctx);

        SyllabusVersion syllabus =
                body.getSyllabusVersion() != null ? body.getSyllabusVersion() : ctx.defaultSyllabusVersion();
        LmsOfferingStatus st = body.getStatus() != null ? body.getStatus() : LmsOfferingStatus.ACTIVE;

        List<OfferingOutlineWeek> outline = buildOutlineWeeks(ctx);
        boolean outlinePending = outline.isEmpty();

        LmsModuleOffering mo =
                LmsModuleOffering.builder()
                        .facultyCode(ctx.facultyCode())
                        .degreeCode(ctx.degreeCode())
                        .intakeId(ctx.intakeId())
                        .intakeName(ctx.intakeName())
                        .termCode(ctx.termCode())
                        .moduleId(ctx.moduleId())
                        .moduleCode(ctx.moduleCode())
                        .moduleName(ctx.moduleName())
                        .syllabusVersion(syllabus)
                        .status(st)
                        .assignedLecturerIds(lecIds)
                        .assignedLabAssistantIds(labIds)
                        .assignedLecturers(resolveLecturerSnapshots(lecIds))
                        .assignedLabAssistants(resolveLabSnapshots(labIds))
                        .outlineWeeks(outline)
                        .outlinePending(outlinePending)
                        .deleted(false)
                        .build();

        LmsModuleOffering saved = lmsModuleOfferingRepository.save(mo);
        return toApi(saved);
    }

    public LmsModuleOfferingApiResponse update(String id, LmsModuleOfferingWriteRequest body) {
        mongoHealthService.requireConnection();
        LmsModuleOffering existing =
                lmsModuleOfferingRepository
                        .findByIdAndDeletedFalse(id)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offering not found"));

        ResolvedContext ctx = resolveOfferingContext(body);

        boolean dup =
                lmsModuleOfferingRepository.existsByIntakeIdAndTermCodeAndModuleCodeAndDeletedFalse(
                        ctx.intakeId(), ctx.termCode(), ctx.moduleCode());
        if (dup
                && !(existing.getIntakeId().equals(ctx.intakeId())
                        && existing.getTermCode().equals(ctx.termCode())
                        && existing.getModuleCode().equals(ctx.moduleCode()))) {
            throw new ApiException(HttpStatus.CONFLICT, "Module is already assigned for this intake term");
        }

        List<String> lecIds = mergeSanitizedIdLists(body.getAssignedLecturerIds(), body.getAssignedLecturers());
        List<String> labIds = mergeSanitizedIdLists(body.getAssignedLabAssistantIds(), body.getAssignedLabAssistants());
        validateLecturerAssignments(lecIds, ctx);
        validateLabAssistantAssignments(labIds, ctx);

        SyllabusVersion syllabus =
                body.getSyllabusVersion() != null ? body.getSyllabusVersion() : ctx.defaultSyllabusVersion();
        LmsOfferingStatus st = body.getStatus() != null ? body.getStatus() : existing.getStatus();

        List<OfferingOutlineWeek> outline = buildOutlineWeeks(ctx);
        boolean outlinePending = outline.isEmpty();

        existing.setFacultyCode(ctx.facultyCode());
        existing.setDegreeCode(ctx.degreeCode());
        existing.setIntakeId(ctx.intakeId());
        existing.setIntakeName(ctx.intakeName());
        existing.setTermCode(ctx.termCode());
        existing.setModuleId(ctx.moduleId());
        existing.setModuleCode(ctx.moduleCode());
        existing.setModuleName(ctx.moduleName());
        existing.setSyllabusVersion(syllabus);
        existing.setStatus(st);
        existing.setAssignedLecturerIds(lecIds);
        existing.setAssignedLabAssistantIds(labIds);
        existing.setAssignedLecturers(resolveLecturerSnapshots(lecIds));
        existing.setAssignedLabAssistants(resolveLabSnapshots(labIds));
        existing.setOutlineWeeks(outline);
        existing.setOutlinePending(outlinePending);

        return toApi(lmsModuleOfferingRepository.save(existing));
    }

    public LmsModuleOfferingApiResponse getById(String id) {
        mongoHealthService.requireConnection();
        LmsModuleOffering mo =
                lmsModuleOfferingRepository
                        .findByIdAndDeletedFalse(id)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offering not found"));
        return toApi(mo);
    }

    public void softDelete(String id) {
        mongoHealthService.requireConnection();
        LmsModuleOffering mo =
                lmsModuleOfferingRepository
                        .findByIdAndDeletedFalse(id)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Offering not found"));
        mo.setDeleted(true);
        lmsModuleOfferingRepository.save(mo);
    }

    public LmsModuleOfferingPageResponse list(
            String facultyCode,
            String facultyId,
            String degreeCode,
            String degreeProgramId,
            String degreeId,
            String intakeName,
            String intakeId,
            String termCode,
            String moduleCode,
            String moduleId,
            String search,
            String status,
            String sort,
            int page,
            Integer pageSize) {
        mongoHealthService.requireConnection();

        String fc = firstNonBlank(facultyCode, facultyId);
        String dc = firstNonBlank(degreeCode, degreeProgramId, degreeId);

        if (termCode != null && !termCode.isBlank() && !ApplicableTermCode.isValid(termCode)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid termCode filter");
        }

        int ps = pageSize == null ? 25 : pageSize;
        if (!PAGE_SIZES.contains(ps)) {
            ps = 25;
        }
        int p = Math.max(1, page);

        Criteria c = Criteria.where("deleted").is(false);
        if (fc != null && !fc.isBlank()) {
            c = c.and("facultyCode").is(LmsCodeUtils.normalizeFacultyOrDegreeCode(fc));
        }
        if (dc != null && !dc.isBlank()) {
            c = c.and("degreeCode").is(LmsCodeUtils.normalizeFacultyOrDegreeCode(dc));
        }
        if (intakeId != null && !intakeId.isBlank()) {
            c = c.and("intakeId").is(intakeId.trim());
        }
        if (intakeName != null && !intakeName.isBlank()) {
            c = c.and("intakeName").regex(".*" + escapeRegex(intakeName.trim()) + ".*", "i");
        }
        if (termCode != null && !termCode.isBlank()) {
            c = c.and("termCode").is(termCode.trim().toUpperCase(Locale.ROOT));
        }
        if (moduleCode != null && !moduleCode.isBlank()) {
            c = c.and("moduleCode").is(LmsCodeUtils.normalizeModuleCode(moduleCode));
        }
        if (moduleId != null && !moduleId.isBlank()) {
            c = c.and("moduleId").is(LmsCodeUtils.normalizeModuleCode(moduleId));
        }
        if (status != null && !status.isBlank()) {
            c = c.and("status").is(status.trim().toUpperCase(Locale.ROOT));
        }
        if (search != null && !search.isBlank()) {
            String s = escapeRegex(search.trim());
            Criteria searchOr =
                    new Criteria()
                            .orOperator(
                                    Criteria.where("moduleCode").regex(".*" + s + ".*", "i"),
                                    Criteria.where("moduleName").regex(".*" + s + ".*", "i"));
            c = new Criteria().andOperator(c, searchOr);
        }

        Query q = new Query(c);
        long total = mongoTemplate.count(q, LmsModuleOffering.class);

        Sort srt = sortOffering(sort);
        q.with(PageRequest.of(p - 1, ps, srt));

        List<LmsModuleOffering> rows = mongoTemplate.find(q, LmsModuleOffering.class);
        List<LmsModuleOfferingApiResponse> items = rows.stream().map(this::toApi).toList();

        return LmsModuleOfferingPageResponse.builder()
                .items(items)
                .page(p)
                .pageSize(ps)
                .total(total)
                .build();
    }

    public List<StaffAssigneeSnapshot> listEligibleLecturers(
            String facultyCode, String degreeCode, String moduleCodeOrId) {
        mongoHealthService.requireConnection();
        String fc = requireNonBlank(facultyCode, "facultyCode");
        String dc = requireNonBlank(degreeCode, "degreeCode");
        String mc = requireNonBlank(moduleCodeOrId, "moduleCode");
        CatalogModule mod = resolveCatalogModule(mc).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Module not found"));
        String mcode = mod.getCode();

        List<Lecturer> all = lecturerRepository.findByStatusOrderByCreatedAtDesc(AccountStatus.ACTIVE);
        List<StaffAssigneeSnapshot> out = new ArrayList<>();
        for (Lecturer lec : all) {
            if (isStaffEligibleForOffering(lec.getFacultyIds(), lec.getDegreeProgramIds(), lec.getModuleIds(), fc, dc, mcode)) {
                out.add(
                        StaffAssigneeSnapshot.builder()
                                .id(lec.getId())
                                .fullName(lec.getFullName())
                                .loginEmail(lec.getLoginEmail())
                                .build());
            }
        }
        return out;
    }

    public List<StaffAssigneeSnapshot> listEligibleLabAssistants(
            String facultyCode, String degreeCode, String moduleCodeOrId) {
        mongoHealthService.requireConnection();
        String fc = requireNonBlank(facultyCode, "facultyCode");
        String dc = requireNonBlank(degreeCode, "degreeCode");
        String mc = requireNonBlank(moduleCodeOrId, "moduleCode");
        CatalogModule mod = resolveCatalogModule(mc).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Module not found"));
        String mcode = mod.getCode();

        List<LabAssistant> all = labAssistantRepository.findByStatusOrderByCreatedAtDesc(AccountStatus.ACTIVE);
        List<StaffAssigneeSnapshot> out = new ArrayList<>();
        for (LabAssistant la : all) {
            if (isStaffEligibleForOffering(la.getFacultyIds(), la.getDegreeProgramIds(), la.getModuleIds(), fc, dc, mcode)) {
                out.add(
                        StaffAssigneeSnapshot.builder()
                                .id(la.getId())
                                .fullName(la.getFullName())
                                .loginEmail(la.getLoginEmail())
                                .build());
            }
        }
        return out;
    }

    private static String requireNonBlank(String v, String name) {
        if (v == null || v.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, name + " is required");
        }
        return v.trim();
    }

    private static boolean isStaffEligibleForOffering(
            List<String> facultyIds,
            List<String> degreeIds,
            List<String> moduleIds,
            String facultyCode,
            String degreeCode,
            String moduleCode) {
        String fc = LmsCodeUtils.normalizeFacultyOrDegreeCode(facultyCode);
        String dc = LmsCodeUtils.normalizeFacultyOrDegreeCode(degreeCode);
        String mc = LmsCodeUtils.normalizeModuleCode(moduleCode);
        boolean fOk = facultyIds != null && facultyIds.stream().anyMatch(x -> fc.equalsIgnoreCase(x.trim()));
        boolean dOk = degreeIds != null && degreeIds.stream().anyMatch(x -> dc.equalsIgnoreCase(x.trim()));
        boolean mOk = moduleIds != null && moduleIds.stream().anyMatch(x -> mc.equalsIgnoreCase(LmsCodeUtils.normalizeModuleCode(x)));
        return fOk && dOk && mOk;
    }

    private Sort sortOffering(String sort) {
        if (sort == null || sort.isBlank() || "updated".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "updatedAt");
        }
        if ("module".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "moduleCode");
        }
        if ("term".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "termCode");
        }
        return Sort.by(Sort.Direction.DESC, "updatedAt");
    }

    private static String escapeRegex(String s) {
        return s.replaceAll("([\\\\.*+?\\[\\](){}|^$])", "\\\\$1");
    }

    private void validateLecturerAssignments(List<String> ids, ResolvedContext ctx) {
        for (String id : ids) {
            Lecturer lec =
                    lecturerRepository
                            .findById(id)
                            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid lecturer assignment: " + id));
            if (lec.getStatus() != AccountStatus.ACTIVE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid lecturer assignment: " + id);
            }
            if (!isStaffEligibleForOffering(
                    lec.getFacultyIds(), lec.getDegreeProgramIds(), lec.getModuleIds(),
                    ctx.facultyCode(), ctx.degreeCode(), ctx.moduleCode())) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Lecturer is not eligible for this faculty, degree, and module: " + id);
            }
        }
    }

    private void validateLabAssistantAssignments(List<String> ids, ResolvedContext ctx) {
        for (String id : ids) {
            LabAssistant la =
                    labAssistantRepository
                            .findById(id)
                            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid lab assistant assignment: " + id));
            if (la.getStatus() != AccountStatus.ACTIVE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid lab assistant assignment: " + id);
            }
            if (!isStaffEligibleForOffering(
                    la.getFacultyIds(), la.getDegreeProgramIds(), la.getModuleIds(),
                    ctx.facultyCode(), ctx.degreeCode(), ctx.moduleCode())) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Lab assistant is not eligible for this faculty, degree, and module: " + id);
            }
        }
    }

    private List<StaffAssigneeSnapshot> resolveLecturerSnapshots(List<String> ids) {
        List<StaffAssigneeSnapshot> out = new ArrayList<>();
        for (String id : ids) {
            lecturerRepository
                    .findById(id)
                    .ifPresent(
                            lec ->
                                    out.add(
                                            StaffAssigneeSnapshot.builder()
                                                    .id(lec.getId())
                                                    .fullName(lec.getFullName())
                                                    .loginEmail(lec.getLoginEmail())
                                                    .build()));
        }
        return out;
    }

    private List<StaffAssigneeSnapshot> resolveLabSnapshots(List<String> ids) {
        List<StaffAssigneeSnapshot> out = new ArrayList<>();
        for (String id : ids) {
            labAssistantRepository
                    .findById(id)
                    .ifPresent(
                            la ->
                                    out.add(
                                            StaffAssigneeSnapshot.builder()
                                                    .id(la.getId())
                                                    .fullName(la.getFullName())
                                                    .loginEmail(la.getLoginEmail())
                                                    .build()));
        }
        return out;
    }

    private List<OfferingOutlineWeek> buildOutlineWeeks(ResolvedContext ctx) {
        LocalDate termStart = resolveTermStart(ctx.intake(), ctx.termCode());
        if (termStart == null) {
            return List.of();
        }
        List<OutlineWeek> template = ctx.module().getOutlineTemplate();
        if (template == null || template.isEmpty()) {
            return List.of();
        }
        List<OutlineWeek> sorted =
                template.stream()
                        .sorted(Comparator.comparingInt(OutlineWeek::getWeekNo))
                        .collect(Collectors.toList());
        List<OfferingOutlineWeek> out = new ArrayList<>();
        for (OutlineWeek w : sorted) {
            int idx = Math.max(0, w.getWeekNo() - 1);
            LocalDate start = termStart.plusWeeks(idx);
            LocalDate end = start.plusDays(6);
            out.add(
                    OfferingOutlineWeek.builder()
                            .weekNo(w.getWeekNo())
                            .title(w.getTitle())
                            .type(w.getType())
                            .startDate(start)
                            .endDate(end)
                            .build());
        }
        return out;
    }

    private LocalDate resolveTermStart(Intake intake, String termCode) {
        String tc = termCode.toUpperCase(Locale.ROOT);
        List<TermScheduleRow> rows = intake.getTermSchedules();
        if (rows == null) {
            return null;
        }
        for (TermScheduleRow r : rows) {
            if (r.getTermCode() != null && tc.equals(r.getTermCode().trim().toUpperCase(Locale.ROOT))) {
                return r.getStartDate();
            }
        }
        return null;
    }

    private ResolvedContext resolveOfferingContext(LmsModuleOfferingWriteRequest body) {
        String facultyCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(firstNonBlank(body.getFacultyCode(), body.getFacultyId()));
        String degreeCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(firstNonBlank(body.getDegreeCode(), body.getDegreeProgramId()));
        if (facultyCode.isEmpty() || degreeCode.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "facultyCode and degreeCode are required");
        }

        String termRaw = body.getTermCode();
        if (termRaw == null || termRaw.isBlank() || !ApplicableTermCode.isValid(termRaw)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid semester / term");
        }
        String termCode = termRaw.trim().toUpperCase(Locale.ROOT);

        Intake intake = resolveIntake(body, facultyCode, degreeCode);
        if (!facultyCode.equalsIgnoreCase(intake.getFacultyCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected intake does not belong to the selected faculty");
        }
        if (!degreeCode.equalsIgnoreCase(intake.getDegreeCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected intake does not belong to the selected degree");
        }
        enforceIntakeTermConfigured(intake, termCode);

        CatalogModule module = resolveCatalogModule(firstNonBlank(body.getModuleId(), body.getModuleCode()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Module not found"));

        if (!facultyCode.equalsIgnoreCase(module.getFacultyCode())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Module does not belong to the selected faculty");
        }
        if (module.getApplicableDegrees().stream().noneMatch(d -> degreeCode.equalsIgnoreCase(d.trim()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Module is not applicable for the selected degree");
        }
        if (module.getApplicableTerms().stream().noneMatch(t -> termCode.equalsIgnoreCase(t.trim()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Module is not applicable for the selected term");
        }

        SyllabusVersion def =
                module.getDefaultSyllabusVersion() != null ? module.getDefaultSyllabusVersion() : SyllabusVersion.NEW;

        String intakeName = intake.resolveDisplayName();
        return new ResolvedContext(
                facultyCode.toUpperCase(Locale.ROOT),
                degreeCode.toUpperCase(Locale.ROOT),
                intake.getId(),
                intakeName,
                termCode,
                module.getCode(),
                module.getCode(),
                module.getName(),
                def,
                module,
                intake);
    }

    private void enforceIntakeTermConfigured(Intake intake, String termCode) {
        List<TermScheduleRow> rows = intake.getTermSchedules();
        if (rows == null || rows.isEmpty()) {
            return;
        }
        Set<String> configured =
                rows.stream()
                        .map(TermScheduleRow::getTermCode)
                        .filter(Objects::nonNull)
                        .map(s -> s.trim().toUpperCase(Locale.ROOT))
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toSet());
        if (configured.isEmpty()) {
            return;
        }
        if (!configured.contains(termCode.toUpperCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected term is not configured for this intake");
        }
    }

    private Intake resolveIntake(LmsModuleOfferingWriteRequest body, String facultyCode, String degreeCode) {
        if (body.getIntakeId() != null && !body.getIntakeId().isBlank()) {
            return intakeRepository
                    .findByIdAndDeletedFalse(body.getIntakeId().trim())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Intake not found"));
        }
        String name = body.getIntakeName();
        if (name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "intakeId or intakeName is required");
        }
        List<Intake> list = intakeRepository.findByFacultyCodeAndDegreeCodeAndDeletedFalse(facultyCode, degreeCode);
        String target = name.trim().toLowerCase(Locale.ROOT);
        for (Intake i : list) {
            String n = i.resolveDisplayName().toLowerCase(Locale.ROOT);
            if (n.equals(target)) {
                return i;
            }
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Intake not found");
    }

    private Optional<CatalogModule> resolveCatalogModule(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String code = LmsCodeUtils.normalizeModuleCode(raw);
        return catalogModuleRepository.findByCodeAndIsDeletedFalse(code);
    }

    private LmsModuleOfferingApiResponse toApi(LmsModuleOffering mo) {
        String facultyName =
                facultyRepository
                        .findByCodeAndIsDeletedFalse(mo.getFacultyCode())
                        .map(f -> f.getName())
                        .orElse("");
        String degreeName =
                degreeProgramRepository
                        .findByCodeAndIsDeletedFalse(mo.getDegreeCode())
                        .map(d -> d.getName())
                        .orElse("");

        return LmsModuleOfferingApiResponse.builder()
                .id(mo.getId())
                .faculty(LmsModuleOfferingApiResponse.Ref.builder().code(mo.getFacultyCode()).name(facultyName).build())
                .degree(LmsModuleOfferingApiResponse.Ref.builder().code(mo.getDegreeCode()).name(degreeName).build())
                .intake(LmsModuleOfferingApiResponse.IntakeRef.builder().id(mo.getIntakeId()).name(mo.getIntakeName()).build())
                .module(
                        LmsModuleOfferingApiResponse.ModuleRef.builder()
                                .id(mo.getModuleId())
                                .code(mo.getModuleCode())
                                .name(mo.getModuleName())
                                .build())
                .termCode(mo.getTermCode())
                .syllabusVersion(mo.getSyllabusVersion())
                .status(mo.getStatus())
                .lecturers(mo.getAssignedLecturers())
                .labAssistants(mo.getAssignedLabAssistants())
                .outlineWeeks(mo.getOutlineWeeks())
                .outlinePending(mo.isOutlinePending())
                .hasGrades(mo.isHasGrades())
                .hasAttendance(mo.isHasAttendance())
                .hasContent(mo.isHasContent())
                .updatedAt(mo.getUpdatedAt())
                .createdAt(mo.getCreatedAt())
                .build();
    }

    private static List<String> mergeSanitizedIdLists(List<String> ids, List<AssigneeIdRef> legacy) {
        LinkedHashSet<String> s = new LinkedHashSet<>();
        if (ids != null) {
            for (String id : ids) {
                if (id != null && !id.isBlank()) {
                    s.add(id.trim());
                }
            }
        }
        if (legacy != null) {
            for (AssigneeIdRef r : legacy) {
                if (r != null && r.getId() != null && !r.getId().isBlank()) {
                    s.add(r.getId().trim());
                }
            }
        }
        return new ArrayList<>(s);
    }

    private static String firstNonBlank(String... vals) {
        if (vals == null) {
            return null;
        }
        for (String v : vals) {
            if (v != null && !v.isBlank()) {
                return v.trim();
            }
        }
        return null;
    }

    private record ResolvedContext(
            String facultyCode,
            String degreeCode,
            String intakeId,
            String intakeName,
            String termCode,
            String moduleId,
            String moduleCode,
            String moduleName,
            SyllabusVersion defaultSyllabusVersion,
            CatalogModule module,
            Intake intake) {}
}

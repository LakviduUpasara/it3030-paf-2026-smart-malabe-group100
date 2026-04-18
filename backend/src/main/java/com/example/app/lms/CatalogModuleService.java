package com.example.app.lms;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.CatalogModule;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.document.OutlineWeek;
import com.example.app.lms.dto.CatalogModuleCreateRequest;
import com.example.app.lms.dto.CatalogModuleResponse;
import com.example.app.lms.dto.CatalogModuleUpdateRequest;
import com.example.app.lms.dto.OutlineWeekDto;
import com.example.app.lms.dto.PagedResponse;
import com.example.app.lms.enums.ApplicableTermCode;
import com.example.app.lms.enums.OutlineWeekType;
import com.example.app.lms.enums.SyllabusVersion;
import com.example.app.lms.repository.CatalogModuleRepository;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CatalogModuleService {

    private static final Set<Integer> ALLOWED_PAGE_SIZES = Set.of(10, 25, 50, 100);

    private final CatalogModuleRepository catalogModuleRepository;
    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final MongoHealthService mongoHealthService;

    public CatalogModuleResponse create(CatalogModuleCreateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeModuleCode(request.getCode());
        if (!LmsCodeUtils.isValidModuleCode(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Module code is required after normalization");
        }
        String name = trim(request.getName());
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Module name is required");
        }
        int credits = requireCredits(request.getCredits());
        String facultyCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getFacultyCode());
        ensureFaculty(facultyCode);

        List<String> terms = normalizeApplicableTerms(request.getApplicableTerms());
        if (terms.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one applicable term");
        }
        List<String> degreeCodes = normalizeDegreeCodes(request.getApplicableDegrees());
        if (degreeCodes.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one applicable degree");
        }
        validateDegreesForFaculty(facultyCode, degreeCodes);

        if (request.getDefaultSyllabusVersion() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Default syllabus version is required");
        }

        List<OutlineWeek> outline = sanitizeOutline(request.getOutlineTemplate());

        if (catalogModuleRepository.existsByCodeAndIsDeletedFalse(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "Module code already exists");
        }

        CatalogModule module = CatalogModule.builder()
                .code(code)
                .name(name)
                .credits(credits)
                .facultyCode(facultyCode)
                .applicableTerms(terms)
                .applicableDegrees(degreeCodes)
                .defaultSyllabusVersion(request.getDefaultSyllabusVersion())
                .outlineTemplate(outline)
                .isDeleted(false)
                .build();

        try {
            CatalogModule saved = catalogModuleRepository.save(module);
            return map(saved);
        } catch (DuplicateKeyException e) {
            throw new ApiException(HttpStatus.CONFLICT, "Module code already exists");
        }
    }

    public PagedResponse<CatalogModuleResponse> list(
            String search,
            String facultyCode,
            String degreeIds,
            String term,
            String sort,
            Integer page,
            Integer pageSizeRaw) {

        mongoHealthService.requireConnection();
        List<CatalogModule> all = catalogModuleRepository.findByIsDeletedFalseOrderByUpdatedAtDesc();

        Stream<CatalogModule> stream = all.stream();
        if (facultyCode != null && !facultyCode.isBlank()) {
            String fc = facultyCode.trim().toUpperCase(Locale.ROOT);
            stream = stream.filter(m -> fc.equalsIgnoreCase(m.getFacultyCode()));
        }
        if (term != null && !term.isBlank()) {
            String t = term.trim().toUpperCase(Locale.ROOT);
            stream = stream.filter(m -> m.getApplicableTerms().contains(t));
        }
        if (degreeIds != null && !degreeIds.isBlank()) {
            Set<String> wanted = Stream.of(degreeIds.split(","))
                    .map(s -> s.trim().toUpperCase(Locale.ROOT))
                    .collect(Collectors.toSet());
            stream = stream.filter(m -> m.getApplicableDegrees().stream().anyMatch(wanted::contains));
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase(Locale.ROOT);
            stream = stream.filter(
                    m -> m.getName().toLowerCase(Locale.ROOT).contains(s)
                            || m.getCode().toLowerCase(Locale.ROOT).contains(s));
        }

        Comparator<CatalogModule> comparator = Comparator.comparing(
                CatalogModule::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        if ("code".equalsIgnoreCase(sort)) {
            comparator = Comparator.comparing(CatalogModule::getCode, String.CASE_INSENSITIVE_ORDER);
        }

        List<CatalogModule> filtered = stream.sorted(comparator).collect(Collectors.toList());

        int pageSize = normalizePageSize(pageSizeRaw);
        int p = page == null || page < 1 ? 1 : page;
        long total = filtered.size();
        int from = Math.min((p - 1) * pageSize, filtered.size());
        int to = Math.min(from + pageSize, filtered.size());
        List<CatalogModuleResponse> items = filtered.subList(from, to).stream()
                .map(this::map)
                .collect(Collectors.toList());

        return PagedResponse.<CatalogModuleResponse>builder()
                .items(items)
                .page(p)
                .pageSize(pageSize)
                .totalCount(total)
                .build();
    }

    public List<CatalogModuleResponse> listApplicable(String facultyCodeRaw, String degreeIdRaw, String termRaw) {
        mongoHealthService.requireConnection();
        if (facultyCodeRaw == null
                || facultyCodeRaw.isBlank()
                || degreeIdRaw == null
                || degreeIdRaw.isBlank()
                || termRaw == null
                || termRaw.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "facultyCode / degreeId / term is required");
        }
        String facultyCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(facultyCodeRaw);
        String degreeId = LmsCodeUtils.normalizeFacultyOrDegreeCode(degreeIdRaw);
        String term = termRaw.trim().toUpperCase(Locale.ROOT);
        if (!ApplicableTermCode.isValid(term)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid semester / term");
        }
        List<CatalogModule> list =
                catalogModuleRepository.findByFacultyCodeAndIsDeletedFalseOrderByUpdatedAtDesc(facultyCode);
        return list.stream()
                .filter(m -> m.getApplicableDegrees().stream().anyMatch(d -> degreeId.equalsIgnoreCase(d.trim())))
                .filter(m -> m.getApplicableTerms().stream().anyMatch(t -> term.equalsIgnoreCase(t.trim())))
                .sorted(Comparator.comparing(CatalogModule::getCode, String.CASE_INSENSITIVE_ORDER))
                .map(this::map)
                .collect(Collectors.toList());
    }

    public CatalogModuleResponse update(String codeParam, CatalogModuleUpdateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeModuleCode(codeParam);
        CatalogModule module = catalogModuleRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Module not found"));

        String facultyCode = module.getFacultyCode();
        if (request.getFacultyCode() != null) {
            facultyCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getFacultyCode());
            ensureFaculty(facultyCode);
            module.setFacultyCode(facultyCode);
        }
        if (request.getName() != null) {
            String name = trim(request.getName());
            if (name.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Module name is required");
            }
            module.setName(name);
        }
        if (request.getCredits() != null) {
            module.setCredits(requireCredits(request.getCredits()));
        }
        if (request.getApplicableTerms() != null) {
            List<String> terms = normalizeApplicableTerms(request.getApplicableTerms());
            if (terms.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one applicable term");
            }
            module.setApplicableTerms(terms);
        }
        if (request.getApplicableDegrees() != null) {
            List<String> degreeCodes = normalizeDegreeCodes(request.getApplicableDegrees());
            if (degreeCodes.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one applicable degree");
            }
            validateDegreesForFaculty(module.getFacultyCode(), degreeCodes);
            module.setApplicableDegrees(degreeCodes);
        }
        if (request.getDefaultSyllabusVersion() != null) {
            module.setDefaultSyllabusVersion(request.getDefaultSyllabusVersion());
        }
        if (request.getOutlineTemplate() != null) {
            module.setOutlineTemplate(sanitizeOutline(request.getOutlineTemplate()));
        }

        CatalogModule saved = catalogModuleRepository.save(module);
        return map(saved);
    }

    public void softDelete(String codeParam) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeModuleCode(codeParam);
        CatalogModule module = catalogModuleRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Module not found"));
        module.setDeleted(true);
        catalogModuleRepository.save(module);
    }

    private void ensureFaculty(String facultyCode) {
        facultyRepository.findByCodeAndIsDeletedFalse(facultyCode).orElseThrow(
                () -> new ApiException(HttpStatus.BAD_REQUEST, "Select a valid faculty"));
    }

    private void validateDegreesForFaculty(String facultyCode, List<String> degreeCodes) {
        for (String dc : degreeCodes) {
            LmsDegreeProgram dp = degreeProgramRepository
                    .findByCodeAndIsDeletedFalse(dc)
                    .orElse(null);
            if (dp == null || !Objects.equals(dp.getFacultyCode().toUpperCase(Locale.ROOT), facultyCode.toUpperCase(Locale.ROOT))) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid degree mapping for " + dc);
            }
        }
    }

    private static List<String> normalizeApplicableTerms(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        Set<String> selected = new HashSet<>();
        for (String t : raw) {
            if (t == null) {
                continue;
            }
            String u = t.trim().toUpperCase(Locale.ROOT);
            if (ApplicableTermCode.isValid(u)) {
                selected.add(u);
            }
        }
        return ApplicableTermCode.ORDERED.stream()
                .map(Enum::name)
                .filter(selected::contains)
                .collect(Collectors.toList());
    }

    private static List<String> normalizeDegreeCodes(List<String> raw) {
        if (raw == null) {
            return List.of();
        }
        return raw.stream()
                .filter(Objects::nonNull)
                .map(s -> LmsCodeUtils.normalizeFacultyOrDegreeCode(s))
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    private static List<OutlineWeek> sanitizeOutline(List<OutlineWeekDto> raw) {
        if (raw == null) {
            return new ArrayList<>();
        }
        List<OutlineWeek> out = new ArrayList<>();
        for (OutlineWeekDto row : raw) {
            if (row == null) {
                continue;
            }
            int w = row.getWeekNo();
            if (w < 1 || w > 60) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Outline week must be between 1 and 60");
            }
            String title = trim(row.getTitle());
            if (title.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Outline week title is required");
            }
            OutlineWeekType type = row.getType() != null ? row.getType() : OutlineWeekType.OTHER;
            out.add(OutlineWeek.builder().weekNo(w).title(title).type(type).build());
        }
        out.sort(Comparator.comparingInt(OutlineWeek::getWeekNo));
        return out;
    }

    private static int requireCredits(Integer c) {
        if (c == null || c < 1 || c > 30) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Credits must be greater than 0");
        }
        return c;
    }

    private static int normalizePageSize(Integer raw) {
        if (raw == null) {
            return 25;
        }
        if (!ALLOWED_PAGE_SIZES.contains(raw)) {
            return 25;
        }
        return raw;
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    private CatalogModuleResponse map(CatalogModule m) {
        List<OutlineWeekDto> outline = m.getOutlineTemplate().stream()
                .map(
                        w -> {
                            OutlineWeekDto dto = new OutlineWeekDto();
                            dto.setWeekNo(w.getWeekNo());
                            dto.setTitle(w.getTitle());
                            dto.setType(w.getType());
                            return dto;
                        })
                .collect(Collectors.toList());

        return CatalogModuleResponse.builder()
                .code(m.getCode())
                .name(m.getName())
                .credits(m.getCredits())
                .facultyCode(m.getFacultyCode())
                .applicableTerms(m.getApplicableTerms())
                .applicableDegrees(m.getApplicableDegrees())
                .defaultSyllabusVersion(
                        m.getDefaultSyllabusVersion() != null ? m.getDefaultSyllabusVersion() : SyllabusVersion.OLD)
                .outlineTemplate(outline)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}

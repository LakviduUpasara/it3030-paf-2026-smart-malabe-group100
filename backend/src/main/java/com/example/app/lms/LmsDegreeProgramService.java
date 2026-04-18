package com.example.app.lms;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.dto.DegreeProgramCreateRequest;
import com.example.app.lms.dto.DegreeProgramResponse;
import com.example.app.lms.dto.DegreeProgramUpdateRequest;
import com.example.app.lms.dto.PagedResponse;
import com.example.app.lms.enums.DegreeProgramLifecycleStatus;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import java.util.Comparator;
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
public class LmsDegreeProgramService {

    private static final Set<Integer> ALLOWED_PAGE_SIZES = Set.of(10, 25, 50, 100);

    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final FacultyRepository facultyRepository;
    private final MongoHealthService mongoHealthService;
    private final AcademicReferenceCacheService academicReferenceCacheService;

    public DegreeProgramResponse create(DegreeProgramCreateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getCode());
        if (!LmsCodeUtils.isValidFacultyOrDegreeCode(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use 2–6 uppercase letters");
        }
        String name = trimToEmpty(request.getName());
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Program name is required");
        }
        String facultyCode = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getFacultyCode());
        ensureFacultyExists(facultyCode);
        String award = trimToEmpty(request.getAward());
        if (award.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Award is required");
        }
        int credits = requirePositiveInt(request.getCredits(), "Credits must be greater than 0");
        int durationYears = requirePositiveInt(request.getDurationYears(), "Duration must be greater than 0");
        DegreeProgramLifecycleStatus status = request.getStatus() != null
                ? request.getStatus()
                : DegreeProgramLifecycleStatus.DRAFT;

        if (degreeProgramRepository.existsByCodeAndIsDeletedFalse(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "Program code already exists");
        }

        LmsDegreeProgram entity = LmsDegreeProgram.builder()
                .code(code)
                .name(name)
                .facultyCode(facultyCode)
                .award(award)
                .credits(credits)
                .durationYears(durationYears)
                .status(status)
                .isDeleted(false)
                .build();

        try {
            LmsDegreeProgram saved = degreeProgramRepository.save(entity);
            academicReferenceCacheService.syncAcademicReferenceCaches(true);
            return map(saved);
        } catch (DuplicateKeyException e) {
            throw new ApiException(HttpStatus.CONFLICT, "Program code already exists");
        }
    }

    public PagedResponse<DegreeProgramResponse> list(
            String search,
            String faculty,
            String code,
            String award,
            Integer creditsMin,
            Integer creditsMax,
            Integer durationYears,
            String status,
            String sort,
            Integer page,
            Integer pageSizeRaw) {

        mongoHealthService.requireConnection();
        List<LmsDegreeProgram> all = degreeProgramRepository.findByIsDeletedFalseOrderByUpdatedAtDesc();

        Stream<LmsDegreeProgram> stream = all.stream();
        if (faculty != null && !faculty.isBlank()) {
            String fc = faculty.trim().toUpperCase(Locale.ROOT);
            stream = stream.filter(d -> fc.equalsIgnoreCase(d.getFacultyCode()));
        }
        if (code != null && !code.isBlank()) {
            String c = code.trim().toUpperCase(Locale.ROOT);
            stream = stream.filter(d -> d.getCode().toUpperCase(Locale.ROOT).contains(c));
        }
        if (award != null && !award.isBlank()) {
            String a = award.toLowerCase(Locale.ROOT);
            stream = stream.filter(d -> d.getAward().toLowerCase(Locale.ROOT).contains(a));
        }
        if (creditsMin != null) {
            stream = stream.filter(d -> d.getCredits() >= creditsMin);
        }
        if (creditsMax != null) {
            stream = stream.filter(d -> d.getCredits() <= creditsMax);
        }
        if (durationYears != null) {
            stream = stream.filter(d -> d.getDurationYears() == durationYears);
        }
        if (status != null && !status.isBlank()) {
            DegreeProgramLifecycleStatus st = parseStatus(status);
            stream = stream.filter(d -> d.getStatus() == st);
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase(Locale.ROOT);
            stream = stream.filter(
                    d -> d.getName().toLowerCase(Locale.ROOT).contains(s)
                            || d.getCode().toLowerCase(Locale.ROOT).contains(s));
        }

        Comparator<LmsDegreeProgram> comparator = switch (sort != null ? sort.toLowerCase(Locale.ROOT) : "updated") {
            case "created" -> Comparator.comparing(LmsDegreeProgram::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case "az" -> Comparator.comparing(LmsDegreeProgram::getName, String.CASE_INSENSITIVE_ORDER);
            case "za" -> Comparator.comparing(LmsDegreeProgram::getName, String.CASE_INSENSITIVE_ORDER).reversed();
            default -> Comparator.comparing(LmsDegreeProgram::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
        };

        List<LmsDegreeProgram> filtered = stream.sorted(comparator).collect(Collectors.toList());

        int pageSize = normalizePageSize(pageSizeRaw);
        int p = page == null || page < 1 ? 1 : page;
        long total = filtered.size();
        int from = Math.min((p - 1) * pageSize, filtered.size());
        int to = Math.min(from + pageSize, filtered.size());
        List<DegreeProgramResponse> items = filtered.subList(from, to).stream()
                .map(this::map)
                .collect(Collectors.toList());

        return PagedResponse.<DegreeProgramResponse>builder()
                .items(items)
                .page(p)
                .pageSize(pageSize)
                .totalCount(total)
                .build();
    }

    public DegreeProgramResponse update(String codeParam, DegreeProgramUpdateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(codeParam);
        LmsDegreeProgram entity = degreeProgramRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Program not found"));

        if (request.getName() != null) {
            String name = trimToEmpty(request.getName());
            if (name.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Program name is required");
            }
            entity.setName(name);
        }
        if (request.getFacultyCode() != null) {
            String fc = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getFacultyCode());
            ensureFacultyExists(fc);
            entity.setFacultyCode(fc);
        }
        if (request.getAward() != null) {
            String award = trimToEmpty(request.getAward());
            if (award.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Award is required");
            }
            entity.setAward(award);
        }
        if (request.getCredits() != null) {
            entity.setCredits(requirePositiveInt(request.getCredits(), "Credits must be greater than 0"));
        }
        if (request.getDurationYears() != null) {
            entity.setDurationYears(requirePositiveInt(request.getDurationYears(), "Duration must be greater than 0"));
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        LmsDegreeProgram saved = degreeProgramRepository.save(entity);
        academicReferenceCacheService.syncAcademicReferenceCaches(true);
        return map(saved);
    }

    public void softDelete(String codeParam) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(codeParam);
        LmsDegreeProgram entity = degreeProgramRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Program not found"));
        entity.setDeleted(true);
        degreeProgramRepository.save(entity);
        academicReferenceCacheService.syncAcademicReferenceCaches(true);
    }

    private void ensureFacultyExists(String facultyCode) {
        Faculty f = facultyRepository.findByCodeAndIsDeletedFalse(facultyCode).orElse(null);
        if (f == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid faculty");
        }
    }

    private static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static int requirePositiveInt(Integer v, String message) {
        if (v == null || v <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return v;
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

    private static DegreeProgramLifecycleStatus parseStatus(String raw) {
        try {
            return DegreeProgramLifecycleStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            return DegreeProgramLifecycleStatus.DRAFT;
        }
    }

    private DegreeProgramResponse map(LmsDegreeProgram d) {
        return DegreeProgramResponse.builder()
                .code(d.getCode())
                .name(d.getName())
                .facultyCode(d.getFacultyCode())
                .award(d.getAward())
                .credits(d.getCredits())
                .durationYears(d.getDurationYears())
                .status(d.getStatus())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}

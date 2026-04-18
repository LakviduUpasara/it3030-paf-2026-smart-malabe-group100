package com.example.app.registration;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.CatalogModule;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.document.LmsDegreeProgram;
import com.example.app.lms.repository.CatalogModuleRepository;
import com.example.app.lms.repository.FacultyRepository;
import com.example.app.lms.repository.LmsDegreeProgramRepository;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StaffEligibilityService {

    private final FacultyRepository facultyRepository;
    private final LmsDegreeProgramRepository degreeProgramRepository;
    private final CatalogModuleRepository catalogModuleRepository;

    /**
     * Validates faculty / degree / module scope against Mongo catalog. Returns deduped canonical ids.
     */
    public StaffScopeResult validateStaffEligibilityWithDb(
            List<String> facultyIdsRaw, List<String> degreeProgramIdsRaw, List<String> moduleIdsRaw) {

        List<String> facultyIds = dedupeUpper(facultyIdsRaw);
        List<String> degreeProgramIds = dedupePreserve(degreeProgramIdsRaw);
        List<String> moduleRaw = dedupePreserve(moduleIdsRaw);

        for (String code : facultyIds) {
            Faculty faculty =
                    facultyRepository.findByCodeAndIsDeletedFalse(code).orElse(null);
            if (faculty == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid faculty selected: " + code);
            }
        }

        List<LmsDegreeProgram> degrees = new ArrayList<>();
        for (String code : degreeProgramIds) {
            LmsDegreeProgram degree =
                    degreeProgramRepository.findByCodeAndIsDeletedFalse(code).orElse(null);
            if (degree == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid degree selected: " + code);
            }
            degrees.add(degree);
        }

        if (!facultyIds.isEmpty() && !degreeProgramIds.isEmpty()) {
            for (LmsDegreeProgram degree : degrees) {
                if (!facultyIds.contains(degree.getFacultyCode())) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Degree " + degree.getCode() + " does not belong to selected faculties");
                }
            }
        }

        List<String> resolvedModuleIds = new ArrayList<>();
        for (String raw : moduleRaw) {
            CatalogModule module = resolveModule(raw).orElse(null);
            if (module == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid module selected: " + raw);
            }
            String canonicalId = module.getCode();
            if (!facultyIds.isEmpty() && !facultyIds.contains(module.getFacultyCode())) {
                throw new ApiException(
                        HttpStatus.BAD_REQUEST,
                        "Module " + raw + " does not belong to selected faculties");
            }
            if (!degreeProgramIds.isEmpty()) {
                boolean matchesDegree = module.getApplicableDegrees().stream()
                        .anyMatch(degreeProgramIds::contains);
                if (!matchesDegree) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Module " + raw + " does not match selected degrees");
                }
            }
            resolvedModuleIds.add(canonicalId);
        }

        resolvedModuleIds = dedupePreserve(resolvedModuleIds);

        return StaffScopeResult.builder()
                .facultyIds(facultyIds)
                .degreeProgramIds(degreeProgramIds)
                .moduleIds(resolvedModuleIds)
                .build();
    }

    private Optional<CatalogModule> resolveModule(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String trimmed = raw.trim();
        if (ObjectId.isValid(trimmed) && trimmed.length() == 24) {
            return catalogModuleRepository.findById(trimmed).filter(m -> !m.isDeleted());
        }
        return catalogModuleRepository.findByCodeAndIsDeletedFalse(trimmed.toUpperCase(Locale.ROOT));
    }

    private static List<String> dedupeUpper(List<String> raw) {
        if (raw == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String s : raw) {
            if (s != null && !s.isBlank()) {
                seen.add(s.trim().toUpperCase(Locale.ROOT));
            }
        }
        return new ArrayList<>(seen);
    }

    private static List<String> dedupePreserve(List<String> raw) {
        if (raw == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>();
        for (String s : raw) {
            if (s != null && !s.isBlank()) {
                seen.add(s.trim());
            }
        }
        return new ArrayList<>(seen);
    }
}

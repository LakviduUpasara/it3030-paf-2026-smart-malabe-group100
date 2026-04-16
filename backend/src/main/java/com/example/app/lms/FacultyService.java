package com.example.app.lms;

import com.example.app.exception.ApiException;
import com.example.app.lms.document.Faculty;
import com.example.app.lms.dto.FacultyCreateRequest;
import com.example.app.lms.dto.FacultyResponse;
import com.example.app.lms.dto.FacultyUpdateRequest;
import com.example.app.lms.enums.FacultyStatus;
import com.example.app.lms.repository.FacultyRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final MongoHealthService mongoHealthService;
    private final AcademicReferenceCacheService academicReferenceCacheService;

    public FacultyResponse create(FacultyCreateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(request.getCode());
        if (!LmsCodeUtils.isValidFacultyOrDegreeCode(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use 2–6 uppercase letters");
        }
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Faculty name is required");
        }
        FacultyStatus status = request.getStatus() != null ? request.getStatus() : FacultyStatus.ACTIVE;

        if (facultyRepository.existsByCodeAndIsDeletedFalse(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "Faculty code already exists");
        }

        Faculty faculty = Faculty.builder()
                .code(code)
                .name(name)
                .status(status)
                .isDeleted(false)
                .build();

        try {
            Faculty saved = facultyRepository.save(faculty);
            academicReferenceCacheService.syncAcademicReferenceCaches(true);
            return map(saved);
        } catch (DuplicateKeyException e) {
            throw new ApiException(HttpStatus.CONFLICT, "Faculty code already exists");
        }
    }

    public List<FacultyResponse> listAll() {
        mongoHealthService.requireConnection();
        return facultyRepository.findByIsDeletedFalseOrderByUpdatedAtDescCodeAsc().stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    public FacultyResponse update(String codeParam, FacultyUpdateRequest request) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(codeParam);
        Faculty faculty = facultyRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Faculty not found"));

        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Faculty name is required");
        }
        faculty.setName(name);
        if (request.getStatus() != null) {
            faculty.setStatus(request.getStatus());
        }
        Faculty saved = facultyRepository.save(faculty);
        academicReferenceCacheService.syncAcademicReferenceCaches(true);
        return map(saved);
    }

    public void softDelete(String codeParam) {
        mongoHealthService.requireConnection();
        String code = LmsCodeUtils.normalizeFacultyOrDegreeCode(codeParam);
        Faculty faculty = facultyRepository
                .findByCodeAndIsDeletedFalse(code)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Faculty not found"));
        faculty.setDeleted(true);
        facultyRepository.save(faculty);
        academicReferenceCacheService.syncAcademicReferenceCaches(true);
    }

    private FacultyResponse map(Faculty f) {
        return FacultyResponse.builder()
                .code(f.getCode())
                .name(f.getName())
                .status(f.getStatus())
                .deleted(f.isDeleted())
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}

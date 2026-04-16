package com.example.app.service;

import com.example.app.dto.DegreeProgramRequest;
import com.example.app.dto.DegreeProgramResponse;
import com.example.app.entity.DegreeProgram;
import com.example.app.exception.DegreeProgramNotFoundException;
import com.example.app.repository.DegreeProgramRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DegreeProgramServiceImpl implements DegreeProgramService {

    private final DegreeProgramRepository degreeProgramRepository;

    @Override
    public DegreeProgramResponse createDegreeProgram(DegreeProgramRequest request) {
        validateDuplicateCode(request.getCode(), null);

        DegreeProgram degreeProgram = mapToEntity(request);
        DegreeProgram savedDegreeProgram = degreeProgramRepository.save(degreeProgram);
        return mapToResponse(savedDegreeProgram);
    }

    @Override
    public List<DegreeProgramResponse> getAllDegreePrograms() {
        return degreeProgramRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public DegreeProgramResponse getDegreeProgramById(Long id) {
        DegreeProgram degreeProgram = findDegreeProgramById(id);
        return mapToResponse(degreeProgram);
    }

    @Override
    public DegreeProgramResponse updateDegreeProgram(Long id, DegreeProgramRequest request) {
        validateDuplicateCode(request.getCode(), id);

        DegreeProgram degreeProgram = findDegreeProgramById(id);
        degreeProgram.setCode(normalizeRequiredText(request.getCode()));
        degreeProgram.setName(normalizeRequiredText(request.getName()));
        degreeProgram.setFacultyName(normalizeRequiredText(request.getFacultyName()));
        degreeProgram.setDepartmentName(normalizeRequiredText(request.getDepartmentName()));
        degreeProgram.setActive(resolveActive(request.getActive()));

        DegreeProgram updatedDegreeProgram = degreeProgramRepository.save(degreeProgram);
        return mapToResponse(updatedDegreeProgram);
    }

    @Override
    public void deleteDegreeProgram(Long id) {
        DegreeProgram degreeProgram = findDegreeProgramById(id);
        degreeProgramRepository.delete(degreeProgram);
    }

    private DegreeProgram findDegreeProgramById(Long id) {
        return degreeProgramRepository.findById(id)
                .orElseThrow(() -> new DegreeProgramNotFoundException(id));
    }

    private void validateDuplicateCode(String code, Long id) {
        String normalizedCode = normalizeRequiredText(code);

        boolean exists = id == null
                ? degreeProgramRepository.existsByCodeIgnoreCase(normalizedCode)
                : degreeProgramRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id);

        if (exists) {
            throw new IllegalArgumentException("Degree program code already exists: " + normalizedCode);
        }
    }

    private DegreeProgram mapToEntity(DegreeProgramRequest request) {
        return DegreeProgram.builder()
                .code(normalizeRequiredText(request.getCode()))
                .name(normalizeRequiredText(request.getName()))
                .facultyName(normalizeRequiredText(request.getFacultyName()))
                .departmentName(normalizeRequiredText(request.getDepartmentName()))
                .active(resolveActive(request.getActive()))
                .build();
    }

    private DegreeProgramResponse mapToResponse(DegreeProgram degreeProgram) {
        return DegreeProgramResponse.builder()
                .id(degreeProgram.getId())
                .code(degreeProgram.getCode())
                .name(degreeProgram.getName())
                .facultyName(degreeProgram.getFacultyName())
                .departmentName(degreeProgram.getDepartmentName())
                .active(degreeProgram.getActive())
                .build();
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private Boolean resolveActive(Boolean active) {
        return active == null ? Boolean.TRUE : active;
    }
}

package com.example.app.service;

import com.example.app.dto.AcademicModuleRequest;
import com.example.app.dto.AcademicModuleResponse;
import com.example.app.entity.AcademicModule;
import com.example.app.exception.AcademicModuleNotFoundException;
import com.example.app.repository.AcademicModuleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AcademicModuleServiceImpl implements AcademicModuleService {

    private final AcademicModuleRepository academicModuleRepository;

    @Override
    public AcademicModuleResponse createAcademicModule(AcademicModuleRequest request) {
        validateDuplicateCode(request.getCode(), null);

        AcademicModule academicModule = mapToEntity(request);
        AcademicModule savedAcademicModule = academicModuleRepository.save(academicModule);
        return mapToResponse(savedAcademicModule);
    }

    @Override
    public List<AcademicModuleResponse> getAllAcademicModules() {
        return academicModuleRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AcademicModuleResponse getAcademicModuleById(Long id) {
        AcademicModule academicModule = findAcademicModuleById(id);
        return mapToResponse(academicModule);
    }

    @Override
    public AcademicModuleResponse updateAcademicModule(Long id, AcademicModuleRequest request) {
        validateDuplicateCode(request.getCode(), id);

        AcademicModule academicModule = findAcademicModuleById(id);
        academicModule.setCode(normalizeRequiredText(request.getCode()));
        academicModule.setTitle(normalizeRequiredText(request.getTitle()));
        academicModule.setCreditValue(request.getCreditValue());
        academicModule.setDepartmentName(normalizeRequiredText(request.getDepartmentName()));
        academicModule.setActive(resolveActive(request.getActive()));

        AcademicModule updatedAcademicModule = academicModuleRepository.save(academicModule);
        return mapToResponse(updatedAcademicModule);
    }

    @Override
    public void deleteAcademicModule(Long id) {
        AcademicModule academicModule = findAcademicModuleById(id);
        academicModuleRepository.delete(academicModule);
    }

    private AcademicModule findAcademicModuleById(Long id) {
        return academicModuleRepository.findById(id)
                .orElseThrow(() -> new AcademicModuleNotFoundException(id));
    }

    private void validateDuplicateCode(String code, Long id) {
        String normalizedCode = normalizeRequiredText(code);

        boolean exists = id == null
                ? academicModuleRepository.existsByCodeIgnoreCase(normalizedCode)
                : academicModuleRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id);

        if (exists) {
            throw new IllegalArgumentException("Academic module code already exists: " + normalizedCode);
        }
    }

    private AcademicModule mapToEntity(AcademicModuleRequest request) {
        return AcademicModule.builder()
                .code(normalizeRequiredText(request.getCode()))
                .title(normalizeRequiredText(request.getTitle()))
                .creditValue(request.getCreditValue())
                .departmentName(normalizeRequiredText(request.getDepartmentName()))
                .active(resolveActive(request.getActive()))
                .build();
    }

    private AcademicModuleResponse mapToResponse(AcademicModule academicModule) {
        return AcademicModuleResponse.builder()
                .id(academicModule.getId())
                .code(academicModule.getCode())
                .title(academicModule.getTitle())
                .creditValue(academicModule.getCreditValue())
                .departmentName(academicModule.getDepartmentName())
                .active(academicModule.getActive())
                .build();
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private Boolean resolveActive(Boolean active) {
        return active == null ? Boolean.TRUE : active;
    }
}

package com.example.app.service;

import com.example.app.dto.ModuleOfferingRequest;
import com.example.app.dto.ModuleOfferingResponse;
import com.example.app.entity.AcademicModule;
import com.example.app.entity.DegreeProgram;
import com.example.app.entity.ModuleOffering;
import com.example.app.entity.Semester;
import com.example.app.exception.AcademicModuleNotFoundException;
import com.example.app.exception.ModuleOfferingNotFoundException;
import com.example.app.exception.SemesterNotFoundException;
import com.example.app.repository.AcademicModuleRepository;
import com.example.app.repository.ModuleOfferingRepository;
import com.example.app.repository.SemesterRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ModuleOfferingServiceImpl implements ModuleOfferingService {

    private final ModuleOfferingRepository moduleOfferingRepository;
    private final AcademicModuleRepository academicModuleRepository;
    private final SemesterRepository semesterRepository;

    @Override
    public ModuleOfferingResponse createModuleOffering(ModuleOfferingRequest request) {
        AcademicModule academicModule = findAcademicModuleById(request.getAcademicModuleId());
        Semester semester = findSemesterById(request.getSemesterId());

        validateDuplicateOffering(
                academicModule.getId(),
                semester.getId(),
                request.getAcademicYearLabel(),
                null);

        ModuleOffering moduleOffering = mapToEntity(request, academicModule, semester);
        ModuleOffering savedModuleOffering = moduleOfferingRepository.save(moduleOffering);
        return mapToResponse(savedModuleOffering);
    }

    @Override
    public List<ModuleOfferingResponse> getAllModuleOfferings(Long academicModuleId, Long semesterId) {
        if (academicModuleId != null && semesterId != null) {
            findAcademicModuleById(academicModuleId);
            findSemesterById(semesterId);

            return moduleOfferingRepository.findBySemesterIdOrderByAcademicYearLabelAsc(semesterId)
                    .stream()
                    .filter(offering -> offering.getAcademicModule().getId().equals(academicModuleId))
                    .map(this::mapToResponse)
                    .toList();
        }

        if (academicModuleId != null) {
            findAcademicModuleById(academicModuleId);
            return moduleOfferingRepository.findByAcademicModuleIdOrderByAcademicYearLabelAsc(academicModuleId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (semesterId != null) {
            findSemesterById(semesterId);
            return moduleOfferingRepository.findBySemesterIdOrderByAcademicYearLabelAsc(semesterId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        return moduleOfferingRepository.findAllByOrderByAcademicYearLabelAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ModuleOfferingResponse getModuleOfferingById(Long id) {
        ModuleOffering moduleOffering = findModuleOfferingById(id);
        return mapToResponse(moduleOffering);
    }

    @Override
    public ModuleOfferingResponse updateModuleOffering(Long id, ModuleOfferingRequest request) {
        ModuleOffering moduleOffering = findModuleOfferingById(id);
        AcademicModule academicModule = findAcademicModuleById(request.getAcademicModuleId());
        Semester semester = findSemesterById(request.getSemesterId());

        validateDuplicateOffering(
                academicModule.getId(),
                semester.getId(),
                request.getAcademicYearLabel(),
                id);

        moduleOffering.setAcademicModule(academicModule);
        moduleOffering.setSemester(semester);
        moduleOffering.setAcademicYearLabel(normalizeRequiredText(request.getAcademicYearLabel()));
        moduleOffering.setCoordinatorName(normalizeOptionalText(request.getCoordinatorName()));
        moduleOffering.setStatus(request.getStatus());
        moduleOffering.setActive(resolveActive(request.getActive()));

        ModuleOffering updatedModuleOffering = moduleOfferingRepository.save(moduleOffering);
        return mapToResponse(updatedModuleOffering);
    }

    @Override
    public void deleteModuleOffering(Long id) {
        ModuleOffering moduleOffering = findModuleOfferingById(id);
        moduleOfferingRepository.delete(moduleOffering);
    }

    private ModuleOffering findModuleOfferingById(Long id) {
        return moduleOfferingRepository.findById(id)
                .orElseThrow(() -> new ModuleOfferingNotFoundException(id));
    }

    private AcademicModule findAcademicModuleById(Long id) {
        return academicModuleRepository.findById(id)
                .orElseThrow(() -> new AcademicModuleNotFoundException(id));
    }

    private Semester findSemesterById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new SemesterNotFoundException(id));
    }

    private void validateDuplicateOffering(
            Long academicModuleId,
            Long semesterId,
            String academicYearLabel,
            Long id) {
        String normalizedAcademicYearLabel = normalizeRequiredText(academicYearLabel);

        boolean exists = id == null
                ? moduleOfferingRepository.existsByAcademicModuleIdAndSemesterIdAndAcademicYearLabel(
                        academicModuleId,
                        semesterId,
                        normalizedAcademicYearLabel)
                : moduleOfferingRepository.existsByAcademicModuleIdAndSemesterIdAndAcademicYearLabelAndIdNot(
                        academicModuleId,
                        semesterId,
                        normalizedAcademicYearLabel,
                        id);

        if (exists) {
            throw new IllegalArgumentException(
                    "Module offering already exists for the selected academic module, semester, and academic year label");
        }
    }

    private ModuleOffering mapToEntity(
            ModuleOfferingRequest request,
            AcademicModule academicModule,
            Semester semester) {
        return ModuleOffering.builder()
                .academicModule(academicModule)
                .semester(semester)
                .academicYearLabel(normalizeRequiredText(request.getAcademicYearLabel()))
                .coordinatorName(normalizeOptionalText(request.getCoordinatorName()))
                .status(request.getStatus())
                .active(resolveActive(request.getActive()))
                .build();
    }

    private ModuleOfferingResponse mapToResponse(ModuleOffering moduleOffering) {
        AcademicModule academicModule = moduleOffering.getAcademicModule();
        Semester semester = moduleOffering.getSemester();
        DegreeProgram degreeProgram = semester.getDegreeProgram();

        return ModuleOfferingResponse.builder()
                .id(moduleOffering.getId())
                .academicModuleId(academicModule.getId())
                .academicModuleCode(academicModule.getCode())
                .academicModuleTitle(academicModule.getTitle())
                .semesterId(semester.getId())
                .degreeProgramId(degreeProgram.getId())
                .degreeProgramCode(degreeProgram.getCode())
                .yearNumber(semester.getYearNumber())
                .semesterNumber(semester.getSemesterNumber())
                .academicYearLabel(moduleOffering.getAcademicYearLabel())
                .coordinatorName(moduleOffering.getCoordinatorName())
                .status(moduleOffering.getStatus())
                .active(moduleOffering.getActive())
                .build();
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private Boolean resolveActive(Boolean active) {
        return active == null ? Boolean.TRUE : active;
    }
}

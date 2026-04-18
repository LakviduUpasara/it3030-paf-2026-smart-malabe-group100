package com.example.app.service;

import com.example.app.dto.AcademicSessionRequest;
import com.example.app.dto.AcademicSessionResponse;
import com.example.app.entity.AcademicModule;
import com.example.app.entity.AcademicSession;
import com.example.app.entity.DegreeProgram;
import com.example.app.entity.ModuleOffering;
import com.example.app.entity.Resource;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.Semester;
import com.example.app.entity.StudentGroup;
import com.example.app.exception.AcademicSessionNotFoundException;
import com.example.app.exception.ModuleOfferingNotFoundException;
import com.example.app.exception.ResourceNotFoundException;
import com.example.app.exception.StudentGroupNotFoundException;
import com.example.app.repository.AcademicSessionRepository;
import com.example.app.repository.ModuleOfferingRepository;
import com.example.app.repository.ResourceRepository;
import com.example.app.repository.StudentGroupRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AcademicSessionServiceImpl implements AcademicSessionService {

    private final AcademicSessionRepository academicSessionRepository;
    private final ModuleOfferingRepository moduleOfferingRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final ResourceRepository resourceRepository;

    @Override
    public AcademicSessionResponse createAcademicSession(AcademicSessionRequest request) {
        ModuleOffering moduleOffering = findModuleOfferingById(request.getModuleOfferingId());
        StudentGroup studentGroup = findStudentGroupById(request.getStudentGroupId());
        Resource resource = findCampusResourceById(request.getResourceId());

        validateAcademicSessionRules(request, moduleOffering, studentGroup, resource, null);

        AcademicSession academicSession = mapToEntity(request, moduleOffering, studentGroup, resource.getId());
        AcademicSession savedAcademicSession = academicSessionRepository.save(academicSession);
        return mapToResponse(savedAcademicSession);
    }

    @Override
    public List<AcademicSessionResponse> getAllAcademicSessions(
            Long moduleOfferingId,
            Long studentGroupId,
            String resourceId,
            LocalDate sessionDate) {

        if (moduleOfferingId != null) {
            findModuleOfferingById(moduleOfferingId);
        }

        if (studentGroupId != null) {
            findStudentGroupById(studentGroupId);
        }

        String resourceFilter = resourceId != null && !resourceId.isBlank() ? resourceId : null;
        if (resourceFilter != null) {
            findCampusResourceById(resourceFilter);
        }

        return academicSessionRepository.findAllByFilters(
                        moduleOfferingId,
                        studentGroupId,
                        resourceFilter,
                        sessionDate)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AcademicSessionResponse getAcademicSessionById(Long id) {
        AcademicSession academicSession = findAcademicSessionById(id);
        return mapToResponse(academicSession);
    }

    @Override
    public AcademicSessionResponse updateAcademicSession(Long id, AcademicSessionRequest request) {
        AcademicSession academicSession = findAcademicSessionById(id);
        ModuleOffering moduleOffering = findModuleOfferingById(request.getModuleOfferingId());
        StudentGroup studentGroup = findStudentGroupById(request.getStudentGroupId());
        Resource resource = findCampusResourceById(request.getResourceId());

        validateAcademicSessionRules(request, moduleOffering, studentGroup, resource, id);

        academicSession.setModuleOffering(moduleOffering);
        academicSession.setStudentGroup(studentGroup);
        academicSession.setCampusResourceId(resource.getId());
        academicSession.setSessionType(request.getSessionType());
        academicSession.setSessionDate(request.getSessionDate());
        academicSession.setStartTime(request.getStartTime());
        academicSession.setEndTime(request.getEndTime());
        academicSession.setTitle(normalizeRequiredText(request.getTitle()));
        academicSession.setNotes(normalizeOptionalText(request.getNotes()));
        academicSession.setStatus(request.getStatus());
        academicSession.setActive(resolveActive(request.getActive()));

        AcademicSession updatedAcademicSession = academicSessionRepository.save(academicSession);
        return mapToResponse(updatedAcademicSession);
    }

    @Override
    public void deleteAcademicSession(Long id) {
        AcademicSession academicSession = findAcademicSessionById(id);
        academicSessionRepository.delete(academicSession);
    }

    private AcademicSession findAcademicSessionById(Long id) {
        return academicSessionRepository.findById(id)
                .orElseThrow(() -> new AcademicSessionNotFoundException(id));
    }

    private ModuleOffering findModuleOfferingById(Long id) {
        return moduleOfferingRepository.findById(id)
                .orElseThrow(() -> new ModuleOfferingNotFoundException(id));
    }

    private StudentGroup findStudentGroupById(Long id) {
        return studentGroupRepository.findById(id)
                .orElseThrow(() -> new StudentGroupNotFoundException(id));
    }

    private Resource findCampusResourceById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    private void validateAcademicSessionRules(
            AcademicSessionRequest request,
            ModuleOffering moduleOffering,
            StudentGroup studentGroup,
            Resource resource,
            Long currentSessionId) {

        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateResourceActive(resource);
        validateGroupFitsResource(studentGroup, resource);
        validateAcademicConsistency(moduleOffering, studentGroup);
        validateNoResourceOverlap(
                resource.getId(),
                request.getSessionDate(),
                request.getStartTime(),
                request.getEndTime(),
                currentSessionId);
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (startTime != null && endTime != null && !endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }

    private void validateResourceActive(Resource resource) {
        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new IllegalArgumentException("Selected resource is not active");
        }
    }

    private void validateGroupFitsResource(StudentGroup studentGroup, Resource resource) {
        if (studentGroup.getGroupSize() > resource.getCapacity()) {
            throw new IllegalArgumentException("Student group size exceeds resource capacity");
        }
    }

    private void validateAcademicConsistency(ModuleOffering moduleOffering, StudentGroup studentGroup) {
        Semester offeringSemester = moduleOffering.getSemester();
        Semester studentGroupSemester = studentGroup.getSemester();

        if (!offeringSemester.getId().equals(studentGroupSemester.getId())) {
            throw new IllegalArgumentException(
                    "Student group semester must match the module offering semester");
        }
    }

    private void validateNoResourceOverlap(
            String resourceId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            Long currentSessionId) {
        boolean hasOverlap = academicSessionRepository.existsOverlappingSession(
                resourceId,
                sessionDate,
                startTime,
                endTime,
                currentSessionId);

        if (hasOverlap) {
            throw new IllegalArgumentException(
                    "Another academic session already overlaps with the selected resource and time");
        }
    }

    private AcademicSession mapToEntity(
            AcademicSessionRequest request,
            ModuleOffering moduleOffering,
            StudentGroup studentGroup,
            String campusResourceId) {
        return AcademicSession.builder()
                .moduleOffering(moduleOffering)
                .studentGroup(studentGroup)
                .campusResourceId(campusResourceId)
                .sessionType(request.getSessionType())
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .title(normalizeRequiredText(request.getTitle()))
                .notes(normalizeOptionalText(request.getNotes()))
                .status(request.getStatus())
                .active(resolveActive(request.getActive()))
                .build();
    }

    private AcademicSessionResponse mapToResponse(AcademicSession academicSession) {
        ModuleOffering moduleOffering = academicSession.getModuleOffering();
        AcademicModule academicModule = moduleOffering.getAcademicModule();
        Semester semester = moduleOffering.getSemester();
        DegreeProgram degreeProgram = semester.getDegreeProgram();
        StudentGroup studentGroup = academicSession.getStudentGroup();
        Resource resource = resourceRepository.findById(academicSession.getCampusResourceId())
                .orElseThrow(() -> new ResourceNotFoundException(academicSession.getCampusResourceId()));

        return AcademicSessionResponse.builder()
                .id(academicSession.getId())
                .moduleOfferingId(moduleOffering.getId())
                .academicModuleId(academicModule.getId())
                .academicModuleCode(academicModule.getCode())
                .academicModuleTitle(academicModule.getTitle())
                .academicYearLabel(moduleOffering.getAcademicYearLabel())
                .semesterId(semester.getId())
                .semesterYearNumber(semester.getYearNumber())
                .semesterSemesterNumber(semester.getSemesterNumber())
                .degreeProgramId(degreeProgram.getId())
                .degreeProgramCode(degreeProgram.getCode())
                .degreeProgramName(degreeProgram.getName())
                .studentGroupId(studentGroup.getId())
                .studentGroupCode(studentGroup.getCode())
                .studentGroupSize(studentGroup.getGroupSize())
                .resourceId(resource.getId())
                .resourceName(resource.getName())
                .resourceType(resource.getType())
                .resourceLocation(resource.getLocation())
                .resourceCapacity(resource.getCapacity())
                .sessionType(academicSession.getSessionType())
                .sessionDate(academicSession.getSessionDate())
                .startTime(academicSession.getStartTime())
                .endTime(academicSession.getEndTime())
                .title(academicSession.getTitle())
                .notes(academicSession.getNotes())
                .status(academicSession.getStatus())
                .active(academicSession.getActive())
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

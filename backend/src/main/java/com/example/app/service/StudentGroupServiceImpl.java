package com.example.app.service;

import com.example.app.dto.StudentGroupRequest;
import com.example.app.dto.StudentGroupResponse;
import com.example.app.entity.DegreeProgram;
import com.example.app.entity.Semester;
import com.example.app.entity.StudentGroup;
import com.example.app.exception.DegreeProgramNotFoundException;
import com.example.app.exception.SemesterNotFoundException;
import com.example.app.exception.StudentGroupNotFoundException;
import com.example.app.repository.DegreeProgramRepository;
import com.example.app.repository.SemesterRepository;
import com.example.app.repository.StudentGroupRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentGroupServiceImpl implements StudentGroupService {

    private final StudentGroupRepository studentGroupRepository;
    private final DegreeProgramRepository degreeProgramRepository;
    private final SemesterRepository semesterRepository;

    @Override
    public StudentGroupResponse createStudentGroup(StudentGroupRequest request) {
        DegreeProgram degreeProgram = findDegreeProgramById(request.getDegreeProgramId());
        Semester semester = findSemesterById(request.getSemesterId());

        validateSemesterBelongsToDegreeProgram(degreeProgram, semester);
        validateDuplicateCode(degreeProgram.getId(), request.getCode(), null);

        StudentGroup studentGroup = mapToEntity(request, degreeProgram, semester);
        StudentGroup savedStudentGroup = studentGroupRepository.save(studentGroup);
        return mapToResponse(savedStudentGroup);
    }

    @Override
    public List<StudentGroupResponse> getAllStudentGroups(Long degreeProgramId, Long semesterId) {
        if (degreeProgramId != null && semesterId != null) {
            DegreeProgram degreeProgram = findDegreeProgramById(degreeProgramId);
            Semester semester = findSemesterById(semesterId);
            validateSemesterBelongsToDegreeProgram(degreeProgram, semester);

            return studentGroupRepository.findBySemesterIdOrderByCodeAsc(semesterId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (degreeProgramId != null) {
            findDegreeProgramById(degreeProgramId);
            return studentGroupRepository.findByDegreeProgramIdOrderByCodeAsc(degreeProgramId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (semesterId != null) {
            findSemesterById(semesterId);
            return studentGroupRepository.findBySemesterIdOrderByCodeAsc(semesterId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        return studentGroupRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public StudentGroupResponse getStudentGroupById(Long id) {
        StudentGroup studentGroup = findStudentGroupById(id);
        return mapToResponse(studentGroup);
    }

    @Override
    public StudentGroupResponse updateStudentGroup(Long id, StudentGroupRequest request) {
        StudentGroup studentGroup = findStudentGroupById(id);
        DegreeProgram degreeProgram = findDegreeProgramById(request.getDegreeProgramId());
        Semester semester = findSemesterById(request.getSemesterId());

        validateSemesterBelongsToDegreeProgram(degreeProgram, semester);
        validateDuplicateCode(degreeProgram.getId(), request.getCode(), id);

        studentGroup.setCode(normalizeRequiredText(request.getCode()));
        studentGroup.setDegreeProgram(degreeProgram);
        studentGroup.setSemester(semester);
        studentGroup.setBatchYear(request.getBatchYear());
        studentGroup.setGroupSize(request.getGroupSize());
        studentGroup.setActive(resolveActive(request.getActive()));

        StudentGroup updatedStudentGroup = studentGroupRepository.save(studentGroup);
        return mapToResponse(updatedStudentGroup);
    }

    @Override
    public void deleteStudentGroup(Long id) {
        StudentGroup studentGroup = findStudentGroupById(id);
        studentGroupRepository.delete(studentGroup);
    }

    private StudentGroup findStudentGroupById(Long id) {
        return studentGroupRepository.findById(id)
                .orElseThrow(() -> new StudentGroupNotFoundException(id));
    }

    private DegreeProgram findDegreeProgramById(Long id) {
        return degreeProgramRepository.findById(id)
                .orElseThrow(() -> new DegreeProgramNotFoundException(id));
    }

    private Semester findSemesterById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new SemesterNotFoundException(id));
    }

    private void validateSemesterBelongsToDegreeProgram(DegreeProgram degreeProgram, Semester semester) {
        if (!semester.getDegreeProgram().getId().equals(degreeProgram.getId())) {
            throw new IllegalArgumentException(
                    "Selected semester does not belong to the selected degree program");
        }
    }

    private void validateDuplicateCode(Long degreeProgramId, String code, Long id) {
        String normalizedCode = normalizeRequiredText(code);

        boolean exists = id == null
                ? studentGroupRepository.existsByDegreeProgramIdAndCodeIgnoreCase(degreeProgramId, normalizedCode)
                : studentGroupRepository.existsByDegreeProgramIdAndCodeIgnoreCaseAndIdNot(
                        degreeProgramId,
                        normalizedCode,
                        id);

        if (exists) {
            throw new IllegalArgumentException(
                    "Student group code already exists within the selected degree program: " + normalizedCode);
        }
    }

    private StudentGroup mapToEntity(
            StudentGroupRequest request,
            DegreeProgram degreeProgram,
            Semester semester) {
        return StudentGroup.builder()
                .code(normalizeRequiredText(request.getCode()))
                .degreeProgram(degreeProgram)
                .semester(semester)
                .batchYear(request.getBatchYear())
                .groupSize(request.getGroupSize())
                .active(resolveActive(request.getActive()))
                .build();
    }

    private StudentGroupResponse mapToResponse(StudentGroup studentGroup) {
        DegreeProgram degreeProgram = studentGroup.getDegreeProgram();
        Semester semester = studentGroup.getSemester();

        return StudentGroupResponse.builder()
                .id(studentGroup.getId())
                .code(studentGroup.getCode())
                .degreeProgramId(degreeProgram.getId())
                .degreeProgramCode(degreeProgram.getCode())
                .degreeProgramName(degreeProgram.getName())
                .semesterId(semester.getId())
                .semesterYearNumber(semester.getYearNumber())
                .semesterSemesterNumber(semester.getSemesterNumber())
                .batchYear(studentGroup.getBatchYear())
                .groupSize(studentGroup.getGroupSize())
                .active(studentGroup.getActive())
                .build();
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private Boolean resolveActive(Boolean active) {
        return active == null ? Boolean.TRUE : active;
    }
}

package com.example.app.service;

import com.example.app.dto.SemesterRequest;
import com.example.app.dto.SemesterResponse;
import com.example.app.entity.DegreeProgram;
import com.example.app.entity.Semester;
import com.example.app.exception.DegreeProgramNotFoundException;
import com.example.app.exception.SemesterNotFoundException;
import com.example.app.repository.DegreeProgramRepository;
import com.example.app.repository.SemesterRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final DegreeProgramRepository degreeProgramRepository;

    @Override
    public SemesterResponse createSemester(SemesterRequest request) {
        validateDateRange(request.getStartDate(), request.getEndDate());
        validateDuplicateSemester(
                request.getDegreeProgramId(),
                request.getYearNumber(),
                request.getSemesterNumber(),
                null);

        DegreeProgram degreeProgram = findDegreeProgramById(request.getDegreeProgramId());
        Semester semester = mapToEntity(request, degreeProgram);
        Semester savedSemester = semesterRepository.save(semester);
        return mapToResponse(savedSemester);
    }

    @Override
    public List<SemesterResponse> getAllSemesters(Long degreeProgramId) {
        if (degreeProgramId != null) {
            findDegreeProgramById(degreeProgramId);
        }

        List<Semester> semesters = degreeProgramId == null
                ? semesterRepository.findAllByOrderByYearNumberAscSemesterNumberAsc()
                : semesterRepository.findByDegreeProgramIdOrderByYearNumberAscSemesterNumberAsc(degreeProgramId);

        return semesters.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public SemesterResponse getSemesterById(Long id) {
        Semester semester = findSemesterById(id);
        return mapToResponse(semester);
    }

    @Override
    public SemesterResponse updateSemester(Long id, SemesterRequest request) {
        validateDateRange(request.getStartDate(), request.getEndDate());
        validateDuplicateSemester(
                request.getDegreeProgramId(),
                request.getYearNumber(),
                request.getSemesterNumber(),
                id);

        Semester semester = findSemesterById(id);
        DegreeProgram degreeProgram = findDegreeProgramById(request.getDegreeProgramId());

        semester.setDegreeProgram(degreeProgram);
        semester.setYearNumber(request.getYearNumber());
        semester.setSemesterNumber(request.getSemesterNumber());
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());
        semester.setActive(resolveActive(request.getActive()));

        Semester updatedSemester = semesterRepository.save(semester);
        return mapToResponse(updatedSemester);
    }

    @Override
    public void deleteSemester(Long id) {
        Semester semester = findSemesterById(id);
        semesterRepository.delete(semester);
    }

    private Semester findSemesterById(Long id) {
        return semesterRepository.findById(id)
                .orElseThrow(() -> new SemesterNotFoundException(id));
    }

    private DegreeProgram findDegreeProgramById(Long id) {
        return degreeProgramRepository.findById(id)
                .orElseThrow(() -> new DegreeProgramNotFoundException(id));
    }

    private void validateDuplicateSemester(
            Long degreeProgramId,
            Integer yearNumber,
            Integer semesterNumber,
            Long id) {

        boolean exists = id == null
                ? semesterRepository.existsByDegreeProgramIdAndYearNumberAndSemesterNumber(
                        degreeProgramId,
                        yearNumber,
                        semesterNumber)
                : semesterRepository.existsByDegreeProgramIdAndYearNumberAndSemesterNumberAndIdNot(
                        degreeProgramId,
                        yearNumber,
                        semesterNumber,
                        id);

        if (exists) {
            throw new IllegalArgumentException(
                    "Semester already exists for the selected degree program, year number, and semester number");
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }
    }

    private Semester mapToEntity(SemesterRequest request, DegreeProgram degreeProgram) {
        return Semester.builder()
                .degreeProgram(degreeProgram)
                .yearNumber(request.getYearNumber())
                .semesterNumber(request.getSemesterNumber())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(resolveActive(request.getActive()))
                .build();
    }

    private SemesterResponse mapToResponse(Semester semester) {
        DegreeProgram degreeProgram = semester.getDegreeProgram();

        return SemesterResponse.builder()
                .id(semester.getId())
                .degreeProgramId(degreeProgram.getId())
                .degreeProgramCode(degreeProgram.getCode())
                .degreeProgramName(degreeProgram.getName())
                .yearNumber(semester.getYearNumber())
                .semesterNumber(semester.getSemesterNumber())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .active(semester.getActive())
                .build();
    }

    private Boolean resolveActive(Boolean active) {
        return active == null ? Boolean.TRUE : active;
    }
}

package com.example.app.service;

import com.example.app.dto.SemesterRequest;
import com.example.app.dto.SemesterResponse;
import java.util.List;

public interface SemesterService {

    SemesterResponse createSemester(SemesterRequest request);

    List<SemesterResponse> getAllSemesters(Long degreeProgramId);

    SemesterResponse getSemesterById(Long id);

    SemesterResponse updateSemester(Long id, SemesterRequest request);

    void deleteSemester(Long id);
}

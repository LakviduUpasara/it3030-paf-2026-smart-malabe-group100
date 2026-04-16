package com.example.app.service;

import com.example.app.dto.DegreeProgramRequest;
import com.example.app.dto.DegreeProgramResponse;
import java.util.List;

public interface DegreeProgramService {

    DegreeProgramResponse createDegreeProgram(DegreeProgramRequest request);

    List<DegreeProgramResponse> getAllDegreePrograms();

    DegreeProgramResponse getDegreeProgramById(Long id);

    DegreeProgramResponse updateDegreeProgram(Long id, DegreeProgramRequest request);

    void deleteDegreeProgram(Long id);
}

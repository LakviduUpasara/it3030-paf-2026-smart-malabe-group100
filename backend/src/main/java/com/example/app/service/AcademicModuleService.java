package com.example.app.service;

import com.example.app.dto.AcademicModuleRequest;
import com.example.app.dto.AcademicModuleResponse;
import java.util.List;

public interface AcademicModuleService {

    AcademicModuleResponse createAcademicModule(AcademicModuleRequest request);

    List<AcademicModuleResponse> getAllAcademicModules();

    AcademicModuleResponse getAcademicModuleById(Long id);

    AcademicModuleResponse updateAcademicModule(Long id, AcademicModuleRequest request);

    void deleteAcademicModule(Long id);
}

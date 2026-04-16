package com.example.app.service;

import com.example.app.dto.ModuleOfferingRequest;
import com.example.app.dto.ModuleOfferingResponse;
import java.util.List;

public interface ModuleOfferingService {

    ModuleOfferingResponse createModuleOffering(ModuleOfferingRequest request);

    List<ModuleOfferingResponse> getAllModuleOfferings(Long academicModuleId, Long semesterId);

    ModuleOfferingResponse getModuleOfferingById(Long id);

    ModuleOfferingResponse updateModuleOffering(Long id, ModuleOfferingRequest request);

    void deleteModuleOffering(Long id);
}

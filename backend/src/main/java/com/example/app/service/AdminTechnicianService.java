package com.example.app.service;

import com.example.app.dto.TechnicianSummaryResponse;
import com.example.app.dto.admin.CreateTechnicianRequest;
import com.example.app.dto.admin.UpdateTechnicianRequest;
import java.util.List;

public interface AdminTechnicianService {

    List<TechnicianSummaryResponse> listTechnicians();

    TechnicianSummaryResponse create(CreateTechnicianRequest request);

    TechnicianSummaryResponse update(String id, UpdateTechnicianRequest request);

    void delete(String id);
}

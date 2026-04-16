package com.example.app.service;

import com.example.app.dto.AcademicSessionRequest;
import com.example.app.dto.AcademicSessionResponse;
import java.time.LocalDate;
import java.util.List;

public interface AcademicSessionService {

    AcademicSessionResponse createAcademicSession(AcademicSessionRequest request);

    List<AcademicSessionResponse> getAllAcademicSessions(
            Long moduleOfferingId,
            Long studentGroupId,
            Long resourceId,
            LocalDate sessionDate);

    AcademicSessionResponse getAcademicSessionById(Long id);

    AcademicSessionResponse updateAcademicSession(Long id, AcademicSessionRequest request);

    void deleteAcademicSession(Long id);
}

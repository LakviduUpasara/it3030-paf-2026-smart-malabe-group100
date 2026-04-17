package com.example.app.service;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import com.example.app.security.AuthenticatedUser;
import java.util.List;

public interface AdminSignupRequestService {

    List<SignupRequestSummaryResponse> getPendingRequests();

    SignupRequestSummaryResponse approveRequest(
            String requestId, SignupRequestDecisionRequest request, AuthenticatedUser reviewer);

    SignupRequestSummaryResponse rejectRequest(
            String requestId, SignupRequestRejectRequest request, AuthenticatedUser reviewer);
}

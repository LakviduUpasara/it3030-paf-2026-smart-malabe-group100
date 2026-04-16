package com.example.app.service;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import java.util.List;

public interface AdminSignupRequestService {

    List<SignupRequestSummaryResponse> getPendingRequests();

    SignupRequestSummaryResponse approveRequest(String requestId, SignupRequestDecisionRequest request);

    SignupRequestSummaryResponse rejectRequest(String requestId, SignupRequestRejectRequest request);
}

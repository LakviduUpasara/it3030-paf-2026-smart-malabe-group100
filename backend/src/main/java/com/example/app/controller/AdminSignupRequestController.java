package com.example.app.controller;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import com.example.app.service.AdminSignupRequestService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/signup-requests")
@RequiredArgsConstructor
public class AdminSignupRequestController {

    private final AdminSignupRequestService adminSignupRequestService;

    @GetMapping
    public ResponseEntity<List<SignupRequestSummaryResponse>> getPendingRequests() {
        return ResponseEntity.ok(adminSignupRequestService.getPendingRequests());
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<SignupRequestSummaryResponse> approveRequest(
            @PathVariable String requestId,
            @Valid @RequestBody SignupRequestDecisionRequest request
    ) {
        return ResponseEntity.ok(adminSignupRequestService.approveRequest(requestId, request));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<SignupRequestSummaryResponse> rejectRequest(
            @PathVariable String requestId,
            @Valid @RequestBody SignupRequestRejectRequest request
    ) {
        return ResponseEntity.ok(adminSignupRequestService.rejectRequest(requestId, request));
    }
}

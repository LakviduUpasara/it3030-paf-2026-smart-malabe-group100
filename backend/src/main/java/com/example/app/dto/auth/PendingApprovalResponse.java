package com.example.app.dto.auth;

import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import java.time.LocalDateTime;

/**
 * Pending signup request shown to the applicant (JSON API). Implemented as a record so the
 * serialized shape is stable and there is no generated multi-arg constructor mismatch.
 */
public record PendingApprovalResponse(
        String requestId,
        String applicantName,
        String email,
        AuthProvider provider,
        SignupRequestStatus status,
        Role requestedRole,
        Role assignedRole,
        String reviewerNote,
        String rejectionReason,
        LocalDateTime requestedAt,
        LocalDateTime reviewedAt,
        String message
) {}

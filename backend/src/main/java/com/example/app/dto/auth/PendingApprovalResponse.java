package com.example.app.dto.auth;

import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.AuthProvider;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalResponse {

    private String requestId;
    private String applicantName;
    private String email;
    private AuthProvider provider;
    private SignupRequestStatus status;
    private Role assignedRole;
    private String reviewerNote;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
    private String message;
}

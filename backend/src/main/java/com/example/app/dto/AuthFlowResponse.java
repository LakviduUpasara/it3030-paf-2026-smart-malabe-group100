package com.example.app.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthFlowResponse {

    private String authState;
    private String message;
    private String token;
    private AuthenticatedUserDto user;
    private TwoFactorChallengeDto challenge;
    private PendingApprovalDto pendingApproval;
}

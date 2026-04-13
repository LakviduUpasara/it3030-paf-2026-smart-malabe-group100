package com.example.app.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthFlowResponse {

    private AuthFlowStatus authStatus;
    private String message;
    private AuthenticatedUserResponse user;
    private String token;
    private PendingApprovalResponse pendingApproval;
    private TwoFactorChallengeResponse twoFactorChallenge;
}

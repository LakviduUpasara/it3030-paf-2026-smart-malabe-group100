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
    /** When present, session is restricted (first-login setup). Values match {@link com.example.app.entity.SessionPhase}. */
    private String sessionPhase;
    private PendingApprovalResponse pendingApproval;
    private TwoFactorChallengeResponse twoFactorChallenge;

    /** After Google sign-in when 2FA is off and the optional setup offer is still active. */
    private Boolean showGoogleTwoFactorSetupPrompt;
}

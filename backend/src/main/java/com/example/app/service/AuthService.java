package com.example.app.service;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.ChangeFirstLoginPasswordRequest;
import com.example.app.dto.auth.GoogleCredentialRequest;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.GoogleSignupSessionResponse;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.ResendEmailOtpRequest;
import com.example.app.dto.auth.SelectFirstLoginTwoFactorRequest;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.security.AuthenticatedUser;

public interface AuthService {

    AuthFlowResponse register(RegisterRequest request);

    AuthFlowResponse login(LoginRequest request);

    /**
     * Only active when {@code app.developer-mode=true}. Signs in without a password or second factor.
     */
    AuthFlowResponse devLogin(String email);

    GoogleSignupSessionResponse prepareGoogleSignup(GoogleCredentialRequest request);

    AuthFlowResponse loginWithGoogle(GoogleCredentialRequest request);

    AuthFlowResponse loginWithApple(GoogleLoginRequest request);

    AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request);

    /**
     * Sends a new email OTP for an existing challenge (rate-limited). Public — same as verify-2fa.
     */
    AuthFlowResponse resendEmailOtp(ResendEmailOtpRequest request);

    AuthFlowResponse changeFirstLoginPassword(ChangeFirstLoginPasswordRequest request, AuthenticatedUser user, String authorizationHeader);

    AuthFlowResponse selectFirstLoginTwoFactor(SelectFirstLoginTwoFactorRequest request, AuthenticatedUser user, String authorizationHeader);

    void logout(String bearerToken);

    PendingApprovalResponse getSignupRequestStatus(String requestId, String email);

    AuthFlowResponse activateApprovedSignup(String requestId, String email);

    AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser, String authorizationHeader);
}

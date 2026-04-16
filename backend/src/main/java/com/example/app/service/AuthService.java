package com.example.app.service;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.GoogleCredentialRequest;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.GoogleSignupSessionResponse;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.security.AuthenticatedUser;

public interface AuthService {

    AuthFlowResponse register(RegisterRequest request);

    AuthFlowResponse login(LoginRequest request);

    AuthFlowResponse devLogin(String email);

    GoogleSignupSessionResponse prepareGoogleSignup(GoogleCredentialRequest request);

    AuthFlowResponse loginWithGoogle(GoogleCredentialRequest request);

    AuthFlowResponse loginWithApple(GoogleLoginRequest request);

    AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request);

    void logout(String bearerToken);

    PendingApprovalResponse getSignupRequestStatus(String requestId, String email);

    AuthFlowResponse activateApprovedSignup(String requestId, String email);

    AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser);
}

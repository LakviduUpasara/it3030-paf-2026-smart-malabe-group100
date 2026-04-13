package com.example.app.service;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.security.AuthenticatedUser;

public interface AuthService {

    AuthFlowResponse register(RegisterRequest request);

    AuthFlowResponse login(LoginRequest request);

    AuthFlowResponse loginWithGoogle(GoogleLoginRequest request);

    AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request);

    void logout(String bearerToken);

    PendingApprovalResponse getSignupRequestStatus(String requestId, String email);

    AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser);
}

package com.example.app.service;

import com.example.app.dto.account.AuthenticatorEnrollmentResponse;
import com.example.app.dto.account.AuthenticatorVerifyRequest;
import com.example.app.dto.account.SecuritySettingsResponse;
import com.example.app.dto.account.SecuritySettingsUpdateRequest;
import com.example.app.security.AuthenticatedUser;

public interface AccountSecurityService {

    SecuritySettingsResponse getSecuritySettings(AuthenticatedUser user);

    SecuritySettingsResponse updateSecuritySettings(AuthenticatedUser user, SecuritySettingsUpdateRequest request);

    AuthenticatorEnrollmentResponse startAuthenticatorEnrollment(AuthenticatedUser user);

    SecuritySettingsResponse verifyAuthenticatorEnrollment(AuthenticatedUser user, AuthenticatorVerifyRequest request);

    SecuritySettingsResponse resetAuthenticator(AuthenticatedUser user);

    void dismissGoogleTwoFactorPrompt(AuthenticatedUser user);
}

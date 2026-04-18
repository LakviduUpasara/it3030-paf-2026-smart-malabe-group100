package com.example.app.service.impl;

import com.example.app.dto.account.AuthenticatorEnrollmentResponse;
import com.example.app.dto.account.AuthenticatorVerifyRequest;
import com.example.app.dto.account.SecuritySettingsResponse;
import com.example.app.dto.account.SecuritySettingsUpdateRequest;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.exception.ApiException;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.AccountSecurityService;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AccountSecurityServiceImpl implements AccountSecurityService {

    private final UserAccountRepository userAccountRepository;
    private final GoogleAuthenticator googleAuthenticator;

    @Override
    public SecuritySettingsResponse getSecuritySettings(AuthenticatedUser user) {
        UserAccount account = loadAccount(user);
        return toResponse(account);
    }

    @Override
    public SecuritySettingsResponse updateSecuritySettings(AuthenticatedUser user, SecuritySettingsUpdateRequest request) {
        UserAccount account = loadAccount(user);

        if (request.getEmailNotificationsEnabled() != null) {
            account.setEmailNotificationsEnabled(request.getEmailNotificationsEnabled());
        }
        if (request.getAppNotificationsEnabled() != null) {
            account.setAppNotificationsEnabled(request.getAppNotificationsEnabled());
        }

        if (request.getPreferredTwoFactorMethod() != null) {
            if (request.getPreferredTwoFactorMethod() == TwoFactorMethod.EMAIL_OTP) {
                account.setAuthenticatorSecret(null);
                account.setAuthenticatorConfirmed(false);
            }
            account.setPreferredTwoFactorMethod(request.getPreferredTwoFactorMethod());
        }

        if (request.getTwoFactorEnabled() != null) {
            if (!request.getTwoFactorEnabled()) {
                account.setTwoFactorEnabled(false);
                account.setAuthenticatorSecret(null);
                account.setAuthenticatorConfirmed(false);
            } else {
                if (account.getPreferredTwoFactorMethod() == null) {
                    account.setAuthenticatorSecret(null);
                    account.setAuthenticatorConfirmed(false);
                    account.setPreferredTwoFactorMethod(TwoFactorMethod.EMAIL_OTP);
                }
                if (account.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                        && !account.isAuthenticatorConfirmed()) {
                    throw new ApiException(
                            HttpStatus.BAD_REQUEST,
                            "Finish authenticator setup (scan QR and verify a code) or choose email verification first."
                    );
                }
                account.setTwoFactorEnabled(true);
            }
        }

        userAccountRepository.save(account);
        return toResponse(account);
    }

    @Override
    public AuthenticatorEnrollmentResponse startAuthenticatorEnrollment(AuthenticatedUser user) {
        UserAccount account = loadAccount(user);
        account.setPreferredTwoFactorMethod(TwoFactorMethod.AUTHENTICATOR_APP);
        GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
        account.setAuthenticatorSecret(key.getKey());
        account.setAuthenticatorConfirmed(false);
        userAccountRepository.save(account);

        String qr = buildOtpAuthUri(account);
        return AuthenticatorEnrollmentResponse.builder()
                .qrCodeUri(qr)
                .manualEntryKey(key.getKey())
                .build();
    }

    @Override
    public SecuritySettingsResponse verifyAuthenticatorEnrollment(AuthenticatedUser user, AuthenticatorVerifyRequest request) {
        UserAccount account = loadAccount(user);
        if (account.getAuthenticatorSecret() == null || account.getAuthenticatorSecret().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Start authenticator setup first.");
        }

        int code;
        try {
            code = Integer.parseInt(request.getCode().trim());
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter the 6-digit code from your authenticator app.");
        }

        boolean ok = googleAuthenticator.authorize(account.getAuthenticatorSecret(), code);
        if (!ok) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The authenticator code is incorrect.");
        }

        account.setAuthenticatorConfirmed(true);
        account.setPreferredTwoFactorMethod(TwoFactorMethod.AUTHENTICATOR_APP);
        account.setTwoFactorEnabled(true);
        userAccountRepository.save(account);
        return toResponse(account);
    }

    @Override
    public SecuritySettingsResponse resetAuthenticator(AuthenticatedUser user) {
        UserAccount account = loadAccount(user);
        account.setAuthenticatorSecret(null);
        account.setAuthenticatorConfirmed(false);
        userAccountRepository.save(account);
        return toResponse(account);
    }

    @Override
    public void dismissGoogleTwoFactorPrompt(AuthenticatedUser user) {
        UserAccount account = loadAccount(user);
        account.setGoogleTwoFactorPromptDismissed(true);
        account.setFirstLoginTwoFactorSetupSkipped(true);
        userAccountRepository.save(account);
    }

    private UserAccount loadAccount(AuthenticatedUser user) {
        return userAccountRepository.findById(user.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found."));
    }

    private SecuritySettingsResponse toResponse(UserAccount account) {
        boolean pendingEnrollment = account.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                && StringUtils.hasText(account.getAuthenticatorSecret())
                && !account.isAuthenticatorConfirmed();

        SecuritySettingsResponse.SecuritySettingsResponseBuilder b = SecuritySettingsResponse.builder()
                .twoFactorEnabled(account.getTwoFactorEnabled())
                .preferredTwoFactorMethod(account.getPreferredTwoFactorMethod())
                .authenticatorConfigured(
                        account.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                                && account.isAuthenticatorConfirmed()
                )
                .pendingAuthenticatorEnrollment(pendingEnrollment)
                .emailNotificationsEnabled(account.isEmailNotificationsEnabled())
                .appNotificationsEnabled(account.isAppNotificationsEnabled())
                .googleTwoFactorPromptDismissed(account.isGoogleTwoFactorPromptDismissed());
        if (pendingEnrollment && StringUtils.hasText(account.getAuthenticatorSecret())) {
            b.manualEntryKey(account.getAuthenticatorSecret().trim());
            b.qrCodeUri(buildOtpAuthUri(account));
        }
        return b.build();
    }

    private String buildOtpAuthUri(UserAccount userAccount) {
        String label = URLEncoder.encode("Smart Campus Operations Hub:" + userAccount.getEmail(), StandardCharsets.UTF_8);
        String issuer = URLEncoder.encode("Smart Campus Operations Hub", StandardCharsets.UTF_8);
        return "otpauth://totp/" + label + "?secret=" + userAccount.getAuthenticatorSecret() + "&issuer=" + issuer;
    }
}

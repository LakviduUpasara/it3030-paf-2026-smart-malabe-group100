package com.example.app.controller;

import com.example.app.dto.account.AuthenticatorEnrollmentResponse;
import com.example.app.dto.account.AuthenticatorVerifyRequest;
import com.example.app.dto.account.SecuritySettingsResponse;
import com.example.app.dto.account.SecuritySettingsUpdateRequest;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.AccountSecurityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * User-facing aliases under {@code /api/v1/settings/security} (same behavior as {@code /api/v1/account/security-settings}).
 */
@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class UserSecuritySettingsController {

    private final AccountSecurityService accountSecurityService;

    @GetMapping("/security")
    public ResponseEntity<SecuritySettingsResponse> getSecurity(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to load security settings.");
        }
        return ResponseEntity.ok(accountSecurityService.getSecuritySettings(user));
    }

    @PutMapping("/security")
    public ResponseEntity<SecuritySettingsResponse> putSecurity(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody SecuritySettingsUpdateRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to update security settings.");
        }
        return ResponseEntity.ok(accountSecurityService.updateSecuritySettings(user, request));
    }

    @PostMapping("/security/authenticator/start")
    public ResponseEntity<AuthenticatorEnrollmentResponse> startAuthenticator(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to set up an authenticator app.");
        }
        return ResponseEntity.ok(accountSecurityService.startAuthenticatorEnrollment(user));
    }

    @PostMapping("/security/authenticator/verify")
    public ResponseEntity<SecuritySettingsResponse> verifyAuthenticator(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody AuthenticatorVerifyRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to finish authenticator setup.");
        }
        return ResponseEntity.ok(accountSecurityService.verifyAuthenticatorEnrollment(user, request));
    }

    @PostMapping("/security/authenticator/reset")
    public ResponseEntity<SecuritySettingsResponse> resetAuthenticator(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to reset your authenticator.");
        }
        return ResponseEntity.ok(accountSecurityService.resetAuthenticator(user));
    }
}

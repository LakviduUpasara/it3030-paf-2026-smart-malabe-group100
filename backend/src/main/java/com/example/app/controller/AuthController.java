package com.example.app.controller;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.DevLoginRequest;
import com.example.app.dto.auth.GoogleCredentialRequest;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.GoogleSignupSessionResponse;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthFlowResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthFlowResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/dev-login")
    public ResponseEntity<AuthFlowResponse> devLogin(@Valid @RequestBody DevLoginRequest request) {
        return ResponseEntity.ok(authService.devLogin(request.getEmail()));
    }

    @PostMapping("/google/signup-session")
    public ResponseEntity<GoogleSignupSessionResponse> prepareGoogleSignup(
            @Valid @RequestBody GoogleCredentialRequest request
    ) {
        return ResponseEntity.ok(authService.prepareGoogleSignup(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthFlowResponse> loginWithGoogle(@Valid @RequestBody GoogleCredentialRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @PostMapping("/apple")
    public ResponseEntity<AuthFlowResponse> loginWithApple(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithApple(request));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<AuthFlowResponse> verifyTwoFactor(@Valid @RequestBody VerifyTwoFactorRequest request) {
        return ResponseEntity.ok(authService.verifyTwoFactor(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader) {
        authService.logout(authorizationHeader);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<AuthFlowResponse> getCurrentSession(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        if (authenticatedUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "No active session was found.");
        }

        return ResponseEntity.ok(authService.getCurrentSession(authenticatedUser));
    }

    @GetMapping("/signup-requests/{requestId}/status")
    public ResponseEntity<PendingApprovalResponse> getSignupRequestStatus(
            @PathVariable String requestId,
            @RequestParam String email
    ) {
        return ResponseEntity.ok(authService.getSignupRequestStatus(requestId, email));
    }

    @PostMapping("/signup-requests/{requestId}/activate")
    public ResponseEntity<AuthFlowResponse> activateApprovedSignup(
            @PathVariable String requestId,
            @RequestParam String email
    ) {
        return ResponseEntity.ok(authService.activateApprovedSignup(requestId, email));
    }
}

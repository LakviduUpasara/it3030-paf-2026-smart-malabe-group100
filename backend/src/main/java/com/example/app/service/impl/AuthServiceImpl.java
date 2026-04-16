package com.example.app.service.impl;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.AuthFlowStatus;
import com.example.app.dto.auth.AuthenticatedUserResponse;
import com.example.app.dto.auth.GoogleCredentialRequest;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.GoogleSignupSessionResponse;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.TwoFactorChallengeResponse;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.entity.GoogleSignupSession;
import com.example.app.entity.SessionToken;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.TwoFactorChallenge;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.exception.ApiException;
import com.example.app.repository.GoogleSignupSessionRepository;
import com.example.app.repository.SessionTokenRepository;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.TwoFactorChallengeRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import com.example.app.security.GoogleIdentityVerifier;
import com.example.app.security.VerifiedGoogleAccount;
import com.example.app.service.AuthService;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final GoogleSignupSessionRepository googleSignupSessionRepository;
    private final SessionTokenRepository sessionTokenRepository;
    private final TwoFactorChallengeRepository twoFactorChallengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleAuthenticator googleAuthenticator;
    private final GoogleIdentityVerifier googleIdentityVerifier;

    @Value("${app.auth.session-hours:12}")
    private long sessionHours;

    @Value("${app.auth.challenge-minutes:10}")
    private long challengeMinutes;

    @Value("${app.auth.dev-expose-otp:true}")
    private boolean exposeDevelopmentOtp;

    @Value("${app.auth.google.signup-session-minutes:15}")
    private long googleSignupSessionMinutes;

    @Override
    public AuthFlowResponse register(RegisterRequest request) {
        AuthProvider authProvider = request.getAuthProvider() == null ? AuthProvider.LOCAL : request.getAuthProvider();
        String normalizedPassword = request.getPassword() == null ? "" : request.getPassword().trim();
        String normalizedEmail;
        String normalizedFullName;
        String providerSubject = null;
        TwoFactorMethod preferredTwoFactorMethod = request.getPreferredTwoFactorMethod() == null
                ? TwoFactorMethod.AUTHENTICATOR_APP
                : request.getPreferredTwoFactorMethod();

        if (authProvider == AuthProvider.GOOGLE) {
            GoogleSignupSession signupSession = resolveGoogleSignupSession(request.getSocialSignupToken());
            normalizedEmail = signupSession.getEmail();
            normalizedFullName = signupSession.getFullName();
            providerSubject = signupSession.getProviderSubject();
        } else {
            normalizedEmail = normalizeEmail(request.getEmail());
            normalizedFullName = request.getFullName().trim();
        }

        if (authProvider == AuthProvider.LOCAL) {
            if (normalizedPassword.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required for local sign up.");
            }

            if (normalizedPassword.length() < 8 || normalizedPassword.length() > 100) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be between 8 and 100 characters.");
            }
        }

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "An approved account already exists for this email.");
        }

        SignupRequest signupRequest = signupRequestRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> SignupRequest.builder().id(UUID.randomUUID().toString()).build());

        if (signupRequest.getStatus() == SignupRequestStatus.PENDING) {
            return pendingResponse(signupRequest, "A registration request for this email is already pending review.");
        }

        signupRequest.setFullName(normalizedFullName);
        signupRequest.setEmail(normalizedEmail);
        signupRequest.setProviderSubject(providerSubject);
        signupRequest.setPasswordHash(authProvider == AuthProvider.LOCAL
                ? passwordEncoder.encode(normalizedPassword)
                : null);
        signupRequest.setCampusId(request.getCampusId().trim());
        signupRequest.setPhoneNumber(request.getPhoneNumber().trim());
        signupRequest.setDepartment(request.getDepartment().trim());
        signupRequest.setReasonForAccess(request.getReasonForAccess().trim());
        signupRequest.setAuthProvider(authProvider);
        signupRequest.setPreferredTwoFactorMethod(preferredTwoFactorMethod);
        signupRequest.setStatus(SignupRequestStatus.PENDING);
        signupRequest.setAssignedRole(null);
        signupRequest.setReviewerNote(null);
        signupRequest.setReviewedAt(null);
        signupRequest.setRequestedAt(LocalDateTime.now());

        SignupRequest savedRequest = signupRequestRepository.save(signupRequest);
        if (authProvider == AuthProvider.GOOGLE) {
            googleSignupSessionRepository.deleteById(request.getSocialSignupToken());
        }
        return pendingResponse(savedRequest, "Your sign up request has been sent to the campus administrator for approval.");
    }

    @Override
    public AuthFlowResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<UserAccount> userAccountOptional = userAccountRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userAccountOptional.isEmpty()) {
            return resolveSignupRequestState(normalizedEmail, "No approved account was found for this email.");
        }

        UserAccount userAccount = userAccountOptional.get();
        ensureActiveUser(userAccount);

        if (userAccount.getProvider() == AuthProvider.GOOGLE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Use Google sign-in for this account.");
        }

        if (userAccount.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), userAccount.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return buildTwoFactorChallenge(userAccount);
    }

    @Override
    public GoogleSignupSessionResponse prepareGoogleSignup(GoogleCredentialRequest request) {
        VerifiedGoogleAccount googleAccount = googleIdentityVerifier.verify(request.getCredential());
        Optional<UserAccount> approvedAccount = userAccountRepository
                .findByProviderAndProviderSubject(AuthProvider.GOOGLE, googleAccount.subject());

        if (approvedAccount.isEmpty()) {
            approvedAccount = userAccountRepository.findByEmailIgnoreCase(googleAccount.email());
        }

        if (approvedAccount.isPresent()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "This Google account already has an approved Smart Campus account. Please log in instead."
            );
        }

        Optional<SignupRequest> existingSignupRequest = signupRequestRepository
                .findByEmailIgnoreCase(googleAccount.email());

        if (existingSignupRequest.isPresent()
                && existingSignupRequest.get().getStatus() == SignupRequestStatus.PENDING) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "A sign up request for this Google account is already pending administrator approval."
            );
        }

        googleSignupSessionRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        googleSignupSessionRepository.deleteByProviderAndProviderSubject(AuthProvider.GOOGLE, googleAccount.subject());

        GoogleSignupSession signupSession = googleSignupSessionRepository.save(GoogleSignupSession.builder()
                .id(UUID.randomUUID().toString())
                .provider(AuthProvider.GOOGLE)
                .providerSubject(googleAccount.subject())
                .email(googleAccount.email())
                .fullName(googleAccount.fullName())
                .pictureUrl(googleAccount.pictureUrl())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(googleSignupSessionMinutes))
                .build());

        return GoogleSignupSessionResponse.builder()
                .signupToken(signupSession.getId())
                .fullName(signupSession.getFullName())
                .email(signupSession.getEmail())
                .pictureUrl(signupSession.getPictureUrl())
                .provider(AuthProvider.GOOGLE)
                .build();
    }

    @Override
    public AuthFlowResponse loginWithGoogle(GoogleCredentialRequest request) {
        VerifiedGoogleAccount googleAccount = googleIdentityVerifier.verify(request.getCredential());
        Optional<UserAccount> userAccountOptional = userAccountRepository
                .findByProviderAndProviderSubject(AuthProvider.GOOGLE, googleAccount.subject());

        if (userAccountOptional.isEmpty()) {
            userAccountOptional = userAccountRepository.findByEmailIgnoreCase(googleAccount.email())
                    .filter(userAccount -> userAccount.getProvider() == AuthProvider.GOOGLE);
        }

        if (userAccountOptional.isEmpty()) {
            return resolveSignupRequestState(
                    googleAccount.email(),
                    "No approved Google account was found for this email."
            );
        }

        UserAccount userAccount = userAccountOptional.get();
        ensureActiveUser(userAccount);

        if (userAccount.getProvider() != AuthProvider.GOOGLE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google sign-in is not configured for this account.");
        }

        if (userAccount.getProviderSubject() == null || userAccount.getProviderSubject().isBlank()) {
            userAccount.setProviderSubject(googleAccount.subject());
            userAccountRepository.save(userAccount);
        } else if (!userAccount.getProviderSubject().equals(googleAccount.subject())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "This Google account does not match the approved campus account.");
        }

        return buildTwoFactorChallenge(userAccount);
    }

    @Override
    public AuthFlowResponse loginWithApple(GoogleLoginRequest request) {
        return loginWithSocialProvider(request, AuthProvider.APPLE, "Apple");
    }

    @Override
    public AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
        TwoFactorChallenge challenge = twoFactorChallengeRepository.findById(request.getChallengeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "2-step verification challenge was not found."));

        if (challenge.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This verification challenge has already been used.");
        }

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This verification code has expired. Please sign in again.");
        }

        UserAccount userAccount = userAccountRepository.findById(challenge.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "The account linked to this challenge no longer exists."));
        String normalizedCode = request.getCode().trim();

        if (challenge.getMethod() == TwoFactorMethod.EMAIL_OTP) {
            if (!normalizedCode.equals(challenge.getOtpCode())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "The email verification code is incorrect.");
            }
        } else {
            int verificationCode;
            try {
                verificationCode = Integer.parseInt(normalizedCode);
            } catch (NumberFormatException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Enter the 6-digit code from your authenticator app.");
            }

            boolean isValidCode = googleAuthenticator.authorize(userAccount.getAuthenticatorSecret(), verificationCode);
            if (!isValidCode) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "The authenticator code is incorrect.");
            }

            if (!userAccount.isAuthenticatorConfirmed()) {
                userAccount.setAuthenticatorConfirmed(true);
                userAccountRepository.save(userAccount);
            }
        }

        challenge.setUsed(true);
        challenge.setVerifiedAt(LocalDateTime.now());
        twoFactorChallengeRepository.save(challenge);

        return authenticatedResponse(userAccount, "2-step verification completed successfully.");
    }

    @Override
    public void logout(String bearerToken) {
        String tokenValue = extractBearerToken(bearerToken);
        if (tokenValue != null) {
            sessionTokenRepository.deleteById(tokenValue);
        }
    }

    @Override
    public PendingApprovalResponse getSignupRequestStatus(String requestId, String email) {
        SignupRequest signupRequest = signupRequestRepository.findByIdAndEmailIgnoreCase(requestId, normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sign up request was not found."));

        return toPendingApprovalResponse(signupRequest, getSignupRequestMessage(signupRequest));
    }

    @Override
    public AuthFlowResponse activateApprovedSignup(String requestId, String email) {
        SignupRequest signupRequest = signupRequestRepository.findByIdAndEmailIgnoreCase(requestId, normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sign up request was not found."));

        if (signupRequest.getStatus() == SignupRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This sign up request is still waiting for administrator approval.");
        }

        if (signupRequest.getStatus() == SignupRequestStatus.REJECTED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This sign up request was rejected and cannot open a workspace.");
        }

        UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(signupRequest.getEmail())
                .orElseThrow(() -> new ApiException(
                        HttpStatus.CONFLICT,
                        "The approved account is not ready yet. Ask the administrator to review the approval again."
                ));

        ensureActiveUser(userAccount);
        return buildTwoFactorChallenge(userAccount);
    }

    @Override
    public AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser) {
        UserAccount userAccount = userAccountRepository.findById(authenticatedUser.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "The current session is no longer valid."));

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message("Authenticated session loaded successfully.")
                .user(toAuthenticatedUserResponse(userAccount))
                .build();
    }

    private AuthFlowResponse resolveSignupRequestState(String email, String fallbackMessage) {
        Optional<SignupRequest> signupRequest = signupRequestRepository.findByEmailIgnoreCase(email);

        if (signupRequest.isPresent()) {
            SignupRequest request = signupRequest.get();
            return pendingResponse(request, getSignupRequestMessage(request));
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, fallbackMessage);
    }

    private void ensureActiveUser(UserAccount userAccount) {
        if (userAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active yet.");
        }
    }

    private AuthFlowResponse buildTwoFactorChallenge(UserAccount userAccount) {
        twoFactorChallengeRepository.deleteByUserId(userAccount.getId());

        // Persist the challenge as a small Mongo document so 2FA can be resumed safely.
        TwoFactorChallenge challenge = TwoFactorChallenge.builder()
                .id(UUID.randomUUID().toString())
                .userId(userAccount.getId())
                .method(userAccount.getPreferredTwoFactorMethod())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(challengeMinutes))
                .used(false)
                .build();

        AuthFlowStatus authFlowStatus = AuthFlowStatus.TWO_FACTOR_REQUIRED;
        String message = "Enter the code from your second verification step to continue.";

        if (userAccount.getPreferredTwoFactorMethod() == TwoFactorMethod.EMAIL_OTP) {
            String otpCode = generateOtpCode();
            challenge.setOtpCode(otpCode);
            log.info("Smart Campus email OTP for {} is {}", userAccount.getEmail(), otpCode);
        } else {
            if (userAccount.getAuthenticatorSecret() == null || userAccount.getAuthenticatorSecret().isBlank()) {
                GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
                userAccount.setAuthenticatorSecret(key.getKey());
                userAccount.setAuthenticatorConfirmed(false);
                userAccountRepository.save(userAccount);
            }

            if (!userAccount.isAuthenticatorConfirmed()) {
                authFlowStatus = AuthFlowStatus.AUTHENTICATOR_SETUP_REQUIRED;
                message = "Set up your authenticator app with the provided key and enter the generated code.";
            }
        }

        TwoFactorChallenge savedChallenge = twoFactorChallengeRepository.save(challenge);

        return AuthFlowResponse.builder()
                .authStatus(authFlowStatus)
                .message(message)
                .twoFactorChallenge(toTwoFactorResponse(savedChallenge, userAccount, authFlowStatus))
                .build();
    }

    private AuthFlowResponse authenticatedResponse(UserAccount userAccount, String message) {
        sessionTokenRepository.deleteByUserId(userAccount.getId());
        SessionToken sessionToken = sessionTokenRepository.save(SessionToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .userId(userAccount.getId())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(sessionHours))
                .build());

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message(message)
                .token(sessionToken.getToken())
                .user(toAuthenticatedUserResponse(userAccount))
                .build();
    }

    private AuthFlowResponse pendingResponse(SignupRequest signupRequest, String message) {
        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.PENDING_APPROVAL)
                .message(message)
                .pendingApproval(toPendingApprovalResponse(signupRequest, message))
                .build();
    }

    private AuthenticatedUserResponse toAuthenticatedUserResponse(UserAccount userAccount) {
        return AuthenticatedUserResponse.builder()
                .id(userAccount.getId())
                .name(userAccount.getFullName())
                .email(userAccount.getEmail())
                .role(userAccount.getRole())
                .status(userAccount.getStatus())
                .provider(userAccount.getProvider())
                .preferredTwoFactorMethod(userAccount.getPreferredTwoFactorMethod())
                .build();
    }

    private PendingApprovalResponse toPendingApprovalResponse(SignupRequest signupRequest, String message) {
        return PendingApprovalResponse.builder()
                .requestId(signupRequest.getId())
                .applicantName(signupRequest.getFullName())
                .email(signupRequest.getEmail())
                .provider(signupRequest.getAuthProvider() == null ? AuthProvider.LOCAL : signupRequest.getAuthProvider())
                .status(signupRequest.getStatus())
                .assignedRole(signupRequest.getAssignedRole())
                .reviewerNote(signupRequest.getReviewerNote())
                .requestedAt(signupRequest.getRequestedAt())
                .reviewedAt(signupRequest.getReviewedAt())
                .message(message)
                .build();
    }

    private TwoFactorChallengeResponse toTwoFactorResponse(
            TwoFactorChallenge challenge,
            UserAccount userAccount,
            AuthFlowStatus authFlowStatus
    ) {
        return TwoFactorChallengeResponse.builder()
                .challengeId(challenge.getId())
                .method(challenge.getMethod())
                .expiresAt(challenge.getExpiresAt())
                .message(authFlowStatus == AuthFlowStatus.AUTHENTICATOR_SETUP_REQUIRED
                        ? "Complete your authenticator app setup to finish sign-in."
                        : "Complete your second verification step to finish sign-in.")
                .deliveryHint(challenge.getMethod() == TwoFactorMethod.EMAIL_OTP
                        ? "The one-time code is dispatched through the email verification channel. In this demo build it is also exposed below."
                        : "Open Google Authenticator (or a compatible app), add the provided manual key, then enter the generated 6-digit code.")
                .manualEntryKey(challenge.getMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                        ? userAccount.getAuthenticatorSecret()
                        : null)
                .qrCodeUri(challenge.getMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                        ? buildOtpAuthUri(userAccount)
                        : null)
                .debugCode(exposeDevelopmentOtp && challenge.getMethod() == TwoFactorMethod.EMAIL_OTP
                        ? challenge.getOtpCode()
                        : null)
                .build();
    }

    private String getSignupRequestMessage(SignupRequest signupRequest) {
        return switch (signupRequest.getStatus()) {
            case PENDING -> "Your sign up request is still waiting for administrator approval.";
            case APPROVED -> "Your sign up request has been approved. Please sign in using your approved account.";
            case REJECTED -> "Your sign up request was rejected. Review the administrator note and submit a new request if needed.";
        };
    }

    private String buildOtpAuthUri(UserAccount userAccount) {
        String label = URLEncoder.encode("Smart Campus Operations Hub:" + userAccount.getEmail(), StandardCharsets.UTF_8);
        String issuer = URLEncoder.encode("Smart Campus Operations Hub", StandardCharsets.UTF_8);
        return "otpauth://totp/" + label + "?secret=" + userAccount.getAuthenticatorSecret() + "&issuer=" + issuer;
    }

    private String generateOtpCode() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }

    private String extractBearerToken(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            return null;
        }

        return bearerToken.startsWith("Bearer ") ? bearerToken.substring(7).trim() : bearerToken.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private GoogleSignupSession resolveGoogleSignupSession(String signupToken) {
        if (signupToken == null || signupToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reconnect your Google account before submitting the sign up request.");
        }

        GoogleSignupSession signupSession = googleSignupSessionRepository
                .findByIdAndProvider(signupToken.trim(), AuthProvider.GOOGLE)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.UNAUTHORIZED,
                        "The Google sign-up session is missing or expired. Connect Google again to continue."
                ));

        if (signupSession.getExpiresAt() != null && signupSession.getExpiresAt().isBefore(LocalDateTime.now())) {
            googleSignupSessionRepository.deleteById(signupSession.getId());
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "The Google sign-up session has expired. Connect Google again to continue."
            );
        }

        return signupSession;
    }

    private AuthFlowResponse loginWithSocialProvider(
            GoogleLoginRequest request,
            AuthProvider authProvider,
            String providerLabel
    ) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<UserAccount> userAccountOptional = userAccountRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userAccountOptional.isEmpty()) {
            return resolveSignupRequestState(
                    normalizedEmail,
                    "No approved " + providerLabel + " account was found for this email."
            );
        }

        UserAccount userAccount = userAccountOptional.get();
        ensureActiveUser(userAccount);

        if (userAccount.getProvider() != authProvider) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    providerLabel + " sign-in is not configured for this account."
            );
        }

        return buildTwoFactorChallenge(userAccount);
    }
}

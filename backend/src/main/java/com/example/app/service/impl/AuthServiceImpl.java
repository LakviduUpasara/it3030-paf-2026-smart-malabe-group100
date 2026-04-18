package com.example.app.service.impl;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.AuthFlowStatus;
import com.example.app.dto.auth.AuthenticatedUserResponse;
import com.example.app.dto.auth.ChangeFirstLoginPasswordRequest;
import com.example.app.dto.auth.SelectFirstLoginTwoFactorRequest;
import com.example.app.dto.auth.GoogleCredentialRequest;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.GoogleSignupSessionResponse;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.ResendEmailOtpRequest;
import com.example.app.dto.auth.TwoFactorChallengeResponse;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.entity.GoogleSignupSession;
import com.example.app.entity.SessionPhase;
import com.example.app.entity.SessionToken;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.TwoFactorChallenge;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.config.AppProperties;
import com.example.app.exception.ApiException;
import com.example.app.repository.GoogleSignupSessionRepository;
import com.example.app.repository.SessionTokenRepository;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.TwoFactorChallengeRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import com.example.app.security.GoogleIdentityVerifier;
import com.example.app.security.VerifiedGoogleAccount;
import com.example.app.service.AuthEmailOtpNotifier;
import com.example.app.service.AuthService;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Objects;
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
    private final AppProperties appProperties;
    private final AuthEmailOtpNotifier authEmailOtpNotifier;

    @Value("${app.auth.session-hours:12}")
    private long sessionHours;

    @Value("${app.auth.challenge-minutes:10}")
    private long challengeMinutes;

    @Value("${app.auth.otp-resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds;

    @Value("${app.auth.first-login-setup-hours:4}")
    private long firstLoginSetupHours;

    @Value("${app.auth.dev-expose-otp:false}")
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
        TwoFactorMethod preferredTwoFactorMethod = request.getPreferredTwoFactorMethod();
        if (preferredTwoFactorMethod == null) {
            preferredTwoFactorMethod = TwoFactorMethod.EMAIL_OTP;
        }

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

        /*
         * Sign-up never creates a UserAccount — only a SignupRequest row (pending access).
         * requestedRole is the applicant's preference; the real Role is assigned only when an admin approves.
         */
        Role requestedRole = request.getRequestedRole() == null ? Role.USER : request.getRequestedRole();
        if (requestedRole != Role.USER && requestedRole != Role.TECHNICIAN && requestedRole != Role.ADMIN) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Public registration only supports User, Technician, or Admin access requests.");
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
        signupRequest.setDepartment(blankToEmDash(request.getDepartment()));
        String extra = request.getSupplementaryProfile() == null ? "" : request.getSupplementaryProfile().trim();
        signupRequest.setSupplementaryProfile(extra.isEmpty() ? null : extra);
        signupRequest.setReasonForAccess(request.getReasonForAccess().trim());
        signupRequest.setApplicationProfileJson(trimOrNull(request.getApplicationProfileJson()));
        signupRequest.setAuthProvider(authProvider);
        signupRequest.setPreferredTwoFactorMethod(preferredTwoFactorMethod);
        signupRequest.setStatus(SignupRequestStatus.PENDING);
        signupRequest.setRequestedRole(requestedRole);
        signupRequest.setAssignedRole(null);
        signupRequest.setReviewerNote(null);
        signupRequest.setRejectionReason(null);
        signupRequest.setReviewedBy(null);
        signupRequest.setReviewedAt(null);
        signupRequest.setRequestedAt(LocalDateTime.now());

        SignupRequest savedRequest = signupRequestRepository.save(signupRequest);
        if (authProvider == AuthProvider.GOOGLE) {
            googleSignupSessionRepository.deleteById(request.getSocialSignupToken());
        }
        return pendingResponse(
                savedRequest, "Your access request has been submitted for administrator review.");
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

        if (appProperties.isDeveloperMode()) {
            return authenticatedResponse(userAccount, "Developer mode: second factor is disabled.");
        }

        if (userAccount.isMustChangePassword()) {
            return passwordChangeRequiredResponse(userAccount);
        }

        if (!userAccount.requiresTwoFactorAtLogin()) {
            return authenticatedResponse(userAccount, "Signed in successfully.");
        }

        return buildTwoFactorChallenge(userAccount, false);
    }

    @Override
    public AuthFlowResponse devLogin(String email) {
        if (!appProperties.isDeveloperMode()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Developer sign-in is disabled. Set APP_DEVELOPER_MODE=true, or run the API with "
                            + "spring.profiles.active=dev (see application-dev.properties).");
        }

        String normalizedEmail = normalizeEmail(email);
        UserAccount userAccount = userAccountRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "No approved account was found for this email."));

        ensureActiveUser(userAccount);
        return authenticatedResponse(userAccount, "Developer mode: signed in without a password or second factor.");
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
                .expiresAt(signupSession.getExpiresAt())
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

        if (appProperties.isDeveloperMode()) {
            return authenticatedResponse(userAccount, "Developer mode: second factor is disabled.");
        }

        if (userAccount.isMustChangePassword()) {
            userAccount.setMustChangePassword(false);
            userAccountRepository.save(userAccount);
        }

        if (!userAccount.requiresTwoFactorAtLogin()) {
            return authenticatedResponse(userAccount, "Signed in with Google successfully.");
        }

        return buildTwoFactorChallenge(userAccount, false);
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

        if (appProperties.isDeveloperMode()) {
            challenge.setUsed(true);
            challenge.setVerifiedAt(LocalDateTime.now());
            twoFactorChallengeRepository.save(challenge);
            return authenticatedResponse(userAccount, "Developer mode: verification bypassed.");
        }

        String normalizedCode = request.getCode().trim();

        if (challenge.getMethod() == TwoFactorMethod.EMAIL_OTP) {
            if (!normalizedCode.equals(challenge.getOtpCode())) {
                log.warn("Invalid email OTP for challenge {} (user {})", challenge.getId(), challenge.getUserId());
                throw new ApiException(HttpStatus.BAD_REQUEST, "The email verification code is incorrect.");
            }
            log.info("Email OTP verified for user {}", userAccount.getId());
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
    public AuthFlowResponse resendEmailOtp(ResendEmailOtpRequest request) {
        TwoFactorChallenge challenge = twoFactorChallengeRepository
                .findById(request.getChallengeId().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Verification challenge was not found."));

        if (challenge.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This verification step was already completed.");
        }

        if (challenge.getMethod() != TwoFactorMethod.EMAIL_OTP) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Resend is only available for email verification codes.");
        }

        if (challenge.getExpiresAt() != null && challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This code has expired. Please sign in again.");
        }

        LocalDateTime last =
                challenge.getLastOtpSentAt() != null ? challenge.getLastOtpSentAt() : challenge.getCreatedAt();
        if (last != null) {
            LocalDateTime nextAllowed = last.plusSeconds(otpResendCooldownSeconds);
            if (LocalDateTime.now().isBefore(nextAllowed)) {
                throw new ApiException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Please wait before requesting another code."
                );
            }
        }

        UserAccount userAccount = userAccountRepository
                .findById(challenge.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found."));

        if (appProperties.isDeveloperMode()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Developer mode is on: email OTP resend is not used.");
        }

        String otpCode = generateOtpCode();
        challenge.setOtpCode(otpCode);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(challengeMinutes));
        challenge.setLastOtpSentAt(LocalDateTime.now());

        TwoFactorChallenge saved = twoFactorChallengeRepository.save(challenge);
        try {
            authEmailOtpNotifier.sendSignInOtp(userAccount.getEmail(), otpCode);
        } catch (RuntimeException ex) {
            twoFactorChallengeRepository.deleteById(saved.getId());
            throw ex;
        }

        log.info("Email OTP resent for user {} challenge {}", userAccount.getId(), saved.getId());

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.TWO_FACTOR_REQUIRED)
                .message("A new verification code was sent to your email.")
                .twoFactorChallenge(toTwoFactorResponse(saved, userAccount, AuthFlowStatus.TWO_FACTOR_REQUIRED))
                .build();
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

        if (appProperties.isDeveloperMode()) {
            return authenticatedResponse(userAccount, "Developer mode: second factor is disabled.");
        }

        if (userAccount.isMustChangePassword()) {
            return passwordChangeRequiredResponse(userAccount);
        }

        if (!userAccount.requiresTwoFactorAtLogin()) {
            return authenticatedResponse(userAccount, "Your workspace is ready.");
        }

        return buildTwoFactorChallenge(userAccount, false);
    }

    @Override
    public AuthFlowResponse changeFirstLoginPassword(
            ChangeFirstLoginPasswordRequest request,
            AuthenticatedUser user,
            String authorizationHeader
    ) {
        String tokenValue = extractBearerToken(authorizationHeader);
        if (tokenValue == null || tokenValue.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in again to continue password setup.");
        }
        SessionToken sessionToken = sessionTokenRepository
                .findById(tokenValue.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Your setup session expired. Please sign in again."));
        if (sessionToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessionTokenRepository.deleteById(tokenValue.trim());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your setup session expired. Please sign in again.");
        }
        if (sessionToken.getPhase() != SessionPhase.PASSWORD_CHANGE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password change is not required for this session.");
        }
        if (!Objects.equals(sessionToken.getUserId(), user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Session does not match the signed-in user.");
        }

        UserAccount userAccount = userAccountRepository
                .findById(user.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (userAccount.getPasswordHash() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), userAccount.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Current password is incorrect.");
        }

        userAccount.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        userAccount.setMustChangePassword(false);
        userAccountRepository.save(userAccount);

        sessionTokenRepository.deleteById(tokenValue.trim());

        SessionToken nextToken = sessionTokenRepository.save(SessionToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .userId(userAccount.getId())
                .phase(SessionPhase.TWO_FACTOR_METHOD_SELECTION)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(firstLoginSetupHours))
                .build());

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.TWO_FACTOR_METHOD_SELECTION_REQUIRED)
                .message("Choose how you want to verify sign-in: email code or authenticator app.")
                .token(nextToken.getToken())
                .user(toAuthenticatedUserResponse(userAccount))
                .sessionPhase(SessionPhase.TWO_FACTOR_METHOD_SELECTION.name())
                .build();
    }

    @Override
    public AuthFlowResponse selectFirstLoginTwoFactor(
            SelectFirstLoginTwoFactorRequest request,
            AuthenticatedUser user,
            String authorizationHeader
    ) {
        String tokenValue = extractBearerToken(authorizationHeader);
        if (tokenValue == null || tokenValue.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in again to continue setup.");
        }
        SessionToken sessionToken = sessionTokenRepository
                .findById(tokenValue.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Your setup session expired. Please sign in again."));
        if (sessionToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            sessionTokenRepository.deleteById(tokenValue.trim());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your setup session expired. Please sign in again.");
        }
        if (sessionToken.getPhase() != SessionPhase.TWO_FACTOR_METHOD_SELECTION) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose your verification method in the sign-in setup flow.");
        }
        if (!Objects.equals(sessionToken.getUserId(), user.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Session does not match the signed-in user.");
        }

        UserAccount userAccount = userAccountRepository
                .findById(user.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (Boolean.TRUE.equals(request.getSkipTwoFactor())) {
            if (request.getMethod() != null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Do not send a method when skipping 2-step verification.");
            }
            userAccount.setTwoFactorEnabled(false);
            userAccount.setAuthenticatorSecret(null);
            userAccount.setAuthenticatorConfirmed(false);
            userAccountRepository.save(userAccount);

            sessionTokenRepository.deleteById(tokenValue.trim());

            UserAccount reloaded = userAccountRepository
                    .findById(userAccount.getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

            if (appProperties.isDeveloperMode()) {
                return authenticatedResponse(reloaded, "Developer mode: 2-step verification skipped.");
            }
            return authenticatedResponse(
                    reloaded,
                    "You can enable 2-step verification later in Administration → System Settings."
            );
        }

        TwoFactorMethod method = request.getMethod();
        if (method == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a verification method or skip 2-step verification.");
        }

        userAccount.setTwoFactorEnabled(true);
        userAccount.setPreferredTwoFactorMethod(method);
        if (method == TwoFactorMethod.EMAIL_OTP) {
            userAccount.setAuthenticatorSecret(null);
            userAccount.setAuthenticatorConfirmed(false);
        } else {
            GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
            userAccount.setAuthenticatorSecret(key.getKey());
            userAccount.setAuthenticatorConfirmed(false);
        }
        userAccountRepository.save(userAccount);

        sessionTokenRepository.deleteById(tokenValue.trim());

        UserAccount reloaded = userAccountRepository
                .findById(userAccount.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Account not found."));

        if (appProperties.isDeveloperMode()) {
            return authenticatedResponse(reloaded, "Developer mode: 2FA method saved, second factor is disabled.");
        }

        boolean enrollmentStep = method == TwoFactorMethod.AUTHENTICATOR_APP;
        return buildTwoFactorChallenge(reloaded, enrollmentStep);
    }

    @Override
    public AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser, String authorizationHeader) {
        UserAccount userAccount = userAccountRepository.findById(authenticatedUser.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "The current session is no longer valid."));

        String tokenValue = extractBearerToken(authorizationHeader);
        String sessionPhaseName = null;
        if (tokenValue != null && !tokenValue.isBlank()) {
            Optional<SessionToken> st = sessionTokenRepository.findById(tokenValue.trim());
            if (st.isPresent() && st.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                SessionPhase p = st.get().getPhase();
                if (p != null && p != SessionPhase.FULL) {
                    sessionPhaseName = p.name();
                }
            }
        }

        boolean googlePrompt = shouldOfferOptionalGoogleTwoFactorPrompt(userAccount);

        AuthFlowResponse.AuthFlowResponseBuilder builder = AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message("Authenticated session loaded successfully.")
                .user(toAuthenticatedUserResponse(userAccount, googlePrompt))
                .showGoogleTwoFactorSetupPrompt(googlePrompt ? Boolean.TRUE : null);
        if (sessionPhaseName != null) {
            builder.sessionPhase(sessionPhaseName);
        }
        return builder.build();
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

    /**
     * Chooses email OTP vs authenticator based on the account.
     *
     * @param authenticatorEnrollmentStep when {@code true}, the user just chose the authenticator app during first-login
     *                                      and a new secret was saved — show QR/setup. When {@code false} (normal sign-in),
     *                                      if a secret exists but the app was never confirmed, send email OTP instead so
     *                                      abandoned setups do not block access.
     */
    private TwoFactorMethod resolveEffectiveTwoFactorMethod(
            UserAccount userAccount, boolean authenticatorEnrollmentStep
    ) {
        TwoFactorMethod preferred = userAccount.getPreferredTwoFactorMethod();
        if (preferred == null || preferred == TwoFactorMethod.EMAIL_OTP) {
            return TwoFactorMethod.EMAIL_OTP;
        }
        String secret = userAccount.getAuthenticatorSecret();
        boolean hasSecret = secret != null && !secret.isBlank();
        if (!hasSecret) {
            return TwoFactorMethod.EMAIL_OTP;
        }
        if (!userAccount.isAuthenticatorConfirmed()) {
            if (authenticatorEnrollmentStep) {
                return TwoFactorMethod.AUTHENTICATOR_APP;
            }
            return TwoFactorMethod.EMAIL_OTP;
        }
        return TwoFactorMethod.AUTHENTICATOR_APP;
    }

    private AuthFlowResponse buildTwoFactorChallenge(UserAccount userAccount) {
        return buildTwoFactorChallenge(userAccount, false);
    }

    private AuthFlowResponse buildTwoFactorChallenge(UserAccount userAccount, boolean authenticatorEnrollmentStep) {
        if (!userAccount.requiresTwoFactorAtLogin()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "2-step verification is turned off for this account. Sign in again without a verification step."
            );
        }

        twoFactorChallengeRepository.deleteByUserId(userAccount.getId());

        TwoFactorMethod method = resolveEffectiveTwoFactorMethod(userAccount, authenticatorEnrollmentStep);

        // Persist the challenge as a small Mongo document so 2FA can be resumed safely.
        TwoFactorChallenge challenge = TwoFactorChallenge.builder()
                .id(UUID.randomUUID().toString())
                .userId(userAccount.getId())
                .method(method)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(challengeMinutes))
                .used(false)
                .build();

        AuthFlowStatus authFlowStatus = AuthFlowStatus.TWO_FACTOR_REQUIRED;
        String message = "Enter the code from your second verification step to continue.";

        if (method == TwoFactorMethod.EMAIL_OTP) {
            String otpCode = generateOtpCode();
            challenge.setOtpCode(otpCode);
            challenge.setLastOtpSentAt(LocalDateTime.now());
            if (userAccount.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP) {
                message =
                        "We sent a one-time code to your email. Use it to sign in. If you have not finished linking Google Authenticator, you can complete that later from your account settings.";
            }
            TwoFactorChallenge saved = twoFactorChallengeRepository.save(challenge);
            try {
                authEmailOtpNotifier.sendSignInOtp(userAccount.getEmail(), otpCode);
            } catch (RuntimeException ex) {
                twoFactorChallengeRepository.deleteById(saved.getId());
                throw ex;
            }
            return AuthFlowResponse.builder()
                    .authStatus(authFlowStatus)
                    .message(message)
                    .twoFactorChallenge(toTwoFactorResponse(saved, userAccount, authFlowStatus))
                    .build();
        }

        if (userAccount.getAuthenticatorSecret() == null || userAccount.getAuthenticatorSecret().isBlank()) {
            log.warn("Effective method was AUTHENTICATOR_APP but secret missing for user {}", userAccount.getId());
            String otpCode = generateOtpCode();
            challenge.setMethod(TwoFactorMethod.EMAIL_OTP);
            challenge.setOtpCode(otpCode);
            challenge.setLastOtpSentAt(LocalDateTime.now());
            TwoFactorChallenge saved = twoFactorChallengeRepository.save(challenge);
            try {
                authEmailOtpNotifier.sendSignInOtp(userAccount.getEmail(), otpCode);
            } catch (RuntimeException ex) {
                twoFactorChallengeRepository.deleteById(saved.getId());
                throw ex;
            }
            return AuthFlowResponse.builder()
                    .authStatus(authFlowStatus)
                    .message(message)
                    .twoFactorChallenge(toTwoFactorResponse(saved, userAccount, authFlowStatus))
                    .build();
        }

        if (!userAccount.isAuthenticatorConfirmed()) {
            authFlowStatus = AuthFlowStatus.AUTHENTICATOR_SETUP_REQUIRED;
            message = "Set up your authenticator app with the provided key and enter the generated code.";
        }

        TwoFactorChallenge savedChallenge = twoFactorChallengeRepository.save(challenge);

        return AuthFlowResponse.builder()
                .authStatus(authFlowStatus)
                .message(message)
                .twoFactorChallenge(toTwoFactorResponse(savedChallenge, userAccount, authFlowStatus))
                .build();
    }

    private AuthFlowResponse passwordChangeRequiredResponse(UserAccount userAccount) {
        sessionTokenRepository.deleteByUserId(userAccount.getId());
        SessionToken sessionToken = sessionTokenRepository.save(SessionToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .userId(userAccount.getId())
                .phase(SessionPhase.PASSWORD_CHANGE)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(firstLoginSetupHours))
                .build());

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.PASSWORD_CHANGE_REQUIRED)
                .message("You must set a new password using your current password before continuing.")
                .token(sessionToken.getToken())
                .user(toAuthenticatedUserResponse(userAccount))
                .sessionPhase(SessionPhase.PASSWORD_CHANGE.name())
                .build();
    }

    private AuthFlowResponse authenticatedResponse(UserAccount userAccount, String message) {
        sessionTokenRepository.deleteByUserId(userAccount.getId());
        SessionToken sessionToken = sessionTokenRepository.save(SessionToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .userId(userAccount.getId())
                .phase(SessionPhase.FULL)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(sessionHours))
                .build());

        UserAccount fresh = userAccountRepository.findById(userAccount.getId()).orElse(userAccount);
        boolean googlePrompt = shouldOfferOptionalGoogleTwoFactorPrompt(fresh);

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message(message)
                .token(sessionToken.getToken())
                .user(toAuthenticatedUserResponse(fresh, googlePrompt))
                .showGoogleTwoFactorSetupPrompt(googlePrompt ? Boolean.TRUE : null)
                .build();
    }

    private boolean shouldOfferOptionalGoogleTwoFactorPrompt(UserAccount user) {
        if (appProperties.isDeveloperMode()) {
            return false;
        }
        return user.getProvider() == AuthProvider.GOOGLE
                && Boolean.FALSE.equals(user.getTwoFactorEnabled())
                && !user.isGoogleTwoFactorPromptDismissed();
    }

    private AuthFlowResponse pendingResponse(SignupRequest signupRequest, String message) {
        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.PENDING_APPROVAL)
                .message(message)
                .pendingApproval(toPendingApprovalResponse(signupRequest, message))
                .build();
    }

    private AuthenticatedUserResponse toAuthenticatedUserResponse(UserAccount userAccount) {
        return toAuthenticatedUserResponse(userAccount, false);
    }

    private AuthenticatedUserResponse toAuthenticatedUserResponse(UserAccount userAccount, boolean showGoogleTwoFactorSetupPrompt) {
        boolean pendingAuthApp =
                userAccount.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP
                        && !userAccount.isAuthenticatorConfirmed();
        return AuthenticatedUserResponse.builder()
                .id(userAccount.getId())
                .name(userAccount.getFullName())
                .email(userAccount.getEmail())
                .role(userAccount.getRole())
                .status(userAccount.getStatus())
                .provider(userAccount.getProvider())
                .preferredTwoFactorMethod(userAccount.getPreferredTwoFactorMethod())
                .twoFactorEnabled(userAccount.getTwoFactorEnabled())
                .pendingAuthenticatorSetup(pendingAuthApp)
                .mustChangePassword(userAccount.isMustChangePassword())
                .emailNotificationsEnabled(userAccount.isEmailNotificationsEnabled())
                .appNotificationsEnabled(userAccount.isAppNotificationsEnabled())
                .showGoogleTwoFactorSetupPrompt(showGoogleTwoFactorSetupPrompt ? Boolean.TRUE : null)
                .build();
    }

    private PendingApprovalResponse toPendingApprovalResponse(SignupRequest signupRequest, String message) {
        return new PendingApprovalResponse(
                signupRequest.getId(),
                signupRequest.getFullName(),
                signupRequest.getEmail(),
                signupRequest.getAuthProvider() == null ? AuthProvider.LOCAL : signupRequest.getAuthProvider(),
                signupRequest.getStatus(),
                signupRequest.getRequestedRole(),
                signupRequest.getAssignedRole(),
                signupRequest.getReviewerNote(),
                signupRequest.getRejectionReason(),
                signupRequest.getRequestedAt(),
                signupRequest.getReviewedAt(),
                message
        );
    }

    private LocalDateTime computeNextResendAt(TwoFactorChallenge challenge) {
        LocalDateTime last = challenge.getLastOtpSentAt() != null ? challenge.getLastOtpSentAt() : challenge.getCreatedAt();
        if (last == null) {
            return null;
        }
        return last.plusSeconds(otpResendCooldownSeconds);
    }

    /** QR / manual key only while the authenticator is not yet confirmed (first-time enrollment or reset). */
    private boolean showAuthenticatorEnrollmentUi(TwoFactorChallenge challenge, UserAccount userAccount) {
        return challenge.getMethod() == TwoFactorMethod.AUTHENTICATOR_APP && !userAccount.isAuthenticatorConfirmed();
    }

    private TwoFactorChallengeResponse toTwoFactorResponse(
            TwoFactorChallenge challenge,
            UserAccount userAccount,
            AuthFlowStatus authFlowStatus
    ) {
        boolean emailOtp = challenge.getMethod() == TwoFactorMethod.EMAIL_OTP;
        return TwoFactorChallengeResponse.builder()
                .challengeId(challenge.getId())
                .method(challenge.getMethod())
                .expiresAt(challenge.getExpiresAt())
                .nextResendAt(emailOtp ? computeNextResendAt(challenge) : null)
                .resendCooldownSeconds(emailOtp ? (int) otpResendCooldownSeconds : null)
                .message(authFlowStatus == AuthFlowStatus.AUTHENTICATOR_SETUP_REQUIRED
                        ? "Complete your authenticator app setup to finish sign-in."
                        : "Complete your second verification step to finish sign-in.")
                .deliveryHint(challenge.getMethod() == TwoFactorMethod.EMAIL_OTP
                        ? (appProperties.getNotifications().getEmail().isEnabled()
                        ? "The one-time code was sent to your campus email address."
                        : "Email delivery is turned off; use the development-only code below if your administrator enabled it.")
                        : (!userAccount.isAuthenticatorConfirmed()
                        ? "Scan the QR code or add the manual key, then enter the code from your authenticator app."
                        : "Open your authenticator app and enter the current 6-digit code."))
                .manualEntryKey(showAuthenticatorEnrollmentUi(challenge, userAccount)
                        ? userAccount.getAuthenticatorSecret()
                        : null)
                .qrCodeUri(showAuthenticatorEnrollmentUi(challenge, userAccount)
                        ? buildOtpAuthUri(userAccount)
                        : null)
                .debugCode(exposeDevelopmentOtp && challenge.getMethod() == TwoFactorMethod.EMAIL_OTP
                        ? challenge.getOtpCode()
                        : null)
                .build();
    }

    private String getSignupRequestMessage(SignupRequest signupRequest) {
        return switch (signupRequest.getStatus()) {
            case PENDING -> "Your access request is still waiting for administrator review.";
            case APPROVED -> "Your sign up request has been approved. Please sign in using your approved account.";
            case REJECTED -> "Your access request was rejected."
                    + (signupRequest.getRejectionReason() != null && !signupRequest.getRejectionReason().isBlank()
                            ? " Reason: " + signupRequest.getRejectionReason().trim()
                            : " You may submit a new request if appropriate.");
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

    private static String blankToEmDash(String value) {
        if (value == null) {
            return "—";
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "—" : trimmed;
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
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

        if (appProperties.isDeveloperMode()) {
            return authenticatedResponse(userAccount, "Developer mode: second factor is disabled.");
        }

        if (userAccount.isMustChangePassword()) {
            userAccount.setMustChangePassword(false);
            userAccountRepository.save(userAccount);
        }

        if (!userAccount.requiresTwoFactorAtLogin()) {
            return authenticatedResponse(userAccount, "Signed in successfully.");
        }

        return buildTwoFactorChallenge(userAccount, false);
    }
}

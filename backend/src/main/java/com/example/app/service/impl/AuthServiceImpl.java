package com.example.app.service.impl;

import com.example.app.dto.auth.AuthFlowResponse;
import com.example.app.dto.auth.AuthFlowStatus;
import com.example.app.dto.auth.AuthenticatedUserResponse;
import com.example.app.dto.auth.GoogleLoginRequest;
import com.example.app.dto.auth.LoginRequest;
import com.example.app.dto.auth.PendingApprovalResponse;
import com.example.app.dto.auth.RegisterRequest;
import com.example.app.dto.auth.TwoFactorChallengeResponse;
import com.example.app.dto.auth.VerifyTwoFactorRequest;
import com.example.app.entity.SessionToken;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.TwoFactorChallenge;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.exception.ApiException;
import com.example.app.repository.SessionTokenRepository;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.TwoFactorChallengeRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
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
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final SessionTokenRepository sessionTokenRepository;
    private final TwoFactorChallengeRepository twoFactorChallengeRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleAuthenticator googleAuthenticator;

    @Value("${app.auth.session-hours:12}")
    private long sessionHours;

    @Value("${app.auth.challenge-minutes:10}")
    private long challengeMinutes;

    @Value("${app.auth.dev-expose-otp:true}")
    private boolean exposeDevelopmentOtp;

    @Override
    @Transactional
    public AuthFlowResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        AuthProvider authProvider = request.getAuthProvider() == null ? AuthProvider.LOCAL : request.getAuthProvider();

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "An approved account already exists for this email.");
        }

        SignupRequest signupRequest = signupRequestRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> SignupRequest.builder().id(UUID.randomUUID().toString()).build());

        if (signupRequest.getStatus() == SignupRequestStatus.PENDING) {
            return pendingResponse(signupRequest, "A registration request for this email is already pending review.");
        }

        signupRequest.setFullName(request.getFullName().trim());
        signupRequest.setEmail(normalizedEmail);
        signupRequest.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        signupRequest.setCampusId(request.getCampusId().trim());
        signupRequest.setPhoneNumber(request.getPhoneNumber().trim());
        signupRequest.setDepartment(request.getDepartment().trim());
        signupRequest.setReasonForAccess(request.getReasonForAccess().trim());
        signupRequest.setAuthProvider(authProvider);
        signupRequest.setPreferredTwoFactorMethod(request.getPreferredTwoFactorMethod());
        signupRequest.setStatus(SignupRequestStatus.PENDING);
        signupRequest.setAssignedRole(null);
        signupRequest.setReviewerNote(null);
        signupRequest.setReviewedAt(null);

        SignupRequest savedRequest = signupRequestRepository.save(signupRequest);
        return pendingResponse(savedRequest, "Your sign up request has been sent to the campus administrator for approval.");
    }

    @Override
    @Transactional
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
    @Transactional
    public AuthFlowResponse loginWithGoogle(GoogleLoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<UserAccount> userAccountOptional = userAccountRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userAccountOptional.isEmpty()) {
            return resolveSignupRequestState(normalizedEmail, "No approved Google account was found for this email.");
        }

        UserAccount userAccount = userAccountOptional.get();
        ensureActiveUser(userAccount);

        if (userAccount.getProvider() != AuthProvider.GOOGLE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google sign-in is not configured for this account.");
        }

        return authenticatedResponse(userAccount, "Google sign-in completed successfully.");
    }

    @Override
    @Transactional
    public AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
        TwoFactorChallenge challenge = twoFactorChallengeRepository.findById(request.getChallengeId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "2-step verification challenge was not found."));

        if (challenge.isUsed()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This verification challenge has already been used.");
        }

        if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This verification code has expired. Please sign in again.");
        }

        UserAccount userAccount = challenge.getUser();
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
    @Transactional
    public void logout(String bearerToken) {
        String tokenValue = extractBearerToken(bearerToken);
        if (tokenValue != null) {
            sessionTokenRepository.deleteById(tokenValue);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PendingApprovalResponse getSignupRequestStatus(String requestId, String email) {
        SignupRequest signupRequest = signupRequestRepository.findByIdAndEmailIgnoreCase(requestId, normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sign up request was not found."));

        return toPendingApprovalResponse(signupRequest, getSignupRequestMessage(signupRequest));
    }

    @Override
    @Transactional(readOnly = true)
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
        twoFactorChallengeRepository.deleteByUser(userAccount);

        TwoFactorChallenge challenge = TwoFactorChallenge.builder()
                .id(UUID.randomUUID().toString())
                .user(userAccount)
                .method(userAccount.getPreferredTwoFactorMethod())
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
        sessionTokenRepository.deleteByUser(userAccount);
        SessionToken sessionToken = sessionTokenRepository.save(SessionToken.builder()
                .token(UUID.randomUUID() + "-" + UUID.randomUUID())
                .user(userAccount)
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
}

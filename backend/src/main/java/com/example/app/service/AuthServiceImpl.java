package com.example.app.service;

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
import com.example.app.entity.enums.Role;
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
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserAccountRepository userAccountRepository;
    private final SignupRequestRepository signupRequestRepository;
    private final SessionTokenRepository sessionTokenRepository;
    private final TwoFactorChallengeRepository twoFactorChallengeRepository;
    private final GoogleSignupSessionRepository googleSignupSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final GoogleIdentityVerifier googleIdentityVerifier;
    private final GoogleAuthenticator googleAuthenticator;

    @Value("${app.auth.session-hours:12}")
    private long sessionHours;

    @Value("${app.auth.challenge-minutes:10}")
    private long challengeMinutes;

    @Value("${app.auth.dev-expose-otp:true}")
    private boolean exposeOtpForDev;

    @Value("${app.auth.skip-two-factor:false}")
    private boolean skipTwoFactor;

    @Override
    public AuthFlowResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        AuthProvider provider = request.getAuthProvider() == null ? AuthProvider.LOCAL : request.getAuthProvider();

        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email.");
        }

        if (provider == AuthProvider.LOCAL && (request.getPassword() == null || request.getPassword().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password is required for email/password registration.");
        }

        SignupRequest signupRequest = signupRequestRepository.findByEmailIgnoreCase(normalizedEmail).orElseGet(SignupRequest::new);
        signupRequest.setFullName(request.getFullName());
        signupRequest.setEmail(normalizedEmail);
        signupRequest.setCampusId(request.getCampusId());
        signupRequest.setPhoneNumber(request.getPhoneNumber());
        signupRequest.setDepartment(request.getDepartment());
        signupRequest.setReasonForAccess(request.getReasonForAccess());
        signupRequest.setAuthProvider(provider);
        signupRequest.setPreferredTwoFactorMethod(request.getPreferredTwoFactorMethod());
        signupRequest.setStatus(SignupRequestStatus.PENDING);
        signupRequest.setAssignedRole(Role.USER);
        signupRequest.setReviewerNote(null);
        signupRequest.setReviewedAt(null);
        signupRequest.setPasswordHash(
                provider == AuthProvider.LOCAL ? passwordEncoder.encode(request.getPassword()) : null
        );
        signupRequest = signupRequestRepository.save(signupRequest);

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.PENDING_APPROVAL)
                .message("Signup request submitted. Please wait for admin approval.")
                .pendingApproval(toPendingApproval(signupRequest))
                .build();
    }

    @Override
    public AuthFlowResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (user.getProvider() != AuthProvider.LOCAL) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use social sign-in for this account.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return beginLoginFlow(user);
    }

    @Override
    public GoogleSignupSessionResponse prepareGoogleSignup(GoogleCredentialRequest request) {
        VerifiedGoogleAccount verified = googleIdentityVerifier.verify(request.getCredential());
        googleSignupSessionRepository.deleteByProviderAndProviderSubject(AuthProvider.GOOGLE, verified.subject());

        GoogleSignupSession session = GoogleSignupSession.builder()
                .id(UUID.randomUUID().toString())
                .provider(AuthProvider.GOOGLE)
                .providerSubject(verified.subject())
                .email(verified.email())
                .fullName(verified.fullName())
                .pictureUrl(verified.pictureUrl())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(challengeMinutes))
                .build();
        session = googleSignupSessionRepository.save(session);

        return GoogleSignupSessionResponse.builder()
                .signupToken(session.getId())
                .fullName(session.getFullName())
                .email(session.getEmail())
                .pictureUrl(session.getPictureUrl())
                .provider(session.getProvider())
                .build();
    }

    @Override
    public AuthFlowResponse loginWithGoogle(GoogleCredentialRequest request) {
        VerifiedGoogleAccount verified = googleIdentityVerifier.verify(request.getCredential());

        UserAccount user = userAccountRepository
                .findByProviderAndProviderSubject(AuthProvider.GOOGLE, verified.subject())
                .or(() -> userAccountRepository.findByEmailIgnoreCase(verified.email()))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "No Google-linked account found. Submit a signup request first."
                ));

        if (user.getProvider() == AuthProvider.GOOGLE && (user.getProviderSubject() == null || user.getProviderSubject().isBlank())) {
            user.setProviderSubject(verified.subject());
            userAccountRepository.save(user);
        }

        return beginLoginFlow(user);
    }

    @Override
    public AuthFlowResponse loginWithApple(GoogleLoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No Apple-linked account found."));

        if (user.getProvider() != AuthProvider.APPLE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account is not registered with Apple sign-in.");
        }

        return beginLoginFlow(user);
    }

    @Override
    public AuthFlowResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
        TwoFactorChallenge challenge = twoFactorChallengeRepository.findById(request.getChallengeId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Two-factor challenge was not found."));

        if (challenge.isUsed() || challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Two-factor challenge has expired.");
        }

        UserAccount user = userAccountRepository.findById(challenge.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User account was not found."));

        if (challenge.getMethod() == TwoFactorMethod.AUTHENTICATOR_APP) {
            int numericCode;
            try {
                numericCode = Integer.parseInt(request.getCode());
            } catch (NumberFormatException ex) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid verification code.");
            }

            if (user.getAuthenticatorSecret() == null || !googleAuthenticator.authorize(user.getAuthenticatorSecret(), numericCode)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid verification code.");
            }

            if (!user.isAuthenticatorConfirmed()) {
                user.setAuthenticatorConfirmed(true);
                userAccountRepository.save(user);
            }
        } else {
            if (!request.getCode().equals(challenge.getOtpCode())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid verification code.");
            }
        }

        challenge.setUsed(true);
        challenge.setVerifiedAt(LocalDateTime.now());
        twoFactorChallengeRepository.save(challenge);
        twoFactorChallengeRepository.deleteByUserId(user.getId());

        return issueSessionAndAuthenticate(user);
    }

    @Override
    public void logout(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            return;
        }
        String value = bearerToken.startsWith(HttpHeaders.AUTHORIZATION) ? bearerToken : bearerToken;
        if (value.startsWith("Bearer ")) {
            value = value.substring(7).trim();
        }
        if (!value.isBlank()) {
            sessionTokenRepository.deleteById(value);
        }
    }

    @Override
    public PendingApprovalResponse getSignupRequestStatus(String requestId, String email) {
        SignupRequest request = signupRequestRepository.findByIdAndEmailIgnoreCase(requestId, normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Signup request was not found."));
        return toPendingApproval(request);
    }

    @Override
    public AuthFlowResponse getCurrentSession(AuthenticatedUser authenticatedUser) {
        UserAccount user = userAccountRepository.findById(authenticatedUser.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session is no longer valid."));

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message("Active session found.")
                .user(toAuthenticatedUser(user))
                .build();
    }

    private AuthFlowResponse beginLoginFlow(UserAccount user) {
        if (user.getStatus() != AccountStatus.ACTIVE) {
            SignupRequest signupRequest = signupRequestRepository.findByEmailIgnoreCase(user.getEmail()).orElse(null);
            return AuthFlowResponse.builder()
                    .authStatus(AuthFlowStatus.PENDING_APPROVAL)
                    .message("Your account is not active yet.")
                    .pendingApproval(signupRequest == null ? null : toPendingApproval(signupRequest))
                    .build();
        }

        if (skipTwoFactor) {
            return issueSessionAndAuthenticate(user);
        }

        if (user.getPreferredTwoFactorMethod() == TwoFactorMethod.AUTHENTICATOR_APP) {
            if (user.getAuthenticatorSecret() == null || user.getAuthenticatorSecret().isBlank()) {
                GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
                user.setAuthenticatorSecret(key.getKey());
                user.setAuthenticatorConfirmed(false);
                userAccountRepository.save(user);

                return AuthFlowResponse.builder()
                        .authStatus(AuthFlowStatus.AUTHENTICATOR_SETUP_REQUIRED)
                        .message("Set up your authenticator app to continue.")
                        .twoFactorChallenge(TwoFactorChallengeResponse.builder()
                                .method(TwoFactorMethod.AUTHENTICATOR_APP)
                                .manualEntryKey(key.getKey())
                                .qrCodeUri("otpauth://totp/SmartCampus:" + user.getEmail() + "?secret=" + key.getKey() + "&issuer=SmartCampus")
                                .message("Scan the QR in your authenticator app, then verify your code.")
                                .build())
                        .build();
            }
        }

        TwoFactorChallenge challenge = createTwoFactorChallenge(user);
        TwoFactorChallengeResponse challengeResponse = TwoFactorChallengeResponse.builder()
                .challengeId(challenge.getId())
                .method(challenge.getMethod())
                .expiresAt(challenge.getExpiresAt())
                .message("Two-factor verification required.")
                .deliveryHint(challenge.getMethod() == TwoFactorMethod.EMAIL_OTP ? "Use the emailed OTP code." : "Enter your authenticator app code.")
                .debugCode(exposeOtpForDev && challenge.getMethod() == TwoFactorMethod.EMAIL_OTP ? challenge.getOtpCode() : null)
                .build();

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.TWO_FACTOR_REQUIRED)
                .message("Two-factor verification required.")
                .twoFactorChallenge(challengeResponse)
                .build();
    }

    private TwoFactorChallenge createTwoFactorChallenge(UserAccount user) {
        twoFactorChallengeRepository.deleteByUserId(user.getId());

        String otpCode = null;
        if (user.getPreferredTwoFactorMethod() == TwoFactorMethod.EMAIL_OTP) {
            otpCode = String.format("%06d", (int) (Math.random() * 1_000_000));
        }

        TwoFactorChallenge challenge = TwoFactorChallenge.builder()
                .id(UUID.randomUUID().toString())
                .userId(user.getId())
                .method(user.getPreferredTwoFactorMethod())
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(challengeMinutes))
                .used(false)
                .build();

        return twoFactorChallengeRepository.save(challenge);
    }

    private AuthFlowResponse issueSessionAndAuthenticate(UserAccount user) {
        sessionTokenRepository.deleteByUserId(user.getId());
        String tokenValue = UUID.randomUUID().toString();
        sessionTokenRepository.save(SessionToken.builder()
                .token(tokenValue)
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusHours(sessionHours))
                .build());

        return AuthFlowResponse.builder()
                .authStatus(AuthFlowStatus.AUTHENTICATED)
                .message("Login successful.")
                .token(tokenValue)
                .user(toAuthenticatedUser(user))
                .build();
    }

    private PendingApprovalResponse toPendingApproval(SignupRequest request) {
        return PendingApprovalResponse.builder()
                .requestId(request.getId())
                .applicantName(request.getFullName())
                .email(request.getEmail())
                .provider(request.getAuthProvider())
                .status(request.getStatus())
                .assignedRole(request.getAssignedRole())
                .reviewerNote(request.getReviewerNote())
                .requestedAt(request.getRequestedAt())
                .reviewedAt(request.getReviewedAt())
                .message(request.getStatus() == SignupRequestStatus.REJECTED
                        ? "Signup request was rejected."
                        : "Signup request is under review.")
                .build();
    }

    private AuthenticatedUserResponse toAuthenticatedUser(UserAccount user) {
        return AuthenticatedUserResponse.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .provider(user.getProvider())
                .preferredTwoFactorMethod(user.getPreferredTwoFactorMethod())
                .build();
    }

    private String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
}

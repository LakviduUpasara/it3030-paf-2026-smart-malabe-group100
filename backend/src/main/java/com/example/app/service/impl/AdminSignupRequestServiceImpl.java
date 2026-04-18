package com.example.app.service.impl;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.exception.ApiException;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.AdminSignupRequestService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminSignupRequestServiceImpl implements AdminSignupRequestService {

    private final SignupRequestRepository signupRequestRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public List<SignupRequestSummaryResponse> getPendingRequests() {
        return signupRequestRepository.findByStatusOrderByRequestedAtAsc(SignupRequestStatus.PENDING).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    public SignupRequestSummaryResponse approveRequest(
            String requestId, SignupRequestDecisionRequest request, AuthenticatedUser reviewer) {
        SignupRequest signupRequest = getPendingRequest(requestId);

        if (reviewer != null && reviewer.getRole() == Role.MANAGER) {
            Role assigned = request.getAssignedRole();
            if (assigned == Role.ADMIN || assigned == Role.LOST_ITEM_ADMIN || assigned == Role.MANAGER) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "Only a platform administrator can assign administrator or manager roles.");
            }
        }

        if (userAccountRepository.existsByEmailIgnoreCase(signupRequest.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email.");
        }

        String username = allocateUsernameForEmail(signupRequest.getEmail());
        // Applicant’s preferred 2FA from the pending request; OTP / authenticator enrollment runs at first sign-in only.
        UserAccount userAccount = UserAccount.builder()
                .fullName(signupRequest.getFullName())
                .email(signupRequest.getEmail())
                .username(username)
                .providerSubject(signupRequest.getProviderSubject())
                .passwordHash(signupRequest.getAuthProvider() == AuthProvider.LOCAL ? signupRequest.getPasswordHash() : null)
                .role(request.getAssignedRole())
                .status(AccountStatus.ACTIVE)
                .provider(signupRequest.getAuthProvider() == null ? AuthProvider.LOCAL : signupRequest.getAuthProvider())
                .preferredTwoFactorMethod(signupRequest.getPreferredTwoFactorMethod())
                .authenticatorConfirmed(false)
                .mustChangePassword(signupRequest.getAuthProvider() == AuthProvider.LOCAL)
                .build();
        userAccountRepository.save(userAccount);

        signupRequest.setStatus(SignupRequestStatus.APPROVED);
        signupRequest.setAssignedRole(request.getAssignedRole());
        signupRequest.setReviewerNote(trimNullable(request.getReviewerNote()));
        signupRequest.setRejectionReason(null);
        signupRequest.setReviewedBy(reviewerEmail(reviewer));
        signupRequest.setReviewedAt(LocalDateTime.now());

        return toSummaryResponse(signupRequestRepository.save(signupRequest));
    }

    @Override
    public SignupRequestSummaryResponse rejectRequest(
            String requestId, SignupRequestRejectRequest request, AuthenticatedUser reviewer) {
        SignupRequest signupRequest = getPendingRequest(requestId);
        signupRequest.setStatus(SignupRequestStatus.REJECTED);
        signupRequest.setReviewerNote(trimNullable(request.getReviewerNote()));
        signupRequest.setRejectionReason(trimNullable(request.getRejectionReason()));
        signupRequest.setReviewedBy(reviewerEmail(reviewer));
        signupRequest.setReviewedAt(LocalDateTime.now());
        // No UserAccount is created on rejection.

        return toSummaryResponse(signupRequestRepository.save(signupRequest));
    }

    private static String reviewerEmail(AuthenticatedUser reviewer) {
        return reviewer == null || reviewer.getEmail() == null ? null : reviewer.getEmail().trim();
    }

    private SignupRequest getPendingRequest(String requestId) {
        SignupRequest signupRequest = signupRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sign up request was not found."));

        if (signupRequest.getStatus() != SignupRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only pending requests can be reviewed.");
        }

        return signupRequest;
    }

    private SignupRequestSummaryResponse toSummaryResponse(SignupRequest signupRequest) {
        return SignupRequestSummaryResponse.builder()
                .id(signupRequest.getId())
                .fullName(signupRequest.getFullName())
                .email(signupRequest.getEmail())
                .authProvider(signupRequest.getAuthProvider() == null ? AuthProvider.LOCAL : signupRequest.getAuthProvider())
                .campusId(signupRequest.getCampusId())
                .phoneNumber(signupRequest.getPhoneNumber())
                .department(signupRequest.getDepartment())
                .supplementaryProfile(signupRequest.getSupplementaryProfile())
                .applicationProfileJson(signupRequest.getApplicationProfileJson())
                .reasonForAccess(signupRequest.getReasonForAccess())
                .preferredTwoFactorMethod(signupRequest.getPreferredTwoFactorMethod())
                .status(signupRequest.getStatus())
                .requestedRole(signupRequest.getRequestedRole())
                .assignedRole(signupRequest.getAssignedRole())
                .reviewerNote(signupRequest.getReviewerNote())
                .rejectionReason(signupRequest.getRejectionReason())
                .reviewedBy(signupRequest.getReviewedBy())
                .requestedAt(signupRequest.getRequestedAt())
                .reviewedAt(signupRequest.getReviewedAt())
                .build();
    }

    private String allocateUsernameForEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "user-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String local = email.substring(0, email.indexOf('@')).toLowerCase(Locale.ROOT);
        local = local.replaceAll("[^a-z0-9._-]", "");
        if (local.isEmpty()) {
            local = "user";
        }
        String candidate = local;
        for (int i = 0; i < 20; i++) {
            if (!userAccountRepository.existsByUsernameIgnoreCase(candidate)) {
                return candidate;
            }
            candidate = local + (i + 1);
        }
        return local + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String trimNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

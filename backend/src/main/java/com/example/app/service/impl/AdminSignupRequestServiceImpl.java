package com.example.app.service.impl;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.exception.ApiException;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.service.AdminSignupRequestService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSignupRequestServiceImpl implements AdminSignupRequestService {

    private final SignupRequestRepository signupRequestRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SignupRequestSummaryResponse> getPendingRequests() {
        return signupRequestRepository.findByStatusOrderByRequestedAtAsc(SignupRequestStatus.PENDING).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional
    public SignupRequestSummaryResponse approveRequest(String requestId, SignupRequestDecisionRequest request) {
        SignupRequest signupRequest = getPendingRequest(requestId);

        if (userAccountRepository.existsByEmailIgnoreCase(signupRequest.getEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists for this email.");
        }

        UserAccount userAccount = UserAccount.builder()
                .fullName(signupRequest.getFullName())
                .email(signupRequest.getEmail())
                .passwordHash(signupRequest.getPasswordHash())
                .role(request.getAssignedRole())
                .status(AccountStatus.ACTIVE)
                .provider(signupRequest.getAuthProvider() == null ? AuthProvider.LOCAL : signupRequest.getAuthProvider())
                .preferredTwoFactorMethod(signupRequest.getPreferredTwoFactorMethod())
                .authenticatorConfirmed(false)
                .build();
        userAccountRepository.save(userAccount);

        signupRequest.setStatus(SignupRequestStatus.APPROVED);
        signupRequest.setAssignedRole(request.getAssignedRole());
        signupRequest.setReviewerNote(trimNullable(request.getReviewerNote()));
        signupRequest.setReviewedAt(LocalDateTime.now());

        return toSummaryResponse(signupRequestRepository.save(signupRequest));
    }

    @Override
    @Transactional
    public SignupRequestSummaryResponse rejectRequest(String requestId, SignupRequestRejectRequest request) {
        SignupRequest signupRequest = getPendingRequest(requestId);
        signupRequest.setStatus(SignupRequestStatus.REJECTED);
        signupRequest.setReviewerNote(trimNullable(request.getReviewerNote()));
        signupRequest.setReviewedAt(LocalDateTime.now());

        return toSummaryResponse(signupRequestRepository.save(signupRequest));
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
                .campusId(signupRequest.getCampusId())
                .phoneNumber(signupRequest.getPhoneNumber())
                .department(signupRequest.getDepartment())
                .reasonForAccess(signupRequest.getReasonForAccess())
                .preferredTwoFactorMethod(signupRequest.getPreferredTwoFactorMethod())
                .status(signupRequest.getStatus())
                .assignedRole(signupRequest.getAssignedRole())
                .reviewerNote(signupRequest.getReviewerNote())
                .requestedAt(signupRequest.getRequestedAt())
                .reviewedAt(signupRequest.getReviewedAt())
                .build();
    }

    private String trimNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}

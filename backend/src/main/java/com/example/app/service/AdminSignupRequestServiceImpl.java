package com.example.app.service;

import com.example.app.dto.admin.SignupRequestDecisionRequest;
import com.example.app.dto.admin.SignupRequestRejectRequest;
import com.example.app.dto.admin.SignupRequestSummaryResponse;
import com.example.app.entity.SignupRequest;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.exception.ApiException;
import com.example.app.repository.SignupRequestRepository;
import com.example.app.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.List;
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
                .map(this::toSummary)
                .toList();
    }

    @Override
    public SignupRequestSummaryResponse approveRequest(String requestId, SignupRequestDecisionRequest request) {
        SignupRequest signupRequest = signupRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Signup request was not found."));

        if (signupRequest.getStatus() != SignupRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending signup requests can be approved.");
        }

        Role assignedRole = request.getAssignedRole() == null ? Role.USER : request.getAssignedRole();

        UserAccount userAccount = userAccountRepository.findByEmailIgnoreCase(signupRequest.getEmail())
                .orElseGet(UserAccount::new);

        userAccount.setFullName(signupRequest.getFullName());
        userAccount.setEmail(signupRequest.getEmail());
        userAccount.setProvider(signupRequest.getAuthProvider());
        userAccount.setProviderSubject(signupRequest.getProviderSubject());
        userAccount.setPasswordHash(signupRequest.getPasswordHash());
        userAccount.setRole(assignedRole);
        userAccount.setPreferredTwoFactorMethod(signupRequest.getPreferredTwoFactorMethod());
        userAccount.setStatus(AccountStatus.ACTIVE);
        userAccountRepository.save(userAccount);

        signupRequest.setAssignedRole(assignedRole);
        signupRequest.setReviewerNote(request.getReviewerNote());
        signupRequest.setStatus(SignupRequestStatus.APPROVED);
        signupRequest.setReviewedAt(LocalDateTime.now());
        return toSummary(signupRequestRepository.save(signupRequest));
    }

    @Override
    public SignupRequestSummaryResponse rejectRequest(String requestId, SignupRequestRejectRequest request) {
        SignupRequest signupRequest = signupRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Signup request was not found."));

        if (signupRequest.getStatus() != SignupRequestStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending signup requests can be rejected.");
        }

        signupRequest.setStatus(SignupRequestStatus.REJECTED);
        signupRequest.setReviewerNote(request.getReviewerNote());
        signupRequest.setReviewedAt(LocalDateTime.now());
        return toSummary(signupRequestRepository.save(signupRequest));
    }

    private SignupRequestSummaryResponse toSummary(SignupRequest request) {
        return SignupRequestSummaryResponse.builder()
                .id(request.getId())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .authProvider(request.getAuthProvider())
                .campusId(request.getCampusId())
                .phoneNumber(request.getPhoneNumber())
                .department(request.getDepartment())
                .reasonForAccess(request.getReasonForAccess())
                .preferredTwoFactorMethod(request.getPreferredTwoFactorMethod())
                .status(request.getStatus())
                .assignedRole(request.getAssignedRole())
                .reviewerNote(request.getReviewerNote())
                .requestedAt(request.getRequestedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }
}

package com.example.app.dto;

import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SignupRequestSummaryDto {

    private Long requestId;
    private Long userId;
    private String fullName;
    private String email;
    private String campusId;
    private String phoneNumber;
    private String faculty;
    private String department;
    private Role requestedRole;
    private Role assignedRole;
    private SignupRequestStatus status;
    private TwoFactorMethod preferredTwoFactorMethod;
    private String additionalNote;
    private String reviewNote;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}

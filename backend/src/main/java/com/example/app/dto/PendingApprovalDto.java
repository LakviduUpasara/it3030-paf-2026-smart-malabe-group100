package com.example.app.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PendingApprovalDto {

    private Long requestId;
    private String fullName;
    private String email;
    private String campusId;
    private String phoneNumber;
    private String faculty;
    private String department;
    private Role requestedRole;
    private Role assignedRole;
    private SignupRequestStatus requestStatus;
    private AccountStatus accountStatus;
    private TwoFactorMethod twoFactorMethod;
    private String additionalNote;
    private String reviewNote;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
}

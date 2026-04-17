package com.example.app.dto.admin;

import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import com.example.app.entity.enums.AuthProvider;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequestSummaryResponse {

    private String id;
    private String fullName;
    private String email;
    private AuthProvider authProvider;
    private String campusId;
    private String phoneNumber;
    private String department;
    private String supplementaryProfile;
    private String applicationProfileJson;
    private String reasonForAccess;
    private TwoFactorMethod preferredTwoFactorMethod;
    private SignupRequestStatus status;
    private Role requestedRole;
    private Role assignedRole;
    private String reviewerNote;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
}

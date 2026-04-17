package com.example.app.entity;

import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "signup_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String providerSubject;

    private String passwordHash;

    private String campusId;

    private String phoneNumber;

    private String department;

    /** Extra applicant notes aligned with requested campus role (faculties, workshop, programme, etc.). */
    private String supplementaryProfile;

    private String reasonForAccess;

    /** JSON snapshot of the applicant’s registration form (aligned with admin console fields). */
    private String applicationProfileJson;

    private AuthProvider authProvider;

    private TwoFactorMethod preferredTwoFactorMethod;

    private SignupRequestStatus status;

    /** Role the applicant asks for when registering (reviewer may assign a different role on approval). */
    private Role requestedRole;

    private Role assignedRole;

    /** Internal reviewer note (approve or reject). */
    private String reviewerNote;

    /** Applicant-facing rejection explanation; set only when status is REJECTED. */
    private String rejectionReason;

    /** Email of the admin/manager who last approved or rejected (audit). */
    private String reviewedBy;

    @CreatedDate
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

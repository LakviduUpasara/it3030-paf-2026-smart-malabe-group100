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

    private String reasonForAccess;

    private AuthProvider authProvider;

    private TwoFactorMethod preferredTwoFactorMethod;

    private SignupRequestStatus status;

    private Role assignedRole;

    private String reviewerNote;

    @CreatedDate
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

package com.example.app.entity;

import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.SignupRequestStatus;
import com.example.app.entity.enums.TwoFactorMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "signup_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @Id
    private String id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String campusId;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false, length = 1000)
    private String reasonForAccess;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TwoFactorMethod preferredTwoFactorMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignupRequestStatus status;

    @Enumerated(EnumType.STRING)
    @Column
    private Role assignedRole;

    @Column(length = 1000)
    private String reviewerNote;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    @Column
    private LocalDateTime reviewedAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        requestedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

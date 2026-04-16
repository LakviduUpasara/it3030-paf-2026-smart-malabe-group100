package com.example.app.entity;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
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

@Document(collection = "user_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount {

    @Id
    private String id;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    /** Login handle for staff/students when distinct from email (e.g. student id). */
    @Indexed(unique = true, sparse = true)
    private String username;

    @Indexed(unique = true, sparse = true)
    private String providerSubject;

    @Builder.Default
    private boolean mustChangePassword = false;

    @Indexed(sparse = true)
    private String lecturerRef;

    @Indexed(sparse = true)
    private String labAssistantRef;

    @Indexed(sparse = true)
    private String studentRef;

    private String passwordHash;

    private Role role;

    private AccountStatus status;

    private AuthProvider provider;

    private TwoFactorMethod preferredTwoFactorMethod;

    private String authenticatorSecret;

    private boolean authenticatorConfirmed;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

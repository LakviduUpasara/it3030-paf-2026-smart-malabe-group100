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

    /**
     * When {@code null}, legacy accounts keep the previous behavior (2FA required at sign-in when not in dev mode).
     * When {@code false}, sign-in does not require a second factor. When {@code true}, second factor follows
     * {@link #preferredTwoFactorMethod} and authenticator confirmation state.
     */
    private Boolean twoFactorEnabled;

    private TwoFactorMethod preferredTwoFactorMethod;

    private String authenticatorSecret;

    private boolean authenticatorConfirmed;

    /** Google-only: first-login optional 2FA offer was dismissed (skip or completed from prompt). */
    @Builder.Default
    private boolean googleTwoFactorPromptDismissed = false;

    /** Local (and other) users: optional first-login 2FA wizard was skipped; avoids re-prompting. */
    @Builder.Default
    private boolean firstLoginTwoFactorSetupSkipped = false;

    @Builder.Default
    private boolean emailNotificationsEnabled = true;

    @Builder.Default
    private boolean appNotificationsEnabled = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    /**
     * Per-user 2FA requirement at sign-in (before global platform overrides).
     *
     * @param treatLegacyNullAsOptional when {@code true}, {@code twoFactorEnabled == null} means optional (off).
     */
    public boolean requiresTwoFactorAtLogin(boolean treatLegacyNullAsOptional) {
        if (twoFactorEnabled == null) {
            return !treatLegacyNullAsOptional;
        }
        return Boolean.TRUE.equals(twoFactorEnabled);
    }

    /** True when 2FA is on and the chosen method is ready to use at sign-in (TOTP confirmed or email OTP). */
    public boolean isTwoFactorFullyConfigured(boolean treatLegacyNullAsOptional) {
        if (!requiresTwoFactorAtLogin(treatLegacyNullAsOptional)) {
            return true;
        }
        TwoFactorMethod m = preferredTwoFactorMethod;
        if (m == null || m == TwoFactorMethod.EMAIL_OTP) {
            return true;
        }
        return authenticatorSecret != null && !authenticatorSecret.isBlank() && authenticatorConfirmed;
    }
}

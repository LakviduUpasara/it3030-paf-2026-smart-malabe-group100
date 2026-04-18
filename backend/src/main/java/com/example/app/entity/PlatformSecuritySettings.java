package com.example.app.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Singleton platform security policy (MongoDB). Id is always {@link #SINGLETON_ID}.
 */
@Document(collection = "platform_security_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSecuritySettings {

    public static final String SINGLETON_ID = "default";

    @Id
    @Builder.Default
    private String id = SINGLETON_ID;

    /**
     * When true, every sign-in requires a second factor (email OTP or TOTP), regardless of per-user {@code twoFactorEnabled}.
     */
    @Builder.Default
    private boolean forceTwoFactorForAllUsers = false;

    /**
     * When true, {@code UserAccount.twoFactorEnabled == null} is treated as optional (no 2FA at login).
     * When false, null retains legacy meaning (2FA required at login when not in dev mode).
     */
    @Builder.Default
    private boolean treatLegacyUnknownTwoFactorAsOptional = true;

    /**
     * Applied when creating local (email/password) accounts: user must change password on first sign-in.
     */
    @Builder.Default
    private boolean requirePasswordChangeOnFirstLoginForLocalUsers = true;

    /**
     * New accounts start with 2FA enabled and must complete enrollment (still optional to skip only if {@link #allowSkippingFirstLoginTwoFactorSetup}).
     */
    @Builder.Default
    private boolean newUsersMustEnableTwoFactor = false;

    /**
     * When false, first-login 2FA method step cannot be skipped (enforced server-side).
     */
    @Builder.Default
    private boolean allowSkippingFirstLoginTwoFactorSetup = true;

    private LocalDateTime updatedAt;

    private String lastUpdatedByEmail;
}

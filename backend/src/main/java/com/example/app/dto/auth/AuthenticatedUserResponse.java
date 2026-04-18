package com.example.app.dto.auth;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticatedUserResponse {

    private String id;
    private String name;
    private String email;
    private Role role;
    private AccountStatus status;
    private AuthProvider provider;
    private TwoFactorMethod preferredTwoFactorMethod;

    /** True when the user chose the authenticator app but has not confirmed it yet (sign-in falls back to email OTP). */
    private Boolean pendingAuthenticatorSetup;

    private Boolean mustChangePassword;

    /** Mirrors {@code UserAccount.twoFactorEnabled}; null means legacy account (2FA expected at sign-in). */
    private Boolean twoFactorEnabled;

    /** True when the user chose the authenticator app but has not confirmed it yet (sign-in falls back to email OTP). */
    private Boolean pendingAuthenticatorSetup;

    private Boolean mustChangePassword;

    private Boolean emailNotificationsEnabled;

    private Boolean appNotificationsEnabled;

    /** True when optional first Google sign-in 2FA prompt should be shown (client-only hint). */
    private Boolean showGoogleTwoFactorSetupPrompt;
}

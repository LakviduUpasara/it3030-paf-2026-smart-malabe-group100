package com.example.app.dto.account;

import com.example.app.entity.enums.TwoFactorMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecuritySettingsResponse {

    private Boolean twoFactorEnabled;
    private TwoFactorMethod preferredTwoFactorMethod;
    private boolean authenticatorConfigured;
    private boolean pendingAuthenticatorEnrollment;
    private boolean emailNotificationsEnabled;
    private boolean appNotificationsEnabled;
    private boolean googleTwoFactorPromptDismissed;

    /** Present when authenticator is pending (same as enrollment start) so the client can render QR after refresh. */
    private String qrCodeUri;

    private String manualEntryKey;
}

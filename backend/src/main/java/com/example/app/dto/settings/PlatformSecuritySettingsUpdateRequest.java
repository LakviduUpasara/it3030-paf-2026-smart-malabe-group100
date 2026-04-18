package com.example.app.dto.settings;

import lombok.Data;

@Data
public class PlatformSecuritySettingsUpdateRequest {

    private Boolean forceTwoFactorForAllUsers;
    private Boolean treatLegacyUnknownTwoFactorAsOptional;
    private Boolean requirePasswordChangeOnFirstLoginForLocalUsers;
    private Boolean newUsersMustEnableTwoFactor;
    private Boolean allowSkippingFirstLoginTwoFactorSetup;
}

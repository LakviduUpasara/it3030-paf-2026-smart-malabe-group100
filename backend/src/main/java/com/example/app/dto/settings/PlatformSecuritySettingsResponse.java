package com.example.app.dto.settings;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSecuritySettingsResponse {

    private boolean forceTwoFactorForAllUsers;
    private boolean treatLegacyUnknownTwoFactorAsOptional;
    private boolean requirePasswordChangeOnFirstLoginForLocalUsers;
    private boolean newUsersMustEnableTwoFactor;
    private boolean allowSkippingFirstLoginTwoFactorSetup;
    private LocalDateTime updatedAt;
    private String lastUpdatedByEmail;
}

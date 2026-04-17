package com.example.app.dto.account;

import com.example.app.entity.enums.TwoFactorMethod;
import lombok.Data;

@Data
public class SecuritySettingsUpdateRequest {

    private Boolean twoFactorEnabled;
    private TwoFactorMethod preferredTwoFactorMethod;
    private Boolean emailNotificationsEnabled;
    private Boolean appNotificationsEnabled;
}

package com.example.app.dto.auth;

import com.example.app.entity.enums.TwoFactorMethod;
import lombok.Data;

@Data
public class SelectFirstLoginTwoFactorRequest {

    /** When true, 2-step verification stays disabled for this account. */
    private Boolean skipTwoFactor;

    private TwoFactorMethod method;
}

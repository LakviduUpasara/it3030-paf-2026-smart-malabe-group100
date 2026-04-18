package com.example.app.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Public, non-sensitive hints for the sign-in / first-login UI (no auth required). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSecurityHintsResponse {

    private boolean allowSkippingFirstLoginTwoFactorSetup;
}

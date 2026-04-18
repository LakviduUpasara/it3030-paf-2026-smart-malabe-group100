package com.example.app.dto.account;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticatorEnrollmentResponse {

    private String qrCodeUri;
    private String manualEntryKey;
}

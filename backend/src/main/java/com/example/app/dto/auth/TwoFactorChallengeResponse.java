package com.example.app.dto.auth;

import com.example.app.entity.enums.TwoFactorMethod;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorChallengeResponse {

    private String challengeId;
    private TwoFactorMethod method;
    private LocalDateTime expiresAt;
    private String message;
    private String deliveryHint;
    private String manualEntryKey;
    private String qrCodeUri;
    private String debugCode;
}

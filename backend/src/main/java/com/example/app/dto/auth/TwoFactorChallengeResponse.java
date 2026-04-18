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
    /** Earliest time the client may call resend (email OTP only). Null when resend is allowed immediately. */
    private LocalDateTime nextResendAt;
    /** Server cooldown between sends; mirrors app.auth.otp-resend-cooldown-seconds. */
    private Integer resendCooldownSeconds;
    private String message;
    private String deliveryHint;
    private String manualEntryKey;
    private String qrCodeUri;
    private String debugCode;
}

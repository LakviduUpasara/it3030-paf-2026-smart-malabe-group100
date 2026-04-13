package com.example.app.dto;

import com.example.app.entity.enums.TwoFactorMethod;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TwoFactorChallengeDto {

    private String challengeId;
    private TwoFactorMethod method;
    private String deliveryHint;
    private String otpAuthUrl;
    private String sharedSecret;
    private String developmentCode;
    private LocalDateTime expiresAt;
}

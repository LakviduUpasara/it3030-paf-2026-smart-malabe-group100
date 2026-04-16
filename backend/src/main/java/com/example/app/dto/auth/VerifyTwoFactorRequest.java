package com.example.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyTwoFactorRequest {

    @NotBlank(message = "Challenge ID is required.")
    private String challengeId;

    @NotBlank(message = "Verification code is required.")
    private String code;
}

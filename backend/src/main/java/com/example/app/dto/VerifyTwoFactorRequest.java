package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VerifyTwoFactorRequest {

    @NotBlank
    private String challengeId;

    @NotBlank
    private String code;
}

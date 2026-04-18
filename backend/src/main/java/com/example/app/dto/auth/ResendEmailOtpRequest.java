package com.example.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendEmailOtpRequest {

    @NotBlank(message = "Challenge id is required.")
    private String challengeId;
}

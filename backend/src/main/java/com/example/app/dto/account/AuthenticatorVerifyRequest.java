package com.example.app.dto.account;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthenticatorVerifyRequest {

    @NotBlank(message = "Enter the 6-digit code from your authenticator app.")
    private String code;
}

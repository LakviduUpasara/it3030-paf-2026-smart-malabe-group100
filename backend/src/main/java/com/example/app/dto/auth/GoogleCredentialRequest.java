package com.example.app.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleCredentialRequest {

    @NotBlank(message = "Google credential is required.")
    private String credential;
}

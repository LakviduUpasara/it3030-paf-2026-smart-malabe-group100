package com.example.app.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DevLoginRequest {

    @Email(message = "Enter a valid email address.")
    @NotBlank(message = "Email is required.")
    private String email;
}

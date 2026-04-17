package com.example.app.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTechnicianRequest {

    @NotBlank(message = "Full name is required.")
    @Size(max = 200, message = "Full name is too long.")
    private String fullName;

    @NotBlank(message = "Email is required.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 320, message = "Email is too long.")
    private String email;

    /** When non-blank, replaces the existing password. */
    @Size(max = 128, message = "Password is too long.")
    private String password;
}

package com.example.app.dto.auth;

import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.TwoFactorMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required.")
    private String fullName;

    @Email(message = "Enter a valid email address.")
    @NotBlank(message = "Email is required.")
    private String email;

    @Size(max = 100, message = "Password must be 100 characters or fewer.")
    private String password;

    @NotBlank(message = "Campus ID is required.")
    private String campusId;

    @NotBlank(message = "Phone number is required.")
    private String phoneNumber;

    @NotBlank(message = "Department is required.")
    private String department;

    @NotBlank(message = "Reason for access is required.")
    @Size(max = 1000, message = "Reason for access is too long.")
    private String reasonForAccess;

    private AuthProvider authProvider;

    private String socialSignupToken;

    @NotNull(message = "Select a preferred 2-step verification method.")
    private TwoFactorMethod preferredTwoFactorMethod;
}

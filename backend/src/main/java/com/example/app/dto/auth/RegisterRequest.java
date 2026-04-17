package com.example.app.dto.auth;

import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
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

    /** Optional; shown to reviewers when the applicant adds faculty/area context. */
    @Size(max = 2000, message = "Profile notes are too long.")
    private String department;

    /** Optional role-specific details (faculty scope, workshop, programme, etc.). */
    @Size(max = 2000, message = "Additional profile notes are too long.")
    private String supplementaryProfile;

    @NotBlank(message = "Reason for access is required.")
    @Size(max = 1000, message = "Reason for access is too long.")
    private String reasonForAccess;

    /** Campus role the applicant is requesting (platform-only roles cannot be self-requested). */
    private Role requestedRole;

    private AuthProvider authProvider;

    private String socialSignupToken;

    /** Optional in JSON; {@link com.example.app.config.RegisterRequestBodyAdvice} defaults before validation. */
    private TwoFactorMethod preferredTwoFactorMethod;

    /** Full registration draft (student/staff/console shapes) for reviewer tooling. */
    @Size(max = 65535, message = "Application profile payload is too large.")
    private String applicationProfileJson;
}

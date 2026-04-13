package com.example.app.dto;

import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    private String fullName;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String campusId;

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String faculty;

    @NotBlank
    private String department;

    @NotNull
    private Role requestedRole;

    @NotNull
    private TwoFactorMethod twoFactorMethod;

    private String additionalNote;
}

package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminCreateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;
    @NotBlank(message = "Username is required")
    private String username;
    @NotBlank(message = "Email is required")
    private String email;
    private String password;
    private Role role;
    private AccountStatus status;
}

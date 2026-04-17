package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import lombok.Data;

@Data
public class AdminUpdateRequest {

    private String fullName;
    private String username;
    private String email;
    /** If null or blank, password is left unchanged. */
    private String password;
    private Role role;
    private AccountStatus status;
}

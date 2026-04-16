package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import lombok.Data;

@Data
public class AdminCreateRequest {

    private String fullName;
    private String username;
    private String email;
    private String password;
    private Role role;
    private AccountStatus status;
}

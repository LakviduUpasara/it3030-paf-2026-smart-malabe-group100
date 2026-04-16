package com.example.app.registration.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.Role;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminUserResponse {
    String id;
    String fullName;
    String username;
    String email;
    Role role;
    AccountStatus status;
}

package com.example.app.dto;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthenticatedUserDto {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private AccountStatus status;
    private AuthProvider authProvider;
    private TwoFactorMethod twoFactorMethod;
}

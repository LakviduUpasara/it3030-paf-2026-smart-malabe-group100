package com.example.app.dto.auth;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.AuthProvider;
import com.example.app.entity.enums.Role;
import com.example.app.entity.enums.TwoFactorMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticatedUserResponse {

    private String id;
    private String name;
    private String email;
    private Role role;
    private AccountStatus status;
    private AuthProvider provider;
    private TwoFactorMethod preferredTwoFactorMethod;
}

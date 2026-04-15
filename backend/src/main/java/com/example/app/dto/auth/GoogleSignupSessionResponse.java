package com.example.app.dto.auth;

import com.example.app.entity.enums.AuthProvider;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GoogleSignupSessionResponse {

    private String signupToken;
    private String fullName;
    private String email;
    private String pictureUrl;
    private AuthProvider provider;
}

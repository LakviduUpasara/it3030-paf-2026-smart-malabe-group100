package com.example.app.dto.auth;

import com.example.app.entity.enums.AuthProvider;
import java.time.LocalDateTime;
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
    /** Server-side expiry for the one-time Google sign-up session (client may drop stale drafts). */
    private LocalDateTime expiresAt;
}

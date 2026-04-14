package com.example.app.entity;

import com.example.app.entity.enums.AuthProvider;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "google_signup_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleSignupSession {

    @Id
    private String id;

    private AuthProvider provider;

    private String providerSubject;

    private String email;

    private String fullName;

    private String pictureUrl;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;
}

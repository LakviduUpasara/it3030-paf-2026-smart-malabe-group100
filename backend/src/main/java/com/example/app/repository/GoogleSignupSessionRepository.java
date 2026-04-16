package com.example.app.repository;

import com.example.app.entity.GoogleSignupSession;
import com.example.app.entity.enums.AuthProvider;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface GoogleSignupSessionRepository extends MongoRepository<GoogleSignupSession, String> {

    Optional<GoogleSignupSession> findByIdAndProvider(String id, AuthProvider provider);

    void deleteByProviderAndProviderSubject(AuthProvider provider, String providerSubject);

    void deleteByExpiresAtBefore(LocalDateTime expiresAt);
}

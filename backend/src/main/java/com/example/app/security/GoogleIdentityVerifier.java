package com.example.app.security;

import com.example.app.exception.ApiException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class GoogleIdentityVerifier {

    private static final NetHttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final GsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    private final List<String> allowedClientIds;

    public GoogleIdentityVerifier(@Value("${app.auth.google.client-ids:}") String googleClientIds) {
        this.allowedClientIds = Arrays.stream(googleClientIds.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    public VerifiedGoogleAccount verify(String credential) {
        if (allowedClientIds.isEmpty()) {
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Google sign-in is not configured. Set GOOGLE_CLIENT_IDS on the backend."
            );
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(HTTP_TRANSPORT, JSON_FACTORY)
                    .setAudience(allowedClientIds)
                    .build();
            GoogleIdToken googleIdToken = verifier.verify(credential);

            if (googleIdToken == null) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google account verification failed.");
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            Object emailVerified = payload.getEmailVerified();
            boolean isEmailVerified = Boolean.TRUE.equals(emailVerified)
                    || "true".equals(String.valueOf(emailVerified));

            if (!isEmailVerified) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "The selected Google account email is not verified.");
            }

            String email = payload.getEmail();
            String subject = payload.getSubject();
            String fullName = String.valueOf(payload.get("name"));
            String pictureUrl = payload.get("picture") == null ? null : String.valueOf(payload.get("picture"));

            if (email == null || email.isBlank() || subject == null || subject.isBlank()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google did not return a usable identity.");
            }

            return new VerifiedGoogleAccount(subject, email.trim().toLowerCase(), fullName, pictureUrl);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google account verification failed.");
        }
    }
}

package com.example.app.security;

public record VerifiedGoogleAccount(
        String subject,
        String email,
        String fullName,
        String pictureUrl
) {
}

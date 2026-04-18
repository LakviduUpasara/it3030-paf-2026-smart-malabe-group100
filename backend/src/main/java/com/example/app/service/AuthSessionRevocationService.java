package com.example.app.service;

/**
 * Invalidates all auth state for a user (sessions, 2FA challenges) so tokens stop working immediately after account removal.
 */
public interface AuthSessionRevocationService {

    void revokeAllForUser(String userId);
}

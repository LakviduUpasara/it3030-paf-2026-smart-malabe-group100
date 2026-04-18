package com.example.app.entity;

/**
 * Restricts what a bearer session may do until first-login setup is complete.
 * {@code null} on persisted tokens means a full session (legacy documents).
 */
public enum SessionPhase {
    FULL,
    PASSWORD_CHANGE,
    TWO_FACTOR_METHOD_SELECTION
}

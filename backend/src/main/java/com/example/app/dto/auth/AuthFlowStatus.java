package com.example.app.dto.auth;

public enum AuthFlowStatus {
    AUTHENTICATED,
    PENDING_APPROVAL,
    TWO_FACTOR_REQUIRED,
    AUTHENTICATOR_SETUP_REQUIRED
}

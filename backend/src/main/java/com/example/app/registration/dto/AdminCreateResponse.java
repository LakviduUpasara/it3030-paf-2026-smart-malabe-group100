package com.example.app.registration.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminCreateResponse {
    AdminUserResponse item;
    String generatedPassword;
}

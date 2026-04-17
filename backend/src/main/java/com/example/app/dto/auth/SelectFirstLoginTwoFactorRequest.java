package com.example.app.dto.auth;

import com.example.app.entity.enums.TwoFactorMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SelectFirstLoginTwoFactorRequest {

    @NotNull(message = "Choose email or authenticator app verification.")
    private TwoFactorMethod method;
}

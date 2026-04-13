package com.example.app.dto;

import com.example.app.entity.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupApprovalRequest {

    @NotNull
    private Role assignedRole;

    private String reviewNote;
}

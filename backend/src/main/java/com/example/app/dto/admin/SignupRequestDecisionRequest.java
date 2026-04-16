package com.example.app.dto.admin;

import com.example.app.entity.enums.Role;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequestDecisionRequest {

    @NotNull(message = "Assigned role is required.")
    private Role assignedRole;

    @Size(max = 1000, message = "Reviewer note is too long.")
    private String reviewerNote;
}

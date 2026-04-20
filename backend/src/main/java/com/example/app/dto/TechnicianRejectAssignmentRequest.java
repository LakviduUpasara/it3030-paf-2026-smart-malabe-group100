package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Required note when the assigned technician declines an assignment (returned to the open queue for reassignment).
 */
public class TechnicianRejectAssignmentRequest {

    @NotBlank(message = "A reason is required.")
    @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters.")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

package com.example.app.dto;

import jakarta.validation.constraints.Size;

/**
 * Optional note when the assigned technician declines an assignment (returned to the open queue).
 */
public class TechnicianRejectAssignmentRequest {

    @Size(max = 500)
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}

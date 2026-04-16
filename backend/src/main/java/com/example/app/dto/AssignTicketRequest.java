package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;

public class AssignTicketRequest {

    @NotBlank
    private String technicianUserId;

    public String getTechnicianUserId() {
        return technicianUserId;
    }

    public void setTechnicianUserId(String technicianUserId) {
        this.technicianUserId = technicianUserId;
    }
}

package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketSuggestionRequest {

    @NotBlank(message = "Description is required")
    private String description;

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

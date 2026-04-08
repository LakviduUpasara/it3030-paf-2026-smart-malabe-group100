package com.example.app.dto;

public class UpdateRequest {

    private String message;
    private String updatedBy;

    // getters & setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
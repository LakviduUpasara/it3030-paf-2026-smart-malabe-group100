package com.example.app.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TicketResponse {

    private String id;
    private String title;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String createdByUserId;
    private String categoryId;
    private String subCategoryId;
    private List<String> suggestions = new ArrayList<>();

    private String withdrawalReasonCode;
    private String withdrawalReasonNote;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId) { this.createdByUserId = createdByUserId; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getSubCategoryId() { return subCategoryId; }
    public void setSubCategoryId(String subCategoryId) { this.subCategoryId = subCategoryId; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions != null ? suggestions : new ArrayList<>();
    }

    public String getWithdrawalReasonCode() { return withdrawalReasonCode; }
    public void setWithdrawalReasonCode(String withdrawalReasonCode) { this.withdrawalReasonCode = withdrawalReasonCode; }

    public String getWithdrawalReasonNote() { return withdrawalReasonNote; }
    public void setWithdrawalReasonNote(String withdrawalReasonNote) { this.withdrawalReasonNote = withdrawalReasonNote; }
}
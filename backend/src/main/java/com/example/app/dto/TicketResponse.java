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
    /** Login identifier (email) when the creator account exists. */
    private String createdByUsername;
    private String assignedTechnicianUserId;
    private String assignedTechnicianUsername;
    private String categoryId;
    private String subCategoryId;
    private List<String> suggestions = new ArrayList<>();
    private List<AttachmentResponse> attachments = new ArrayList<>();
    private List<AttachmentResponse> technicianAttachments = new ArrayList<>();
    private List<TicketUpdateResponse> updates = new ArrayList<>();

    private String withdrawalReasonCode;
    private String withdrawalReasonNote;

    /** Present when the last technician declined the assignment (desk may use for triage). */
    private String technicianAssignmentRejectionNote;

    /** {@code PENDING} until accepted; {@code ACCEPTED} when the technician may work; {@code REJECTED} if they declined. */
    private String technicianAcceptance;

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

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public String getAssignedTechnicianUserId() { return assignedTechnicianUserId; }
    public void setAssignedTechnicianUserId(String assignedTechnicianUserId) { this.assignedTechnicianUserId = assignedTechnicianUserId; }

    public String getAssignedTechnicianUsername() { return assignedTechnicianUsername; }
    public void setAssignedTechnicianUsername(String assignedTechnicianUsername) { this.assignedTechnicianUsername = assignedTechnicianUsername; }

    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }

    public String getSubCategoryId() { return subCategoryId; }
    public void setSubCategoryId(String subCategoryId) { this.subCategoryId = subCategoryId; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions != null ? suggestions : new ArrayList<>();
    }

    public List<AttachmentResponse> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<AttachmentResponse> attachments) {
        this.attachments = attachments != null ? attachments : new ArrayList<>();
    }

    public List<AttachmentResponse> getTechnicianAttachments() {
        return technicianAttachments;
    }

    public void setTechnicianAttachments(List<AttachmentResponse> technicianAttachments) {
        this.technicianAttachments = technicianAttachments != null ? technicianAttachments : new ArrayList<>();
    }

    public List<TicketUpdateResponse> getUpdates() {
        return updates;
    }

    public void setUpdates(List<TicketUpdateResponse> updates) {
        this.updates = updates != null ? updates : new ArrayList<>();
    }

    public String getWithdrawalReasonCode() { return withdrawalReasonCode; }
    public void setWithdrawalReasonCode(String withdrawalReasonCode) { this.withdrawalReasonCode = withdrawalReasonCode; }

    public String getWithdrawalReasonNote() { return withdrawalReasonNote; }
    public void setWithdrawalReasonNote(String withdrawalReasonNote) { this.withdrawalReasonNote = withdrawalReasonNote; }

    public String getTechnicianAssignmentRejectionNote() {
        return technicianAssignmentRejectionNote;
    }

    public void setTechnicianAssignmentRejectionNote(String technicianAssignmentRejectionNote) {
        this.technicianAssignmentRejectionNote = technicianAssignmentRejectionNote;
    }

    public String getTechnicianAcceptance() {
        return technicianAcceptance;
    }

    public void setTechnicianAcceptance(String technicianAcceptance) {
        this.technicianAcceptance = technicianAcceptance;
    }
}
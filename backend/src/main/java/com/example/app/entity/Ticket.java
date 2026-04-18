package com.example.app.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;
    private String description;
    private String status;
    private String categoryId;
    private String subCategoryId;
    private List<String> suggestions = new ArrayList<>();

    private LocalDateTime createdAt;

    /** MongoDB user id of the account that submitted the ticket (nullable for legacy rows). */
    private String createdByUserId;

    /** Staff-assigned technician (MongoDB user id). */
    private String assignedTechnicianUserId;

    private List<TicketUpdate> updates = new ArrayList<>();
    /** Photos/files submitted by the requester with the ticket (max 3). */
    private List<Attachment> attachments = new ArrayList<>();
    /** Evidence uploaded by the assigned technician (max 3); stored separately from requester attachments. */
    private List<Attachment> technicianAttachments = new ArrayList<>();

    /** Set when status becomes WITHDRAWN (e.g. RESOLVED_MYSELF, OTHER). */
    private String withdrawalReasonCode;
    /** Free text when withdrawalReasonCode is OTHER. */
    private String withdrawalReasonNote;

    /**
     * When a technician rejects an assignment, optional note for the desk (cleared on new assignment).
     */
    private String technicianAssignmentRejectionNote;

    /**
     * After admin assigns: {@code PENDING} until the technician accepts or rejects.
     * {@code ACCEPTED} means they may update the ticket and mark it resolved.
     * {@code REJECTED} when the assigned technician declined the job (ticket unassigned).
     */
    private String technicianAcceptance;

    /**
     * Set when the assigned technician rejects the job so they can still see the ticket in history until the desk reassigns.
     */
    private String lastRejectedByTechnicianUserId;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getSubCategoryId() {
        return subCategoryId;
    }

    public void setSubCategoryId(String subCategoryId) {
        this.subCategoryId = subCategoryId;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions != null ? suggestions : new ArrayList<>();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(String createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getAssignedTechnicianUserId() {
        return assignedTechnicianUserId;
    }

    public void setAssignedTechnicianUserId(String assignedTechnicianUserId) {
        this.assignedTechnicianUserId = assignedTechnicianUserId;
    }

    public List<TicketUpdate> getUpdates() {
        return updates;
    }

    public void setUpdates(List<TicketUpdate> updates) {
        this.updates = updates != null ? updates : new ArrayList<>();
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<Attachment> attachments) {
        this.attachments = attachments != null ? attachments : new ArrayList<>();
    }

    public List<Attachment> getTechnicianAttachments() {
        return technicianAttachments;
    }

    public void setTechnicianAttachments(List<Attachment> technicianAttachments) {
        this.technicianAttachments = technicianAttachments != null ? technicianAttachments : new ArrayList<>();
    }

    public String getWithdrawalReasonCode() {
        return withdrawalReasonCode;
    }

    public void setWithdrawalReasonCode(String withdrawalReasonCode) {
        this.withdrawalReasonCode = withdrawalReasonCode;
    }

    public String getWithdrawalReasonNote() {
        return withdrawalReasonNote;
    }

    public void setWithdrawalReasonNote(String withdrawalReasonNote) {
        this.withdrawalReasonNote = withdrawalReasonNote;
    }

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

    public String getLastRejectedByTechnicianUserId() {
        return lastRejectedByTechnicianUserId;
    }

    public void setLastRejectedByTechnicianUserId(String lastRejectedByTechnicianUserId) {
        this.lastRejectedByTechnicianUserId = lastRejectedByTechnicianUserId;
    }
}

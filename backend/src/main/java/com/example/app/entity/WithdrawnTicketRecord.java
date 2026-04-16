package com.example.app.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Audit row for each ticket withdrawal, stored in its own collection ({@code withdrawn_tickets}).
 */
@Document(collection = "withdrawn_tickets")
public class WithdrawnTicketRecord {

    @Id
    private String id;

    private String ticketId;
    private String title;
    /** User id of the submitter who withdrew the ticket. */
    private String withdrawnByUserId;

    private LocalDateTime withdrawnAt;

    private String withdrawalReasonCode;
    private String withdrawalReasonNote;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getWithdrawnByUserId() {
        return withdrawnByUserId;
    }

    public void setWithdrawnByUserId(String withdrawnByUserId) {
        this.withdrawnByUserId = withdrawnByUserId;
    }

    public LocalDateTime getWithdrawnAt() {
        return withdrawnAt;
    }

    public void setWithdrawnAt(LocalDateTime withdrawnAt) {
        this.withdrawnAt = withdrawnAt;
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
}

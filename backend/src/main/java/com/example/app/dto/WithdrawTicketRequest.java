package com.example.app.dto;

import jakarta.validation.constraints.NotBlank;

public class WithdrawTicketRequest {

    @NotBlank(message = "Withdrawal reason is required")
    private String reason;

    /** Required when reason is OTHER; ignored otherwise. */
    private String otherReason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getOtherReason() {
        return otherReason;
    }

    public void setOtherReason(String otherReason) {
        this.otherReason = otherReason;
    }
}

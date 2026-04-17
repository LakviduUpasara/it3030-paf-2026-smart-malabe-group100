package com.example.app.dto.admin;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequestRejectRequest {

    /** Optional internal note for staff (not necessarily shown to applicant). */
    @Size(max = 1000, message = "Reviewer note is too long.")
    private String reviewerNote;

    /** Optional reason shown to the applicant when the request is rejected. */
    @Size(max = 1000, message = "Rejection reason is too long.")
    private String rejectionReason;
}

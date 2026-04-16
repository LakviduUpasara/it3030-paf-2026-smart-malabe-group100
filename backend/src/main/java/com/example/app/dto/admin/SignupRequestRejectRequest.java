package com.example.app.dto.admin;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequestRejectRequest {

    @Size(max = 1000, message = "Reviewer note is too long.")
    private String reviewerNote;
}

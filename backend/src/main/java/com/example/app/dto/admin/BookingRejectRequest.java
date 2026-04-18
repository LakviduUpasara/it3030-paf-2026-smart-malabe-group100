package com.example.app.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingRejectRequest {

    @NotBlank(message = "Rejection reason is required.")
    private String reason;
}

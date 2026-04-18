package com.example.app.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminAssignTicketRequest {

    @NotBlank(message = "Assignee technician user id is required.")
    private String assigneeTechnicianId;
}

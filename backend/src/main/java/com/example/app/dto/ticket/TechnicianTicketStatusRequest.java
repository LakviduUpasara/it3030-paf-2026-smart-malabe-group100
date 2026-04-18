package com.example.app.dto.ticket;

import com.example.app.entity.enums.IncidentTicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TechnicianTicketStatusRequest {

    @NotNull(message = "Status is required.")
    private IncidentTicketStatus status;
}

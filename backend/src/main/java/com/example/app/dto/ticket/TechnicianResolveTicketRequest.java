package com.example.app.dto.ticket;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TechnicianResolveTicketRequest {

    @Size(max = 8000)
    private String resolutionNotes;
}

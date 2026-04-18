package com.example.app.dto.ticket;

import com.example.app.entity.enums.IncidentTicketStatus;
import com.example.app.entity.enums.TicketPriority;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentTicketResponse {

    private String id;
    private String reference;
    private String title;
    private String description;
    private String category;
    private String location;
    private TicketPriority priority;
    private IncidentTicketStatus status;
    private String reporterUserId;
    private String reporterDisplayName;
    private String assigneeTechnicianId;
    private String assigneeDisplayName;
    private List<TicketProgressNoteResponse> progressNotes;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

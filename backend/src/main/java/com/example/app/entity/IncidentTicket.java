package com.example.app.entity;

import com.example.app.entity.enums.IncidentTicketStatus;
import com.example.app.entity.enums.TicketPriority;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "incident_tickets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentTicket {

    @Id
    private String id;

    /** Human-readable reference shown in UI (e.g. TK-A1B2C3). */
    @Indexed(unique = true)
    private String reference;

    private String title;

    private String description;

    private String category;

    private String location;

    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Builder.Default
    private IncidentTicketStatus status = IncidentTicketStatus.OPEN;

    @Indexed
    private String reporterUserId;

    @Indexed
    private String assigneeTechnicianId;

    @Builder.Default
    private List<TicketProgressNote> progressNotes = new ArrayList<>();

    private String resolutionNotes;

    private LocalDateTime resolvedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}

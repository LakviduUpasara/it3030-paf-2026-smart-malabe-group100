package com.example.app.ticket;

import com.example.app.dto.ticket.IncidentTicketResponse;
import com.example.app.dto.ticket.TicketProgressNoteResponse;
import com.example.app.entity.IncidentTicket;
import com.example.app.entity.TicketProgressNote;
import java.util.List;

public final class IncidentTicketMapper {

    private IncidentTicketMapper() {
    }

    public static IncidentTicketResponse toResponse(IncidentTicket t) {
        if (t == null) {
            return null;
        }
        return IncidentTicketResponse.builder()
                .id(t.getId())
                .reference(t.getReference())
                .title(t.getTitle())
                .description(t.getDescription())
                .category(t.getCategory())
                .location(t.getLocation())
                .priority(t.getPriority())
                .status(t.getStatus())
                .reporterUserId(t.getReporterUserId())
                .assigneeTechnicianId(t.getAssigneeTechnicianId())
                .progressNotes(mapNotes(t.getProgressNotes()))
                .resolutionNotes(t.getResolutionNotes())
                .resolvedAt(t.getResolvedAt())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private static List<TicketProgressNoteResponse> mapNotes(List<TicketProgressNote> notes) {
        if (notes == null) {
            return List.of();
        }
        return notes.stream()
                .map(n -> TicketProgressNoteResponse.builder()
                        .id(n.getId())
                        .content(n.getContent())
                        .authorUserId(n.getAuthorUserId())
                        .authorDisplayName(n.getAuthorDisplayName())
                        .createdAt(n.getCreatedAt())
                        .build())
                .toList();
    }
}

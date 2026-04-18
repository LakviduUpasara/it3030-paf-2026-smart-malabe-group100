package com.example.app.controller;

import com.example.app.dto.ticket.IncidentTicketResponse;
import com.example.app.dto.ticket.TechnicianProgressNoteRequest;
import com.example.app.dto.ticket.TechnicianResolutionNotesRequest;
import com.example.app.dto.ticket.TechnicianResolveTicketRequest;
import com.example.app.dto.ticket.TechnicianTicketStatusRequest;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.ticket.IncidentTicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/technician/tickets")
@RequiredArgsConstructor
public class TechnicianTicketController {

    private final IncidentTicketService incidentTicketService;

    @GetMapping
    public ResponseEntity<List<IncidentTicketResponse>> listAssigned(@AuthenticationPrincipal AuthenticatedUser user) {
        requireUser(user);
        return ResponseEntity.ok(incidentTicketService.listAssignedToTechnician(user));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<IncidentTicketResponse> getOne(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId
    ) {
        requireUser(user);
        return ResponseEntity.ok(incidentTicketService.getForTechnician(user, ticketId));
    }

    @PatchMapping("/{ticketId}/status")
    public ResponseEntity<IncidentTicketResponse> updateStatus(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId,
            @Valid @RequestBody TechnicianTicketStatusRequest request
    ) {
        requireUser(user);
        return ResponseEntity.ok(incidentTicketService.updateStatusForTechnician(user, ticketId, request));
    }

    @PostMapping("/{ticketId}/progress-notes")
    public ResponseEntity<IncidentTicketResponse> addProgressNote(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId,
            @Valid @RequestBody TechnicianProgressNoteRequest request
    ) {
        requireUser(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentTicketService.addProgressNoteForTechnician(user, ticketId, request));
    }

    @PatchMapping("/{ticketId}/resolution-notes")
    public ResponseEntity<IncidentTicketResponse> updateResolutionNotes(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId,
            @Valid @RequestBody TechnicianResolutionNotesRequest request
    ) {
        requireUser(user);
        return ResponseEntity.ok(incidentTicketService.updateResolutionNotesForTechnician(user, ticketId, request));
    }

    @PostMapping("/{ticketId}/actions/resolve")
    public ResponseEntity<IncidentTicketResponse> resolve(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId,
            @Valid @RequestBody(required = false) TechnicianResolveTicketRequest request
    ) {
        requireUser(user);
        return ResponseEntity.ok(incidentTicketService.resolveForTechnician(user, ticketId, request));
    }

    private static void requireUser(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        }
    }
}

package com.example.app.controller;

import com.example.app.dto.ticket.AdminAssignTicketRequest;
import com.example.app.dto.ticket.IncidentTicketResponse;
import com.example.app.dto.ticket.TechnicianOptionResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/tickets")
@RequiredArgsConstructor
public class AdminTicketDeskController {

    private final IncidentTicketService incidentTicketService;

    @GetMapping
    public ResponseEntity<List<IncidentTicketResponse>> listAll(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return ResponseEntity.ok(incidentTicketService.listAllForAdmin());
    }

    @GetMapping("/assignable-technicians")
    public ResponseEntity<List<TechnicianOptionResponse>> assignableTechnicians(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        requireAdmin(user);
        return ResponseEntity.ok(incidentTicketService.listAssignableTechnicians());
    }

    @PatchMapping("/{ticketId}/assignment")
    public ResponseEntity<IncidentTicketResponse> assign(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String ticketId,
            @Valid @RequestBody AdminAssignTicketRequest request
    ) {
        requireAdmin(user);
        return ResponseEntity.ok(incidentTicketService.assignTicket(user, ticketId, request));
    }

    private static void requireAdmin(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to manage tickets.");
        }
    }
}

package com.example.app.controller;

import com.example.app.dto.ticket.CreateTicketRequest;
import com.example.app.dto.ticket.IncidentTicketResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Campus users report incidents; technicians use {@code /api/v1/technician/tickets}.
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class CampusTicketController {

    private final IncidentTicketService incidentTicketService;

    @PostMapping
    public ResponseEntity<IncidentTicketResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateTicketRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to report a ticket.");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentTicketService.createTicket(user, request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<IncidentTicketResponse>> myTickets(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to view your tickets.");
        }
        return ResponseEntity.ok(incidentTicketService.listMyReportedTickets(user));
    }
}

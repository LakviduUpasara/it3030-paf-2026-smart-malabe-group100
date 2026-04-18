package com.example.app.controller;

import com.example.app.dto.notifications.MarkNotificationsReadRequest;
import com.example.app.dto.notifications.TechnicianNotificationSummaryResponse;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.ticket.TechnicianNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/technician/notifications")
@RequiredArgsConstructor
public class TechnicianNotificationController {

    private final TechnicianNotificationService technicianNotificationService;

    @GetMapping
    public ResponseEntity<TechnicianNotificationSummaryResponse> summary(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        }
        return ResponseEntity.ok(technicianNotificationService.loadSummary(user));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody MarkNotificationsReadRequest request
    ) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Sign in to continue.");
        }
        technicianNotificationService.markRead(user, request);
        return ResponseEntity.noContent().build();
    }
}

package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.notifications.CreateAdminNotificationRequest;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.dto.notifications.NotificationSettingsResponse;
import com.example.app.dto.notifications.NotificationSettingsUpdateRequest;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.NotificationService;
import com.example.app.service.NotificationSettingsService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only endpoints for the Notification Module.
 *
 * <p>All routes live under {@code /api/v1/admin/**} which is already guarded by
 * {@code hasRole("ADMIN")} in {@link com.example.app.security.SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationsController {

    private final NotificationService notificationService;
    private final NotificationSettingsService settingsService;

    /** Send a manual broadcast to any combination of ADMIN / USER / TECHNICIAN. */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> send(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateAdminNotificationRequest request) {
        requireAdmin(user);
        int recipients = notificationService.sendAdminBroadcast(request, user.getUserId());
        Map<String, Object> body = Map.of("deliveredTo", recipients);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Notification dispatched to " + recipients + " recipient(s)", body));
    }

    /** Paged history of all notifications sent system-wide (admin audit). */
    @GetMapping("/history")
    public ApiResponse<Page<NotificationResponse>> history(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        requireAdmin(user);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200));
        return ApiResponse.success("Notification history", notificationService.adminHistory(pageable));
    }

    private static void requireAdmin(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform admins can access this endpoint.");
        }
    }
}

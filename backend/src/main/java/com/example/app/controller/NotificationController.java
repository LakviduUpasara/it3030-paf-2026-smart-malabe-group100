package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.dto.notifications.UnreadCountResponse;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationType;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.NotificationService;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * User-scoped notification endpoints. Each caller only sees their own notifications.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private static final int RECENT_DEFAULT = 6;
    private static final int RECENT_MAX = 10;

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "false") boolean unread,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAuth(user);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<NotificationResponse> result = notificationService.listForUser(
                user.getUserId(),
                unread,
                parseCategory(category),
                parseType(type),
                pageable);
        return ApiResponse.success("Notifications retrieved", result);
    }

    @GetMapping("/recent")
    public ApiResponse<List<NotificationResponse>> recent(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "6") int limit) {
        requireAuth(user);
        int capped = Math.min(Math.max(limit, 1), RECENT_MAX);
        List<NotificationResponse> list = notificationService.recentForUser(user.getUserId(), capped == 0 ? RECENT_DEFAULT : capped);
        return ApiResponse.success("Recent notifications", list);
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> unreadCount(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAuth(user);
        long count = notificationService.unreadCount(user.getUserId());
        return ApiResponse.success("Unread count", UnreadCountResponse.builder().unreadCount(count).build());
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String id) {
        requireAuth(user);
        return ApiResponse.success("Notification marked as read",
                notificationService.markRead(user.getUserId(), id));
    }

    @PatchMapping("/read-all")
    public ApiResponse<Integer> markAllRead(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAuth(user);
        int updated = notificationService.markAllRead(user.getUserId());
        return ApiResponse.success("Marked " + updated + " notification(s) as read", updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable String id) {
        requireAuth(user);
        notificationService.delete(user.getUserId(), id);
        return ResponseEntity.noContent().build();
    }

    private static void requireAuth(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
    }

    private static Optional<NotificationCategory> parseCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(NotificationCategory.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid category filter: " + raw + " (allowed: BOOKING, TICKET, SYSTEM).");
        }
    }

    private static Optional<NotificationType> parseType(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(NotificationType.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid type filter: " + raw);
        }
    }
}

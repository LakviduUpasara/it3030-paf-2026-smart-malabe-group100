package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.dto.notifications.UnreadCountResponse;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.NotificationService;
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
 * Secured by the fallback {@code anyRequest().authenticated()} in {@link com.example.app.security.SecurityConfig}.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "false") boolean unread,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAuth(user);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<NotificationResponse> result = notificationService.listForUser(user.getUserId(), unread, pageable);
        return ApiResponse.success("Notifications retrieved", result);
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
}

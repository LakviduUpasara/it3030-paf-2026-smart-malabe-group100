package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.notifications.NotificationSettingsResponse;
import com.example.app.dto.notifications.NotificationSettingsUpdateRequest;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.security.AuthenticatedUser;
import com.example.app.service.NotificationSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/notification-settings")
@RequiredArgsConstructor
public class AdminNotificationSettingsController {

    private final NotificationSettingsService settingsService;

    @GetMapping
    public ApiResponse<NotificationSettingsResponse> get(@AuthenticationPrincipal AuthenticatedUser user) {
        requireAdmin(user);
        return ApiResponse.success("Notification settings loaded", settingsService.get());
    }

    @PutMapping
    public ApiResponse<NotificationSettingsResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody NotificationSettingsUpdateRequest request) {
        requireAdmin(user);
        return ApiResponse.success("Notification settings updated", settingsService.update(request));
    }

    private static void requireAdmin(AuthenticatedUser user) {
        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        if (user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only platform admins can change these settings.");
        }
    }
}

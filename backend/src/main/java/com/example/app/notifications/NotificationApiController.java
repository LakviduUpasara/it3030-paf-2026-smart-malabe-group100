package com.example.app.notifications;

import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.notifications.dto.AudienceResolveRequest;
import com.example.app.notifications.dto.AudienceResolveResponse;
import com.example.app.notifications.dto.NotificationEmailRequest;
import com.example.app.security.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationAudienceResolutionService audienceResolutionService;
    private final NotificationEmailService notificationEmailService;

    @PostMapping("/audience")
    public AudienceResolveResponse resolveAudience(@RequestBody AudienceResolveRequest body) {
        if (body == null || body.getAudience() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "audience is required");
        }
        return audienceResolutionService.resolve(body.getAudience());
    }

    @PostMapping("/email")
    public void sendEmail(@RequestBody NotificationEmailRequest body) {
        requireSuperAdmin();
        if (body == null || body.getToEmails() == null || body.getToEmails().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "toEmails is required");
        }
        notificationEmailService.sendHtmlBroadcast(body.getToEmails(), body.getSubject(), body.getHtmlBody());
    }

    private static void requireSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthenticatedUser au)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Authentication required");
        }
        if (au.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only a super administrator can send notification emails");
        }
    }
}

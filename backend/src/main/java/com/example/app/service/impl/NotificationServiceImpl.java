package com.example.app.service.impl;

import com.example.app.dto.notifications.CreateAdminNotificationRequest;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.entity.Notification;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.AccountStatus;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationChannel;
import com.example.app.entity.enums.NotificationPriority;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import com.example.app.entity.enums.Role;
import com.example.app.exception.ApiException;
import com.example.app.notifications.NotificationEmailService;
import com.example.app.repository.NotificationRepository;
import com.example.app.repository.UserAccountRepository;
import com.example.app.service.NotificationService;
import com.example.app.service.NotificationSettingsService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Default {@link NotificationService}. Writes a per-recipient document for web/in-app delivery,
 * and fans out an email when the delivery channel and global settings allow it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private static final Set<Role> ADMIN_TARGET_ROLES = EnumSet.of(Role.ADMIN);
    private static final Set<Role> USER_TARGET_ROLES = EnumSet.of(Role.USER, Role.STUDENT);
    private static final Set<Role> TECHNICIAN_TARGET_ROLES = EnumSet.of(Role.TECHNICIAN);

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationSettingsService settingsService;
    private final NotificationEmailService emailService;

    // --- automatic triggers ---------------------------------------------------

    @Override
    public void deliver(
            String recipientUserId,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId) {
        if (recipientUserId == null || recipientUserId.isBlank()) {
            return;
        }
        deliverMany(
                List.of(recipientUserId),
                type,
                category,
                title,
                message,
                relatedEntityType,
                relatedEntityId,
                createdByUserId);
    }

    @Override
    public void deliverMany(
            List<String> recipientUserIds,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId) {
        if (recipientUserIds == null || recipientUserIds.isEmpty()) {
            return;
        }
        if (!settingsService.isCategoryEnabled(category)) {
            log.debug("Notification category {} disabled globally; skipping delivery", category);
            return;
        }

        boolean webEnabled = settingsService.isChannelEnabled(NotificationChannel.WEB);
        boolean emailEnabled = settingsService.isChannelEnabled(NotificationChannel.EMAIL);

        List<UserAccount> recipients = recipientUserIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .map(userAccountRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(u -> u.getStatus() == AccountStatus.ACTIVE)
                .toList();

        if (webEnabled) {
            persistWebForRecipients(
                    recipients, type, category, title, message, relatedEntityType, relatedEntityId, createdByUserId);
        }

        if (emailEnabled) {
            List<String> toEmails = recipients.stream()
                    .filter(UserAccount::isEmailNotificationsEnabled)
                    .map(UserAccount::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .collect(Collectors.toList());
            if (!toEmails.isEmpty()) {
                try {
                    emailService.sendHtmlBroadcast(toEmails, title, buildEmailHtml(title, message));
                } catch (ApiException e) {
                    // email optional — log and continue so the web notification still lands
                    log.warn("Email delivery skipped for notification '{}': {}", title, e.getMessage());
                } catch (RuntimeException e) {
                    log.error("Unexpected email delivery failure for notification '{}'", title, e);
                }
            }
        }
    }

    // --- admin broadcast ------------------------------------------------------

    @Override
    public int sendAdminBroadcast(CreateAdminNotificationRequest request, String actorUserId) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }
        Set<Role> target = parseAudienceRoles(request.getAudienceRoles());
        if (target.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "audienceRoles must include at least one of ADMIN, USER, TECHNICIAN.");
        }
        NotificationChannel channel = request.getChannel() != null ? request.getChannel() : NotificationChannel.WEB;

        if (channel != NotificationChannel.WEB && !settingsService.isChannelEnabled(NotificationChannel.EMAIL)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Email notifications are disabled in system settings.");
        }
        if (channel == NotificationChannel.EMAIL && !settingsService.isChannelEnabled(NotificationChannel.WEB)
                && !settingsService.isCategoryEnabled(NotificationCategory.SYSTEM)) {
            // No-op: we still send email even if WEB is off.
        }

        List<UserAccount> recipients = userAccountRepository.findByStatus(AccountStatus.ACTIVE).stream()
                .filter(u -> u.getRole() != null && target.contains(u.getRole()))
                .collect(Collectors.toList());

        NotificationPriority priority =
                request.getPriority() != null ? request.getPriority() : NotificationPriority.NORMAL;

        if (channel == NotificationChannel.WEB || channel == NotificationChannel.BOTH) {
            if (settingsService.isChannelEnabled(NotificationChannel.WEB)) {
                persistWeb(
                        recipients,
                        NotificationType.ADMIN_BROADCAST,
                        NotificationCategory.SYSTEM,
                        request.getTitle(),
                        request.getMessage(),
                        NotificationRelatedEntity.SYSTEM,
                        null,
                        actorUserId,
                        priority);
            }
        }
        if (channel == NotificationChannel.EMAIL || channel == NotificationChannel.BOTH) {
            if (settingsService.isChannelEnabled(NotificationChannel.EMAIL)) {
                List<String> toEmails = recipients.stream()
                        .filter(UserAccount::isEmailNotificationsEnabled)
                        .map(UserAccount::getEmail)
                        .filter(e -> e != null && !e.isBlank())
                        .collect(Collectors.toList());
                if (!toEmails.isEmpty()) {
                    try {
                        emailService.sendHtmlBroadcast(
                                toEmails, request.getTitle(), buildEmailHtml(request.getTitle(), request.getMessage()));
                    } catch (ApiException e) {
                        log.warn("Email delivery skipped for admin broadcast: {}", e.getMessage());
                    }
                }
            }
        }

        return recipients.size();
    }

    // --- reads ----------------------------------------------------------------

    @Override
    public Page<NotificationResponse> listForUser(String userId, boolean onlyUnread, Pageable pageable) {
        requireUser(userId);
        Page<Notification> page = onlyUnread
                ? notificationRepository.findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(NotificationResponse::from);
    }

    @Override
    public long unreadCount(String userId) {
        requireUser(userId);
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    @Override
    public NotificationResponse markRead(String userId, String notificationId) {
        requireUser(userId);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!userId.equals(n.getRecipientUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot modify this notification.");
        }
        if (!n.isRead()) {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
        return NotificationResponse.from(n);
    }

    @Override
    public int markAllRead(String userId) {
        requireUser(userId);
        List<Notification> unread = notificationRepository.findByRecipientUserIdAndIsReadFalse(userId);
        LocalDateTime now = LocalDateTime.now();
        for (Notification n : unread) {
            n.setRead(true);
            n.setReadAt(now);
        }
        if (!unread.isEmpty()) {
            notificationRepository.saveAll(unread);
        }
        return unread.size();
    }

    @Override
    public void delete(String userId, String notificationId) {
        requireUser(userId);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!userId.equals(n.getRecipientUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot delete this notification.");
        }
        notificationRepository.deleteById(notificationId);
    }

    @Override
    public Page<NotificationResponse> adminHistory(Pageable pageable) {
        return notificationRepository.findAll(pageable).map(NotificationResponse::from);
    }

    // --- helpers --------------------------------------------------------------

    private void persistWebForRecipients(
            List<UserAccount> recipients,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId) {
        persistWeb(
                recipients,
                type,
                category,
                title,
                message,
                relatedEntityType,
                relatedEntityId,
                createdByUserId,
                NotificationPriority.NORMAL);
    }

    private void persistWeb(
            List<UserAccount> recipients,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId,
            NotificationPriority priority) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        List<Notification> batch = new ArrayList<>(recipients.size());
        for (UserAccount user : recipients) {
            if (!user.isAppNotificationsEnabled()) {
                continue;
            }
            batch.add(Notification.builder()
                    .recipientUserId(user.getId())
                    .recipientRole(user.getRole())
                    .title(safeTrim(title, 150))
                    .message(safeTrim(message, 4000))
                    .type(type)
                    .category(category)
                    .channel(NotificationChannel.WEB)
                    .priority(priority)
                    .relatedEntityType(relatedEntityType != null ? relatedEntityType : NotificationRelatedEntity.NONE)
                    .relatedEntityId(relatedEntityId)
                    .isRead(false)
                    .createdAt(now)
                    .createdBy(createdByUserId != null ? createdByUserId : "SYSTEM")
                    .build());
        }
        if (!batch.isEmpty()) {
            notificationRepository.saveAll(batch);
        }
    }

    private Set<Role> parseAudienceRoles(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return Collections.emptySet();
        }
        Set<Role> roles = EnumSet.noneOf(Role.class);
        for (String token : raw) {
            if (token == null || token.isBlank()) {
                continue;
            }
            String k = token.trim().toUpperCase(Locale.ROOT);
            switch (k) {
                case "ADMIN" -> roles.addAll(ADMIN_TARGET_ROLES);
                case "USER" -> roles.addAll(USER_TARGET_ROLES);
                case "TECHNICIAN" -> roles.addAll(TECHNICIAN_TARGET_ROLES);
                default -> throw new ApiException(HttpStatus.BAD_REQUEST,
                        "audienceRoles only supports ADMIN, USER, TECHNICIAN. Got: " + token);
            }
        }
        return roles;
    }

    private static void requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
    }

    private static String safeTrim(String value, int max) {
        if (value == null) {
            return "";
        }
        String v = value.trim();
        if (v.length() <= max) {
            return v;
        }
        return v.substring(0, max);
    }

    private static String buildEmailHtml(String title, String message) {
        String safeTitle = title != null ? title : "Notification";
        String safeMessage = message != null ? message : "";
        return "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;\">"
                + "<h2 style=\"color:#0f172a;\">" + htmlEscape(safeTitle) + "</h2>"
                + "<p style=\"color:#334155;line-height:1.5;white-space:pre-wrap;\">"
                + htmlEscape(safeMessage)
                + "</p>"
                + "<hr style=\"border:none;border-top:1px solid #e2e8f0;\" />"
                + "<p style=\"color:#64748b;font-size:12px;\">Smart Campus Operations Hub</p>"
                + "</div>";
    }

    private static String htmlEscape(String v) {
        return v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}

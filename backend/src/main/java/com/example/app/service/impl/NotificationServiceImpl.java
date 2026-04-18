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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
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
    private final MongoTemplate mongoTemplate;

    // --- automatic triggers ---------------------------------------------------

    @Override
    public void deliver(DeliverRequest request) {
        if (request == null || isBlank(request.getRecipientUserId())) {
            return;
        }
        deliverMany(List.of(request.getRecipientUserId()), request);
    }

    @Override
    public void deliverMany(List<String> recipientUserIds, DeliverRequest request) {
        if (request == null || recipientUserIds == null || recipientUserIds.isEmpty()) {
            return;
        }
        if (!settingsService.isCategoryEnabled(request.getCategory())) {
            log.debug("Notification category {} disabled globally; skipping delivery", request.getCategory());
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
            persistWeb(recipients, request);
        }

        if (emailEnabled) {
            List<String> toEmails = recipients.stream()
                    .filter(UserAccount::isEmailNotificationsEnabled)
                    .map(UserAccount::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .collect(Collectors.toList());
            if (!toEmails.isEmpty()) {
                try {
                    emailService.sendHtmlBroadcast(toEmails, request.getTitle(),
                            buildEmailHtml(request.getTitle(), request.getMessage()));
                } catch (ApiException e) {
                    log.warn("Email delivery skipped for notification '{}': {}", request.getTitle(), e.getMessage());
                } catch (RuntimeException e) {
                    log.error("Unexpected email delivery failure for notification '{}'", request.getTitle(), e);
                }
            }
        }
    }

    // --- admin broadcast ------------------------------------------------------

    @Override
    public int sendAdminBroadcast(CreateAdminNotificationRequest request, UserAccount actor) {
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

        List<UserAccount> recipients = userAccountRepository.findByStatus(AccountStatus.ACTIVE).stream()
                .filter(u -> u.getRole() != null && target.contains(u.getRole()))
                .collect(Collectors.toList());

        NotificationPriority priority =
                request.getPriority() != null ? request.getPriority() : NotificationPriority.NORMAL;

        DeliverRequest req = DeliverRequest.builder()
                .type(NotificationType.ADMIN_BROADCAST)
                .category(NotificationCategory.SYSTEM)
                .title(request.getTitle())
                .message(request.getMessage())
                .relatedEntityType(NotificationRelatedEntity.SYSTEM)
                .actor(actor)
                .priority(priority)
                .build();

        if ((channel == NotificationChannel.WEB || channel == NotificationChannel.BOTH)
                && settingsService.isChannelEnabled(NotificationChannel.WEB)) {
            persistWeb(recipients, req);
        }

        if ((channel == NotificationChannel.EMAIL || channel == NotificationChannel.BOTH)
                && settingsService.isChannelEnabled(NotificationChannel.EMAIL)) {
            List<String> toEmails = recipients.stream()
                    .filter(UserAccount::isEmailNotificationsEnabled)
                    .map(UserAccount::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .collect(Collectors.toList());
            if (!toEmails.isEmpty()) {
                try {
                    emailService.sendHtmlBroadcast(toEmails, request.getTitle(),
                            buildEmailHtml(request.getTitle(), request.getMessage()));
                } catch (ApiException e) {
                    log.warn("Email delivery skipped for admin broadcast: {}", e.getMessage());
                }
            }
        }

        return recipients.size();
    }

    // --- reads ----------------------------------------------------------------

    @Override
    public Page<NotificationResponse> listForUser(
            String userId,
            boolean onlyUnread,
            Optional<NotificationCategory> category,
            Optional<NotificationType> type,
            Pageable pageable) {
        requireUser(userId);

        // Fast path: no category or type filter → use simple derived queries.
        boolean hasFilter = category.isPresent() || type.isPresent();
        if (!hasFilter) {
            Page<Notification> page = onlyUnread
                    ? notificationRepository.findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable)
                    : notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
            return page.map(NotificationResponse::from);
        }

        Criteria criteria = Criteria.where("recipientUserId").is(userId);
        if (onlyUnread) {
            criteria = criteria.and("isRead").is(false);
        }
        category.ifPresent(c -> criteria.and("category").is(c));
        type.ifPresent(t -> criteria.and("type").is(t));
        Query query = new Query(criteria).with(pageable.getSort().isSorted()
                ? pageable.getSort()
                : org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Notification.class);
        query.skip(pageable.getOffset()).limit(pageable.getPageSize());
        List<Notification> rows = mongoTemplate.find(query, Notification.class);
        List<NotificationResponse> mapped = rows.stream().map(NotificationResponse::from).toList();
        return new PageImpl<>(mapped, pageable, total);
    }

    @Override
    public List<NotificationResponse> recentForUser(String userId, int limit) {
        requireUser(userId);
        List<Notification> rows = notificationRepository.findTop10ByRecipientUserIdOrderByCreatedAtDesc(userId);
        int cap = limit > 0 && limit < rows.size() ? limit : rows.size();
        return rows.subList(0, cap).stream().map(NotificationResponse::from).toList();
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

    private void persistWeb(List<UserAccount> recipients, DeliverRequest req) {
        if (recipients == null || recipients.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        List<Notification> batch = new ArrayList<>(recipients.size());
        UserAccount actor = req.getActor();
        String actorId = actor != null ? actor.getId() : null;
        String actorName = actor != null
                ? (notBlank(actor.getFullName()) ? actor.getFullName() : actor.getEmail())
                : null;
        String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : null;

        for (UserAccount user : recipients) {
            if (!user.isAppNotificationsEnabled()) {
                continue;
            }
            batch.add(Notification.builder()
                    .recipientUserId(user.getId())
                    .recipientRole(user.getRole())
                    .title(safeTrim(req.getTitle(), 150))
                    .message(safeTrim(req.getMessage(), 4000))
                    .type(req.getType())
                    .category(req.getCategory())
                    .channel(NotificationChannel.WEB)
                    .priority(req.getPriority() != null ? req.getPriority() : NotificationPriority.NORMAL)
                    .relatedEntityType(req.getRelatedEntityType() != null
                            ? req.getRelatedEntityType()
                            : NotificationRelatedEntity.NONE)
                    .relatedEntityId(req.getRelatedEntityId())
                    .isRead(false)
                    .createdAt(now)
                    .createdBy(actorId != null ? actorId : "SYSTEM")
                    .actorUserId(actorId)
                    .actorNameSnapshot(actorName)
                    .actorRoleSnapshot(actorRole)
                    .metadataJson(req.getMetadataJson())
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

    private static boolean isBlank(String v) { return v == null || v.isBlank(); }
    private static boolean notBlank(String v) { return v != null && !v.isBlank(); }

    private static String safeTrim(String value, int max) {
        if (value == null) {
            return "";
        }
        String v = value.trim();
        return v.length() <= max ? v : v.substring(0, max);
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

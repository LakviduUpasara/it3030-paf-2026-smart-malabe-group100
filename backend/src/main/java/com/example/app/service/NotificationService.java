package com.example.app.service;

import com.example.app.dto.notifications.CreateAdminNotificationRequest;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.entity.Notification;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Central entry-point for creating and reading user notifications.
 *
 * <p>All automatic triggers (booking approve / reject, ticket lifecycle, comments) funnel through
 * the {@code deliver*} helpers so delivery rules (web/email, settings flags, category gate) live
 * in a single place.
 */
public interface NotificationService {

    /** Deliver a single-recipient notification. Honors system settings. Safe for null recipient. */
    void deliver(
            String recipientUserId,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId);

    /** Deliver to multiple recipients (used by automatic admin broadcasts, e.g. new ticket). */
    void deliverMany(
            List<String> recipientUserIds,
            NotificationType type,
            NotificationCategory category,
            String title,
            String message,
            NotificationRelatedEntity relatedEntityType,
            String relatedEntityId,
            String createdByUserId);

    /** Admin console: send manual notifications to one or more of ADMIN/USER/TECHNICIAN. */
    int sendAdminBroadcast(CreateAdminNotificationRequest request, String actorUserId);

    Page<NotificationResponse> listForUser(String userId, boolean onlyUnread, Pageable pageable);

    long unreadCount(String userId);

    NotificationResponse markRead(String userId, String notificationId);

    int markAllRead(String userId);

    void delete(String userId, String notificationId);

    Page<NotificationResponse> adminHistory(Pageable pageable);
}

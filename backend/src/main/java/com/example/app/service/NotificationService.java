package com.example.app.service;

import com.example.app.dto.notifications.CreateAdminNotificationRequest;
import com.example.app.dto.notifications.NotificationResponse;
import com.example.app.entity.UserAccount;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationPriority;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import java.util.List;
import java.util.Optional;
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

    /**
     * Deliver a single-recipient notification. Honors system settings.
     * Safe for null/blank recipient (no-op).
     */
    void deliver(DeliverRequest request);

    /** Deliver to multiple recipients (used by automatic admin broadcasts, e.g. new ticket). */
    void deliverMany(List<String> recipientUserIds, DeliverRequest request);

    /** Admin console: send manual notifications to one or more of ADMIN/USER/TECHNICIAN. */
    int sendAdminBroadcast(CreateAdminNotificationRequest request, UserAccount actor);

    Page<NotificationResponse> listForUser(
            String userId,
            boolean onlyUnread,
            Optional<NotificationCategory> category,
            Optional<NotificationType> type,
            Pageable pageable);

    /** Optimised lookup for the bell dropdown — most recent N items. */
    List<NotificationResponse> recentForUser(String userId, int limit);

    long unreadCount(String userId);

    NotificationResponse markRead(String userId, String notificationId);

    int markAllRead(String userId);

    void delete(String userId, String notificationId);

    Page<NotificationResponse> adminHistory(Pageable pageable);

    /**
     * Parameter object for delivery to avoid long positional argument lists.
     * All fields except {@code title}, {@code message}, {@code type}, {@code category} are optional.
     */
    class DeliverRequest {
        private String recipientUserId;
        private NotificationType type;
        private NotificationCategory category;
        private String title;
        private String message;
        private NotificationRelatedEntity relatedEntityType;
        private String relatedEntityId;
        private UserAccount actor;
        private NotificationPriority priority;
        private String metadataJson;

        public static Builder builder() { return new Builder(); }

        public String getRecipientUserId() { return recipientUserId; }
        public NotificationType getType() { return type; }
        public NotificationCategory getCategory() { return category; }
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public NotificationRelatedEntity getRelatedEntityType() { return relatedEntityType; }
        public String getRelatedEntityId() { return relatedEntityId; }
        public UserAccount getActor() { return actor; }
        public NotificationPriority getPriority() { return priority; }
        public String getMetadataJson() { return metadataJson; }

        public static final class Builder {
            private final DeliverRequest r = new DeliverRequest();
            public Builder recipientUserId(String v) { r.recipientUserId = v; return this; }
            public Builder type(NotificationType v) { r.type = v; return this; }
            public Builder category(NotificationCategory v) { r.category = v; return this; }
            public Builder title(String v) { r.title = v; return this; }
            public Builder message(String v) { r.message = v; return this; }
            public Builder relatedEntityType(NotificationRelatedEntity v) { r.relatedEntityType = v; return this; }
            public Builder relatedEntityId(String v) { r.relatedEntityId = v; return this; }
            public Builder actor(UserAccount v) { r.actor = v; return this; }
            public Builder priority(NotificationPriority v) { r.priority = v; return this; }
            public Builder metadataJson(String v) { r.metadataJson = v; return this; }
            public DeliverRequest build() { return r; }
        }
    }
}

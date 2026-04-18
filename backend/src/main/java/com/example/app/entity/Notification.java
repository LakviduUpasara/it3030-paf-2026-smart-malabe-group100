package com.example.app.entity;

import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationChannel;
import com.example.app.entity.enums.NotificationPriority;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import com.example.app.entity.enums.Role;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Per-user notification row. One document per (event × recipient) so a broadcast to 50 users
 * creates 50 documents, each with its own {@code isRead} state.
 */
@Document(collection = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    /** Recipient user account id (UserAccount.id). Always set. */
    @Indexed
    private String recipientUserId;

    /** Recipient role snapshot at delivery time (helps history filters on broadcasts). */
    private Role recipientRole;

    private String title;

    private String message;

    private NotificationType type;

    private NotificationCategory category;

    /** Delivery channel requested by the sender (WEB, EMAIL, BOTH). */
    private NotificationChannel channel;

    @Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;

    private NotificationRelatedEntity relatedEntityType;

    private String relatedEntityId;

    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime readAt;

    @Indexed
    private LocalDateTime createdAt;

    /** UserAccount id of the actor who triggered the notification (or SYSTEM for automatic). */
    private String createdBy;

    /** Extensible JSON payload (e.g. booking.resourceName, ticket.title) for the UI. */
    private String metadataJson;
}

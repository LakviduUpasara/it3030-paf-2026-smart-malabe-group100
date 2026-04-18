package com.example.app.dto.notifications;

import com.example.app.entity.Notification;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationPriority;
import com.example.app.entity.enums.NotificationRelatedEntity;
import com.example.app.entity.enums.NotificationType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationCategory category;
    private NotificationPriority priority;
    private NotificationRelatedEntity relatedEntityType;
    private String relatedEntityId;
    private boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private String createdBy;
    private String actorUserId;
    private String actorNameSnapshot;
    private String actorRoleSnapshot;
    private String metadataJson;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .category(n.getCategory())
                .priority(n.getPriority())
                .relatedEntityType(n.getRelatedEntityType())
                .relatedEntityId(n.getRelatedEntityId())
                .read(n.isRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .createdBy(n.getCreatedBy())
                .actorUserId(n.getActorUserId())
                .actorNameSnapshot(n.getActorNameSnapshot())
                .actorRoleSnapshot(n.getActorRoleSnapshot())
                .metadataJson(n.getMetadataJson())
                .build();
    }
}

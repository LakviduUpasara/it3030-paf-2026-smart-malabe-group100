package com.example.app.notifications.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationRecipientDto {
    String userId;
    String appRole;
    String userRole;
    String name;
    String primaryEmail;
    String optionalEmail;
}

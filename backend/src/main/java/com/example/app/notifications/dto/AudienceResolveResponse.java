package com.example.app.notifications.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AudienceResolveResponse {
    List<NotificationRecipientDto> recipients;
    int total;
}

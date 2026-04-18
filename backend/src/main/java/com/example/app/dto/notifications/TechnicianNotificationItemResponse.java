package com.example.app.dto.notifications;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianNotificationItemResponse {

    private String id;
    private String title;
    private String message;
    private String publishedAt;
    private boolean read;
}

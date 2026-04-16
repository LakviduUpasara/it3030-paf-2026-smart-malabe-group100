package com.example.app.notifications.dto;

import java.util.List;
import lombok.Data;

@Data
public class NotificationEmailRequest {

    private List<String> toEmails;
    private String subject;
    private String htmlBody;
}

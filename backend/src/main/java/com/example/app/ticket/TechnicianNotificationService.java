package com.example.app.ticket;

import com.example.app.dto.notifications.MarkNotificationsReadRequest;
import com.example.app.dto.notifications.TechnicianNotificationSummaryResponse;
import com.example.app.security.AuthenticatedUser;

public interface TechnicianNotificationService {

    TechnicianNotificationSummaryResponse loadSummary(AuthenticatedUser technician);

    void markRead(AuthenticatedUser technician, MarkNotificationsReadRequest request);
}

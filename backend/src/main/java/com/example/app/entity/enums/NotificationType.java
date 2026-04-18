package com.example.app.entity.enums;

/** Business event that produced a notification. Stored on the notification document. */
public enum NotificationType {
    BOOKING_CREATED,
    BOOKING_APPROVED,
    BOOKING_REJECTED,
    TICKET_CREATED,
    TICKET_ASSIGNED,
    TICKET_STATUS_CHANGED,
    TICKET_RESOLVED,
    TICKET_COMMENTED,
    ADMIN_BROADCAST,
    SYSTEM
}

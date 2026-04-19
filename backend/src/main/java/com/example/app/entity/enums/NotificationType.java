package com.example.app.entity.enums;

/** Business event that produced a notification. Stored on the notification document. */
public enum NotificationType {
    BOOKING_CREATED,
    BOOKING_APPROVED,
    BOOKING_REJECTED,
    TICKET_CREATED,
    TICKET_ASSIGNED,
    TICKET_STATUS_CHANGED,
    TICKET_COMMENTED,
    TICKET_RESOLVED,
    TICKET_ASSIGNMENT_ACCEPTED,
    TICKET_ASSIGNMENT_REJECTED,
    TICKET_WITHDRAWN_BY_USER,
    ADMIN_BROADCAST,
    SYSTEM
}

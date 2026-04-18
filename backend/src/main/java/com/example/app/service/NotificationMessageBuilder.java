package com.example.app.service;

import com.example.app.entity.Booking;
import com.example.app.entity.IncidentTicket;
import com.example.app.entity.Resource;
import com.example.app.entity.TicketProgressNote;
import com.example.app.entity.UserAccount;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Builds the user-facing title and body text for every automatic notification.
 *
 * <p>Centralising this here keeps trigger sites (BookingServiceImpl, IncidentTicketServiceImpl)
 * short and guarantees consistent wording across the system.
 */
@Component
public class NotificationMessageBuilder {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    // ---------------------------------------------------------------- Booking

    public Text bookingCreated(Booking booking, Resource resource, UserAccount requester) {
        String rn = resourceName(resource, booking);
        String who = safeName(requester);
        String when = dateRange(booking.getStartTime(), booking.getEndTime());
        String purpose = notBlank(booking.getPurpose()) ? " Purpose: " + booking.getPurpose() + "." : "";
        return new Text(
                "New booking request",
                "A new booking request has been submitted for " + rn + " on " + when
                        + " by " + who + "." + purpose);
    }

    public Text bookingApproved(Booking booking, Resource resource, UserAccount actor) {
        String rn = resourceName(resource, booking);
        String when = dateRange(booking.getStartTime(), booking.getEndTime());
        String actorText = actorLabel(actor, "Admin");
        String purpose = notBlank(booking.getPurpose()) ? " Purpose: " + booking.getPurpose() + "." : "";
        return new Text(
                "Booking approved",
                "Your booking request for " + rn + " on " + when + " has been approved by " + actorText
                        + "." + purpose);
    }

    public Text bookingRejected(Booking booking, Resource resource, UserAccount actor, String reason) {
        String rn = resourceName(resource, booking);
        String when = dateRange(booking.getStartTime(), booking.getEndTime());
        String actorText = actorLabel(actor, "Admin");
        String reasonText = notBlank(reason) ? " Reason: " + reason.trim() : "";
        return new Text(
                "Booking rejected",
                "Your booking request for " + rn + " on " + when + " has been rejected by " + actorText
                        + "." + reasonText);
    }

    // ---------------------------------------------------------------- Ticket

    public Text ticketCreated(IncidentTicket ticket, UserAccount reporter) {
        String who = safeName(reporter);
        String subject = ticketSubject(ticket);
        return new Text(
                "New incident ticket",
                "A new ticket " + ticket.getReference() + " for " + subject
                        + " was submitted by " + who + ".");
    }

    public Text ticketAssigned(IncidentTicket ticket, UserAccount assignee, UserAccount actor) {
        String subject = ticketSubject(ticket);
        String actorText = actorLabel(actor, "Admin");
        return new Text(
                "Ticket assigned to you",
                "You have been assigned to ticket " + ticket.getReference() + " for " + subject
                        + " by " + actorText + ".");
    }

    public Text ticketStatusChanged(
            IncidentTicket ticket, String previousStatus, UserAccount actor) {
        String subject = ticketSubject(ticket);
        String actorText = actorLabel(actor, "the service desk");
        String from = notBlank(previousStatus) ? previousStatus : "—";
        return new Text(
                "Ticket status updated",
                "Your ticket " + ticket.getReference() + " for " + subject
                        + " has been updated from " + from + " to " + ticket.getStatus() + " by " + actorText + ".");
    }

    public Text ticketResolved(IncidentTicket ticket, UserAccount actor) {
        String subject = ticketSubject(ticket);
        String actorText = actorLabel(actor, "the service desk");
        String res = notBlank(ticket.getResolutionNotes())
                ? " Resolution note: " + ticket.getResolutionNotes().trim()
                : "";
        return new Text(
                "Ticket resolved",
                "Your ticket " + ticket.getReference() + " for " + subject
                        + " has been marked as RESOLVED by " + actorText + "." + res);
    }

    public Text ticketCommented(
            IncidentTicket ticket, TicketProgressNote note, UserAccount actor, boolean forTechnician) {
        String subject = ticketSubject(ticket);
        String actorText = actorLabel(actor, "A user");
        String quote = note != null && notBlank(note.getContent())
                ? " '" + truncate(note.getContent(), 240) + "'"
                : "";
        String audience = forTechnician ? "an assigned ticket" : "your ticket";
        return new Text(
                "New comment on " + (forTechnician ? "assigned ticket" : "your ticket"),
                actorText + " added a new comment to " + audience + " " + ticket.getReference()
                        + " for " + subject + ":" + quote);
    }

    // ---------------------------------------------------------------- helpers

    private static String dateRange(LocalDateTime start, LocalDateTime end) {
        if (start == null && end == null) {
            return "the requested window";
        }
        if (start != null && end != null) {
            boolean sameDay = start.toLocalDate().equals(end.toLocalDate());
            if (sameDay) {
                return start.format(DATE_FMT) + " from " + start.format(TIME_FMT)
                        + " to " + end.format(TIME_FMT);
            }
            return start.format(DATE_FMT) + " " + start.format(TIME_FMT)
                    + " → " + end.format(DATE_FMT) + " " + end.format(TIME_FMT);
        }
        return (start != null ? start.format(DATE_FMT) : end.format(DATE_FMT));
    }

    private static String resourceName(Resource resource, Booking booking) {
        if (resource != null && notBlank(resource.getName())) {
            return resource.getName();
        }
        return booking != null && notBlank(booking.getResourceId())
                ? "resource " + booking.getResourceId()
                : "the requested resource";
    }

    private static String ticketSubject(IncidentTicket ticket) {
        if (ticket == null) {
            return "an incident";
        }
        String title = notBlank(ticket.getTitle()) ? ticket.getTitle() : "an incident";
        if (notBlank(ticket.getLocation())) {
            return title + " (" + ticket.getLocation().trim() + ")";
        }
        return title;
    }

    private static String actorLabel(UserAccount actor, String fallback) {
        if (actor == null) {
            return fallback;
        }
        String name = safeName(actor);
        String role = actor.getRole() != null ? formatRole(actor.getRole().name()) : null;
        if (notBlank(role) && !"fallback".equalsIgnoreCase(role)) {
            return role + " " + name;
        }
        return name;
    }

    private static String formatRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return null;
        }
        String lower = roleName.toLowerCase(Locale.ENGLISH).replace('_', ' ');
        StringBuilder sb = new StringBuilder(lower.length());
        boolean upper = true;
        for (char c : lower.toCharArray()) {
            sb.append(upper ? Character.toUpperCase(c) : c);
            upper = c == ' ';
        }
        return sb.toString();
    }

    private static String safeName(UserAccount user) {
        if (user == null) {
            return "a user";
        }
        if (notBlank(user.getFullName())) {
            return user.getFullName();
        }
        return notBlank(user.getEmail()) ? user.getEmail() : "a user";
    }

    private static boolean notBlank(String v) {
        return v != null && !v.trim().isEmpty();
    }

    private static String truncate(String v, int max) {
        if (v == null) {
            return "";
        }
        String t = v.trim();
        return t.length() <= max ? t : t.substring(0, max - 1) + "…";
    }

    /** Tiny value object so service code can write {@code var text = builder.bookingApproved(...)} */
    public record Text(String title, String message) {}
}

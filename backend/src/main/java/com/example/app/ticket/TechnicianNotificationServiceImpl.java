package com.example.app.ticket;

import com.example.app.dto.notifications.MarkNotificationsReadRequest;
import com.example.app.dto.notifications.TechnicianNotificationItemResponse;
import com.example.app.dto.notifications.TechnicianNotificationSummaryResponse;
import com.example.app.entity.NotificationReadReceipt;
import com.example.app.notifications.PortalDataService;
import com.example.app.repository.NotificationReadReceiptRepository;
import com.example.app.security.AuthenticatedUser;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TechnicianNotificationServiceImpl implements TechnicianNotificationService {

    private static final String NOTIFICATION_FEED_KEY = "notification-feed";

    private final PortalDataService portalDataService;
    private final NotificationReadReceiptRepository notificationReadReceiptRepository;

    @Override
    public TechnicianNotificationSummaryResponse loadSummary(AuthenticatedUser technician) {
        JsonNode root = portalDataService.get(NOTIFICATION_FEED_KEY);
        List<TechnicianNotificationItemResponse> items = new ArrayList<>();
        if (!root.isArray()) {
            return TechnicianNotificationSummaryResponse.builder().unreadCount(0).items(List.of()).build();
        }

        List<String> visibleIds = new ArrayList<>();
        for (JsonNode node : root) {
            if (!isVisibleToTechnician(node, technician.getUserId())) {
                continue;
            }
            String id = textOrEmpty(node, "id");
            if (id.isEmpty()) {
                continue;
            }
            visibleIds.add(id);
            String title = textOrEmpty(node, "title");
            String message = textOrEmpty(node, "message");
            String time = firstNonEmpty(textOrEmpty(node, "time"), textOrEmpty(node, "publishedAt"));
            items.add(
                    TechnicianNotificationItemResponse.builder()
                            .id(id)
                            .title(title)
                            .message(message)
                            .publishedAt(time)
                            .read(false)
                            .build()
            );
        }

        if (visibleIds.isEmpty()) {
            return TechnicianNotificationSummaryResponse.builder().unreadCount(0).items(items).build();
        }

        List<NotificationReadReceipt> receipts =
                notificationReadReceiptRepository.findByUserIdAndFeedItemIdIn(technician.getUserId(), visibleIds);
        Set<String> readIds = new HashSet<>();
        for (NotificationReadReceipt r : receipts) {
            readIds.add(r.getFeedItemId());
        }

        int unread = 0;
        for (TechnicianNotificationItemResponse it : items) {
            boolean read = readIds.contains(it.getId());
            it.setRead(read);
            if (!read) {
                unread++;
            }
        }

        return TechnicianNotificationSummaryResponse.builder().unreadCount(unread).items(items).build();
    }

    @Override
    public void markRead(AuthenticatedUser technician, MarkNotificationsReadRequest request) {
        Instant now = Instant.now();
        for (String rawId : request.getFeedItemIds()) {
            if (rawId == null || rawId.isBlank()) {
                continue;
            }
            String feedItemId = rawId.trim();
            String docId = technician.getUserId() + ":" + feedItemId;
            notificationReadReceiptRepository.save(
                    NotificationReadReceipt.builder()
                            .id(docId)
                            .userId(technician.getUserId())
                            .feedItemId(feedItemId)
                            .readAt(now)
                            .build()
            );
        }
    }

    private boolean isVisibleToTechnician(JsonNode item, String userId) {
        if (!item.has("audience") || item.get("audience").isNull()) {
            return true;
        }
        JsonNode aud = item.get("audience");

        if (aud.has("recipientUserIds") && aud.get("recipientUserIds").isArray()) {
            int n = 0;
            for (JsonNode idNode : aud.get("recipientUserIds")) {
                n++;
                if (userId.equals(idNode.asText())) {
                    return true;
                }
            }
            if (n > 0) {
                return false;
            }
        }

        if (!aud.has("roles") || !aud.get("roles").isArray() || aud.get("roles").isEmpty()) {
            return true;
        }

        for (JsonNode r : aud.get("roles")) {
            if ("TECHNICIAN".equalsIgnoreCase(r.asText())) {
                return true;
            }
        }
        return false;
    }

    private static String textOrEmpty(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return "";
        }
        return node.get(field).asText("");
    }

    private static String firstNonEmpty(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        return b != null ? b : "";
    }
}

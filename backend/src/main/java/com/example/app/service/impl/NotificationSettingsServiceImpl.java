package com.example.app.service.impl;

import com.example.app.dto.notifications.NotificationSettingsResponse;
import com.example.app.dto.notifications.NotificationSettingsUpdateRequest;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationChannel;
import com.example.app.notifications.PortalDataService;
import com.example.app.service.NotificationSettingsService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationSettingsServiceImpl implements NotificationSettingsService {

    private static final String KEY = "system.notification.settings";

    private final PortalDataService portalDataService;
    private final ObjectMapper objectMapper;

    @Override
    public NotificationSettingsResponse get() {
        JsonNode node = portalDataService.get(KEY);
        return NotificationSettingsResponse.builder()
                .webEnabled(readBool(node, "webEnabled", true))
                .emailEnabled(readBool(node, "emailEnabled", true))
                .browserPushSupported(readBool(node, "browserPushSupported", true))
                .bookingCategoryEnabled(readBool(node, "bookingCategoryEnabled", true))
                .ticketCategoryEnabled(readBool(node, "ticketCategoryEnabled", true))
                .systemCategoryEnabled(readBool(node, "systemCategoryEnabled", true))
                .build();
    }

    @Override
    public NotificationSettingsResponse update(NotificationSettingsUpdateRequest request) {
        NotificationSettingsResponse current = get();
        if (request.getWebEnabled() != null) {
            current.setWebEnabled(request.getWebEnabled());
        }
        if (request.getEmailEnabled() != null) {
            current.setEmailEnabled(request.getEmailEnabled());
        }
        if (request.getBrowserPushSupported() != null) {
            current.setBrowserPushSupported(request.getBrowserPushSupported());
        }
        if (request.getBookingCategoryEnabled() != null) {
            current.setBookingCategoryEnabled(request.getBookingCategoryEnabled());
        }
        if (request.getTicketCategoryEnabled() != null) {
            current.setTicketCategoryEnabled(request.getTicketCategoryEnabled());
        }
        if (request.getSystemCategoryEnabled() != null) {
            current.setSystemCategoryEnabled(request.getSystemCategoryEnabled());
        }

        ObjectNode node = objectMapper.createObjectNode();
        node.put("webEnabled", current.isWebEnabled());
        node.put("emailEnabled", current.isEmailEnabled());
        node.put("browserPushSupported", current.isBrowserPushSupported());
        node.put("bookingCategoryEnabled", current.isBookingCategoryEnabled());
        node.put("ticketCategoryEnabled", current.isTicketCategoryEnabled());
        node.put("systemCategoryEnabled", current.isSystemCategoryEnabled());
        portalDataService.put(KEY, node);

        return current;
    }

    @Override
    public boolean isChannelEnabled(NotificationChannel channel) {
        if (channel == null) {
            return false;
        }
        NotificationSettingsResponse s = get();
        return switch (channel) {
            case WEB -> s.isWebEnabled();
            case EMAIL -> s.isEmailEnabled();
            case BOTH -> s.isWebEnabled() || s.isEmailEnabled();
        };
    }

    @Override
    public boolean isCategoryEnabled(NotificationCategory category) {
        if (category == null) {
            return true;
        }
        NotificationSettingsResponse s = get();
        return switch (category) {
            case BOOKING -> s.isBookingCategoryEnabled();
            case TICKET -> s.isTicketCategoryEnabled();
            case SYSTEM -> s.isSystemCategoryEnabled();
        };
    }

    private static boolean readBool(JsonNode node, String field, boolean defaultValue) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return defaultValue;
        }
        return node.get(field).asBoolean(defaultValue);
    }
}

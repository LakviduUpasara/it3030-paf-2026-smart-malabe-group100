package com.example.app.service;

import com.example.app.dto.notifications.NotificationSettingsResponse;
import com.example.app.dto.notifications.NotificationSettingsUpdateRequest;
import com.example.app.entity.enums.NotificationCategory;
import com.example.app.entity.enums.NotificationChannel;

/** Thin wrapper around PortalDataService for the {@code system.notification.settings} document. */
public interface NotificationSettingsService {

    NotificationSettingsResponse get();

    NotificationSettingsResponse update(NotificationSettingsUpdateRequest request);

    /** True when the given channel is globally enabled. */
    boolean isChannelEnabled(NotificationChannel channel);

    /** True when the given category is enabled at the system level. */
    boolean isCategoryEnabled(NotificationCategory category);
}

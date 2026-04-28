package com.example.app.dto.notifications;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsResponse {

    @Builder.Default
    private boolean webEnabled = true;

    @Builder.Default
    private boolean emailEnabled = true;

    @Builder.Default
    private boolean browserPushSupported = true;

    @Builder.Default
    private boolean bookingCategoryEnabled = true;

    @Builder.Default
    private boolean ticketCategoryEnabled = true;

    @Builder.Default
    private boolean systemCategoryEnabled = true;
}

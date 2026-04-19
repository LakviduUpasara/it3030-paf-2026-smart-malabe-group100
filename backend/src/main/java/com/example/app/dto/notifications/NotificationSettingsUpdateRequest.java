package com.example.app.dto.notifications;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Partial update — any field left {@code null} keeps the stored value.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsUpdateRequest {

    private Boolean webEnabled;
    private Boolean emailEnabled;
    private Boolean browserPushSupported;
    private Boolean bookingCategoryEnabled;
    private Boolean ticketCategoryEnabled;
    private Boolean systemCategoryEnabled;
}

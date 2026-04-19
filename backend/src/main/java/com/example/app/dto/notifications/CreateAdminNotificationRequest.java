package com.example.app.dto.notifications;

import com.example.app.entity.enums.NotificationChannel;
import com.example.app.entity.enums.NotificationPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Admin-console request to fan out a manual notification to one or more role groups.
 * Audience is restricted to ADMIN / USER / TECHNICIAN — the three main role targets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdminNotificationRequest {

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Size(max = 4000)
    private String message;

    /**
     * Must contain at least one of {@code ADMIN}, {@code USER}, {@code TECHNICIAN}.
     * Any other values are rejected at the service layer with 400.
     */
    @NotEmpty
    private List<String> audienceRoles;

    @Builder.Default
    private NotificationChannel channel = NotificationChannel.WEB;

    @Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;
}

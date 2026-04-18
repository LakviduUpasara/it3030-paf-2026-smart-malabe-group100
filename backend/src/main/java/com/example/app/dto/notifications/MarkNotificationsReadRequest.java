package com.example.app.dto.notifications;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class MarkNotificationsReadRequest {

    @NotEmpty(message = "At least one notification id is required.")
    private List<String> feedItemIds;
}

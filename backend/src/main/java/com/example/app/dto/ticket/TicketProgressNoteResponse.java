package com.example.app.dto.ticket;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketProgressNoteResponse {

    private String id;
    private String content;
    private String authorUserId;
    private String authorDisplayName;
    private LocalDateTime createdAt;
}

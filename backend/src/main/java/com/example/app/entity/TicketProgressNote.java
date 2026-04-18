package com.example.app.entity;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketProgressNote {

    private String id;

    private String content;

    private String authorUserId;

    private String authorDisplayName;

    private LocalDateTime createdAt;
}

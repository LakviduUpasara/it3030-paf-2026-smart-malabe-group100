package com.example.app.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CampusMessageResponse {

    private Long id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
}


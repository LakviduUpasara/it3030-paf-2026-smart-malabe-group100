package com.example.app.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusMessageResponse {

    private String id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
}


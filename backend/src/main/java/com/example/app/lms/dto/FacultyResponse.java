package com.example.app.lms.dto;

import com.example.app.lms.enums.FacultyStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class FacultyResponse {

    String code;
    String name;
    FacultyStatus status;
    boolean deleted;
    Instant createdAt;
    Instant updatedAt;
}

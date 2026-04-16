package com.example.app.lms.dto;

import com.example.app.lms.enums.DegreeProgramLifecycleStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class DegreeProgramResponse {

    String code;
    String name;
    String facultyCode;
    String award;
    int credits;
    int durationYears;
    DegreeProgramLifecycleStatus status;
    Instant createdAt;
    Instant updatedAt;
}

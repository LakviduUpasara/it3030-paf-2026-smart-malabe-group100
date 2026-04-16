package com.example.app.registration.dto;

import java.time.Instant;
import java.time.LocalDate;
import lombok.Data;

@Data
public class TermScheduleRowDto {

    private String termCode;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer weeks;

    private Integer notifyBeforeDays;

    private Boolean isManuallyCustomized;

    private Instant notificationSentAt;
}

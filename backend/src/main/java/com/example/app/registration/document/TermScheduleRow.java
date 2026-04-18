package com.example.app.registration.document;

import java.time.Instant;
import java.time.LocalDate;
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
public class TermScheduleRow {

    private String termCode;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private Integer weeks = 16;

    @Builder.Default
    private Integer notifyBeforeDays = 3;

    @Builder.Default
    private Boolean isManuallyCustomized = false;

    private Instant notificationSentAt;
}

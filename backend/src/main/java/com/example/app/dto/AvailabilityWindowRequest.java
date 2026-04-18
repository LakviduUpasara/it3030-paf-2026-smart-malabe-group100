package com.example.app.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AvailabilityWindowRequest {

    /**
     * ISO calendar day used to derive {@link #dayOfWeek} on the server. Optional if {@code dayOfWeek} is set.
     * When both are set, they must match (same ISO weekday).
     */
    private LocalDate anchorDate;

    /** Required unless {@link #anchorDate} is provided (then derived server-side). */
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @AssertTrue(message = "Provide dayOfWeek and/or anchorDate for each window")
    public boolean isDaySpecified() {
        return dayOfWeek != null || anchorDate != null;
    }

    @AssertTrue(message = "End time must be after start time")
    public boolean isEndTimeAfterStartTime() {
        if (startTime == null || endTime == null) {
            return true;
        }

        return endTime.isAfter(startTime);
    }
}

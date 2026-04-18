package com.example.app.registration.dto;

import com.example.app.registration.document.TermScheduleRow;
import com.example.app.registration.enums.IntakeBatchStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IntakeApiResponse {

    private final String id;

    @JsonProperty("_id")
    private final String underscoreId;

    private final String name;
    private final String facultyCode;
    private final String degreeCode;
    private final Integer intakeYear;
    private final String intakeMonth;

    @JsonProperty("stream")
    private final String cohortStream;

    private final IntakeBatchStatus status;
    private final String currentTerm;

    @Getter(AccessLevel.NONE)
    private final Boolean autoJumpEnabled;

    @JsonProperty("autoJump")
    public Boolean getAutoJump() {
        return autoJumpEnabled;
    }

    private final Boolean lockPastTerms;
    private final Integer defaultWeeksPerTerm;
    private final Integer defaultNotifyBeforeDays;
    private final Boolean autoGenerateFutureTerms;

    private final List<TermScheduleRow> schedules;
    private final List<TermScheduleRow> termSchedules;

    private final String studentIdPrefix;
    private final Instant createdAt;
    private final Instant updatedAt;
}

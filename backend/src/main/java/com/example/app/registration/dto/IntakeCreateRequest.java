package com.example.app.registration.dto;

import com.example.app.registration.enums.IntakeBatchStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.List;
import lombok.Data;

@Data
public class IntakeCreateRequest {

    private String name;
    private String stream;
    private String facultyCode;
    private String degreeCode;
    private Integer intakeYear;
    private String intakeMonth;
    private IntakeBatchStatus status;

    private Boolean autoGenerateTerms;
    private Boolean autoGenerateFutureTerms;
    private Boolean recalculateFutureTerms;
    private Boolean autoJumpEnabled;
    private Boolean lockPastTerms;
    private Integer defaultWeeksPerTerm;
    private Integer defaultNotifyBeforeDays;

    @JsonAlias("schedules")
    private List<TermScheduleRowDto> termSchedules;
}

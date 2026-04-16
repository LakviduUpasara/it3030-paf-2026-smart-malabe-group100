package com.example.app.registration.dto;

import com.example.app.registration.enums.IntakeBatchStatus;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class IntakeSummaryResponse {
    String id;
    String facultyCode;
    String degreeCode;
    String name;
    String label;
    Integer intakeYear;
    String intakeMonth;
    String studentIdPrefix;
    IntakeBatchStatus status;
}

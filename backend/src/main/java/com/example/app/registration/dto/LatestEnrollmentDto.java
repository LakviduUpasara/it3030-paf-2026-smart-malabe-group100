package com.example.app.registration.dto;

import com.example.app.registration.enums.StudentStream;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LatestEnrollmentDto {
    String facultyCode;
    String facultyName;
    String degreeCode;
    String degreeName;
    String intakeId;
    String intakeLabel;
    String currentTerm;
    StudentStream stream;
    String subgroup;
}

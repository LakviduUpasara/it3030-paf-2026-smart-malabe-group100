package com.example.app.lms.dto;

import com.example.app.lms.enums.DegreeProgramLifecycleStatus;
import lombok.Data;

@Data
public class DegreeProgramCreateRequest {

    private String code;
    private String name;
    private String facultyCode;
    private String award;
    private Integer credits;
    private Integer durationYears;
    private DegreeProgramLifecycleStatus status;
}

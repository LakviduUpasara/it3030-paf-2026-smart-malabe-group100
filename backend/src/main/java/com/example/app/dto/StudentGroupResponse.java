package com.example.app.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentGroupResponse {

    private Long id;
    private String code;
    private Long degreeProgramId;
    private String degreeProgramCode;
    private String degreeProgramName;
    private Long semesterId;
    private Integer semesterYearNumber;
    private Integer semesterSemesterNumber;
    private Integer batchYear;
    private Integer groupSize;
    private Boolean active;
}

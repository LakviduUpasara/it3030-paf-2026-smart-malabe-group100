package com.example.app.dto;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SemesterResponse {

    private Long id;
    private Long degreeProgramId;
    private String degreeProgramCode;
    private String degreeProgramName;
    private Integer yearNumber;
    private Integer semesterNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean active;
}

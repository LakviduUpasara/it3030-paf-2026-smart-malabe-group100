package com.example.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SemesterRequest {

    @NotNull(message = "Degree program id is required")
    private Long degreeProgramId;

    @NotNull(message = "Year number is required")
    @Min(value = 1, message = "Year number must be at least 1")
    private Integer yearNumber;

    @NotNull(message = "Semester number is required")
    @Min(value = 1, message = "Semester number must be at least 1")
    private Integer semesterNumber;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Boolean active;
}

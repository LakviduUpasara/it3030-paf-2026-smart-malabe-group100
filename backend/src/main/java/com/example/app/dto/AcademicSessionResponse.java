package com.example.app.dto;

import com.example.app.entity.ResourceType;
import com.example.app.entity.SessionStatus;
import com.example.app.entity.SessionType;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AcademicSessionResponse {

    private Long id;
    private Long moduleOfferingId;
    private Long academicModuleId;
    private String academicModuleCode;
    private String academicModuleTitle;
    private String academicYearLabel;
    private Long semesterId;
    private Integer semesterYearNumber;
    private Integer semesterSemesterNumber;
    private Long degreeProgramId;
    private String degreeProgramCode;
    private String degreeProgramName;
    private Long studentGroupId;
    private String studentGroupCode;
    private Integer studentGroupSize;
    private Long resourceId;
    private String resourceName;
    private ResourceType resourceType;
    private String resourceLocation;
    private Integer resourceCapacity;
    private SessionType sessionType;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String title;
    private String notes;
    private SessionStatus status;
    private Boolean active;
}

package com.example.app.dto;

import com.example.app.entity.ModuleOfferingStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModuleOfferingResponse {

    private Long id;
    private Long academicModuleId;
    private String academicModuleCode;
    private String academicModuleTitle;
    private Long semesterId;
    private Long degreeProgramId;
    private String degreeProgramCode;
    private Integer yearNumber;
    private Integer semesterNumber;
    private String academicYearLabel;
    private String coordinatorName;
    private ModuleOfferingStatus status;
    private Boolean active;
}

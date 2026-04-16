package com.example.app.lms.dto;

import com.example.app.lms.enums.LmsOfferingStatus;
import com.example.app.lms.enums.SyllabusVersion;
import java.util.List;
import lombok.Data;

@Data
public class LmsModuleOfferingWriteRequest {

    private String facultyCode;
    private String facultyId;

    private String degreeCode;
    private String degreeProgramId;

    private String intakeId;
    private String intakeName;

    private String termCode;

    private String moduleId;
    private String moduleCode;

    private SyllabusVersion syllabusVersion;

    private LmsOfferingStatus status;

    private List<String> assignedLecturerIds;
    private List<AssigneeIdRef> assignedLecturers;

    private List<String> assignedLabAssistantIds;
    private List<AssigneeIdRef> assignedLabAssistants;
}

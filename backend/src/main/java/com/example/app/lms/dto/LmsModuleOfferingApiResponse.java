package com.example.app.lms.dto;

import com.example.app.lms.document.OfferingOutlineWeek;
import com.example.app.lms.document.StaffAssigneeSnapshot;
import com.example.app.lms.enums.LmsOfferingStatus;
import com.example.app.lms.enums.SyllabusVersion;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LmsModuleOfferingApiResponse {

    String id;
    Ref faculty;
    Ref degree;
    IntakeRef intake;
    ModuleRef module;
    String termCode;
    SyllabusVersion syllabusVersion;
    LmsOfferingStatus status;
    List<StaffAssigneeSnapshot> lecturers;
    List<StaffAssigneeSnapshot> labAssistants;
    List<OfferingOutlineWeek> outlineWeeks;
    boolean outlinePending;
    boolean hasGrades;
    boolean hasAttendance;
    boolean hasContent;
    Instant updatedAt;
    Instant createdAt;

    @Value
    @Builder
    public static class Ref {
        String code;
        String name;
    }

    @Value
    @Builder
    public static class IntakeRef {
        String id;
        String name;
    }

    @Value
    @Builder
    public static class ModuleRef {
        String id;
        String code;
        String name;
    }
}

package com.example.app.lms.document;

import com.example.app.lms.enums.LmsOfferingStatus;
import com.example.app.lms.enums.SyllabusVersion;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "lms_module_offerings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(
        name = "intake_term_module_active",
        def = "{'intakeId': 1, 'termCode': 1, 'moduleCode': 1, 'deleted': 1}")
public class LmsModuleOffering {

    @Id
    private String id;

    private String facultyCode;

    private String degreeCode;

    private String intakeId;

    private String intakeName;

    private String termCode;

    /** Catalog module id (same as code in this project). */
    private String moduleId;

    private String moduleCode;

    private String moduleName;

    @Builder.Default
    private SyllabusVersion syllabusVersion = SyllabusVersion.NEW;

    @Builder.Default
    private LmsOfferingStatus status = LmsOfferingStatus.ACTIVE;

    @Builder.Default
    private List<String> assignedLecturerIds = new ArrayList<>();

    @Builder.Default
    private List<String> assignedLabAssistantIds = new ArrayList<>();

    @Builder.Default
    private List<StaffAssigneeSnapshot> assignedLecturers = new ArrayList<>();

    @Builder.Default
    private List<StaffAssigneeSnapshot> assignedLabAssistants = new ArrayList<>();

    @Builder.Default
    private List<OfferingOutlineWeek> outlineWeeks = new ArrayList<>();

    @Builder.Default
    private boolean outlinePending = true;

    @Builder.Default
    private boolean hasGrades = false;

    @Builder.Default
    private boolean hasAttendance = false;

    @Builder.Default
    private boolean hasContent = false;

    @Builder.Default
    private boolean deleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

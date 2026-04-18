package com.example.app.lms.document;

import com.example.app.lms.enums.DegreeProgramLifecycleStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lms_degree_programs")
@CompoundIndex(name = "faculty_status", def = "{'facultyCode': 1, 'status': 1}")
@CompoundIndex(name = "isDeleted_updatedAt", def = "{'isDeleted': 1, 'updatedAt': -1}")
public class LmsDegreeProgram {

    @Id
    private String code;

    private String name;

    @Indexed
    private String facultyCode;

    private String award;

    private int credits;

    private int durationYears;

    @Builder.Default
    private DegreeProgramLifecycleStatus status = DegreeProgramLifecycleStatus.DRAFT;

    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

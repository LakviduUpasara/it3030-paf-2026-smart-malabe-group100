package com.example.app.registration.document;

import com.example.app.entity.enums.AccountStatus;
import com.example.app.registration.enums.StudentStream;
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
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "enrollments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(
        name = "intake_faculty_degree_stream_subgroup",
        def = "{'intakeId': 1, 'facultyId': 1, 'degreeProgramId': 1, 'stream': 1, 'subgroup': 1}")
public class Enrollment {

    @Id
    private String id;

    /** Mongo id of {@link com.example.app.registration.document.Student}. */
    private String studentProfileId;

    private String facultyId;

    private String degreeProgramId;

    private String intakeId;

    private StudentStream stream;

    private String subgroup;

    @Builder.Default
    private AccountStatus enrollmentStatus = AccountStatus.ACTIVE;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

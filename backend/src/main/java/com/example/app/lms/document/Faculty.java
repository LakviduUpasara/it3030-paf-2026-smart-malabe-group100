package com.example.app.lms.document;

import com.example.app.lms.enums.FacultyStatus;
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

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "faculties")
@CompoundIndex(name = "isDeleted_updatedAt", def = "{'isDeleted': 1, 'updatedAt': -1}")
public class Faculty {

    @Id
    private String code;

    private String name;

    @Builder.Default
    private FacultyStatus status = FacultyStatus.ACTIVE;

    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

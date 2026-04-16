package com.example.app.lms.document;

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
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "catalog_modules")
public class CatalogModule {

    @Id
    private String code;

    private String name;

    @Indexed
    private String facultyCode;

    @Builder.Default
    private int credits = 1;

    @Builder.Default
    private List<String> applicableTerms = new ArrayList<>();

    @Builder.Default
    private List<String> applicableDegrees = new ArrayList<>();

    private SyllabusVersion defaultSyllabusVersion;

    @Builder.Default
    private List<OutlineWeek> outlineTemplate = new ArrayList<>();

    @Builder.Default
    private boolean isDeleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}

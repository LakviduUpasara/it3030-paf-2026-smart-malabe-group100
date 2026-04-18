package com.example.app.lms.dto;

import com.example.app.lms.enums.SyllabusVersion;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CatalogModuleResponse {

    String code;
    String name;
    int credits;
    String facultyCode;
    List<String> applicableTerms;
    List<String> applicableDegrees;
    SyllabusVersion defaultSyllabusVersion;
    List<OutlineWeekDto> outlineTemplate;
    Instant createdAt;
    Instant updatedAt;
}

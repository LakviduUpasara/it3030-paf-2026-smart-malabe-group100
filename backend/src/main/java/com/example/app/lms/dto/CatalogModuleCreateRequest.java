package com.example.app.lms.dto;

import com.example.app.lms.enums.SyllabusVersion;
import java.util.List;
import lombok.Data;

@Data
public class CatalogModuleCreateRequest {

    private String code;
    private String name;
    private Integer credits;
    private String facultyCode;
    private List<String> applicableTerms;
    private List<String> applicableDegrees;
    private SyllabusVersion defaultSyllabusVersion;
    private List<OutlineWeekDto> outlineTemplate;
}

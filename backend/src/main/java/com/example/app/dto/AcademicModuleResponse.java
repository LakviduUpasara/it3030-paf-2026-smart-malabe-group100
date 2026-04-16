package com.example.app.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AcademicModuleResponse {

    private Long id;
    private String code;
    private String title;
    private Integer creditValue;
    private String departmentName;
    private Boolean active;
}

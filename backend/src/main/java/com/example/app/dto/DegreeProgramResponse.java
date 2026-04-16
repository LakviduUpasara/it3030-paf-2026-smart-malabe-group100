package com.example.app.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DegreeProgramResponse {

    private Long id;
    private String code;
    private String name;
    private String facultyName;
    private String departmentName;
    private Boolean active;
}

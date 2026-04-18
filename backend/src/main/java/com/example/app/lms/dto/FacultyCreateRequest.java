package com.example.app.lms.dto;

import com.example.app.lms.enums.FacultyStatus;
import lombok.Data;

@Data
public class FacultyCreateRequest {

    private String code;
    private String name;
    private FacultyStatus status;
}

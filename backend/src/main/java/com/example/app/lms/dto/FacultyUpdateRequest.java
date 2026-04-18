package com.example.app.lms.dto;

import com.example.app.lms.enums.FacultyStatus;
import lombok.Data;

@Data
public class FacultyUpdateRequest {

    private String name;
    private FacultyStatus status;
}

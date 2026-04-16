package com.example.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentGroupRequest {

    @NotBlank(message = "Code is required")
    @Size(max = 30, message = "Code must not exceed 30 characters")
    private String code;

    @NotNull(message = "Degree program id is required")
    private Long degreeProgramId;

    @NotNull(message = "Semester id is required")
    private Long semesterId;

    @NotNull(message = "Batch year is required")
    @Min(value = 2000, message = "Batch year must be at least 2000")
    private Integer batchYear;

    @NotNull(message = "Group size is required")
    @Min(value = 1, message = "Group size must be at least 1")
    private Integer groupSize;

    private Boolean active;
}

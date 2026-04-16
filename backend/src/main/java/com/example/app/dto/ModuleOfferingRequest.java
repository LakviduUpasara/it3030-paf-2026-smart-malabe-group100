package com.example.app.dto;

import com.example.app.entity.ModuleOfferingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModuleOfferingRequest {

    @NotNull(message = "Academic module id is required")
    private Long academicModuleId;

    @NotNull(message = "Semester id is required")
    private Long semesterId;

    @NotBlank(message = "Academic year label is required")
    @Size(max = 20, message = "Academic year label must not exceed 20 characters")
    private String academicYearLabel;

    @Size(max = 120, message = "Coordinator name must not exceed 120 characters")
    private String coordinatorName;

    @NotNull(message = "Status is required")
    private ModuleOfferingStatus status;

    private Boolean active;
}

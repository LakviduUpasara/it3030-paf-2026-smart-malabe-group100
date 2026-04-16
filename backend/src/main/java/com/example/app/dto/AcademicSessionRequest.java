package com.example.app.dto;

import com.example.app.entity.SessionStatus;
import com.example.app.entity.SessionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AcademicSessionRequest {

    @NotNull(message = "Module offering id is required")
    private Long moduleOfferingId;

    @NotNull(message = "Student group id is required")
    private Long studentGroupId;

    @NotNull(message = "Resource id is required")
    private Long resourceId;

    @NotNull(message = "Session type is required")
    private SessionType sessionType;

    @NotNull(message = "Session date is required")
    private LocalDate sessionDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @NotNull(message = "Status is required")
    private SessionStatus status;

    private Boolean active;
}

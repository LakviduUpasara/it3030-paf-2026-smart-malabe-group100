package com.example.app.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookingRequest {

    @NotNull(message = "resourceId is required")
    private Long resourceId;

    /** Set by API from the signed-in user; ignored if sent by client. */
    private String userId;

    @NotNull(message = "startTime is required")
    @FutureOrPresent(message = "startTime must be in the present or future")
    private LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    @FutureOrPresent(message = "endTime must be in the present or future")
    private LocalDateTime endTime;

    @NotBlank(message = "purpose is required")
    private String purpose;

    @Min(value = 0, message = "expectedAttendees cannot be negative")
    @Max(value = 50_000, message = "expectedAttendees is unrealistically large")
    private Integer expectedAttendees;
}

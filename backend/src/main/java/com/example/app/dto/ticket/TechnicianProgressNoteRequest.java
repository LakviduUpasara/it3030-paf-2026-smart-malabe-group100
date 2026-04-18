package com.example.app.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TechnicianProgressNoteRequest {

    @NotBlank(message = "Progress update text is required.")
    @Size(max = 4000)
    private String content;
}

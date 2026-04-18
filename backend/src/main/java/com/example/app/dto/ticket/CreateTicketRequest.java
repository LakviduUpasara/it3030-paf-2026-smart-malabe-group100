package com.example.app.dto.ticket;

import com.example.app.entity.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotBlank(message = "Title is required.")
    @Size(max = 200)
    private String title;

    @Size(max = 4000)
    private String description;

    @Size(max = 100)
    private String category;

    @Size(max = 200)
    private String location;

    private TicketPriority priority;
}

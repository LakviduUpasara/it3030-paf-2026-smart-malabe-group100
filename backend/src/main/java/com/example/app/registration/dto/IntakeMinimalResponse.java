package com.example.app.registration.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class IntakeMinimalResponse {
    String id;

    @JsonProperty("_id")
    String underscoreId;

    String name;
    String currentTerm;
}

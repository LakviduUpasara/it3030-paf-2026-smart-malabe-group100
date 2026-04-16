package com.example.app.registration.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class EligibilityCountsDto {
    int faculties;
    int degrees;
    int modules;
}

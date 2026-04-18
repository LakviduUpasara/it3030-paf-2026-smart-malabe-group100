package com.example.app.registration.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SubgroupItemDto {
    String code;
    long count;
}

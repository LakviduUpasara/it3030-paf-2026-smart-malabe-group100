package com.example.app.registration.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PagedIntakeListResponse {
    List<IntakeApiResponse> items;
    int page;
    int pageSize;
    long total;
    long totalCount;
}

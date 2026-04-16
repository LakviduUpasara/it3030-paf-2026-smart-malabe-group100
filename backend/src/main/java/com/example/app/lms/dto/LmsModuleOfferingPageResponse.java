package com.example.app.lms.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LmsModuleOfferingPageResponse {
    List<LmsModuleOfferingApiResponse> items;
    int page;
    int pageSize;
    long total;
}

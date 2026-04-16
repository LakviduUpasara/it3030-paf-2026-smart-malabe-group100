package com.example.app.lms.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PagedResponse<T> {

    List<T> items;
    int page;
    int pageSize;
    long totalCount;
}

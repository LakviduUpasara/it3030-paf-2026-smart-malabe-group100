package com.example.app.registration.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PagedStudentListResponse {
    List<StudentListItemResponse> items;
    long totalElements;
    int totalPages;
    int page;
    int pageSize;
}

package com.example.app.dto;

import com.example.app.entity.ResourceStatus;
import com.example.app.entity.ResourceType;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ResourceResponse {

    private String id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private ResourceStatus status;
    private List<AvailabilityWindowResponse> availabilityWindows;
}

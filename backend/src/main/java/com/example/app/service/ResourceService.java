package com.example.app.service;

import com.example.app.dto.ResourceRequest;
import com.example.app.dto.ResourceResponse;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.ResourceType;
import java.util.List;

public interface ResourceService {

    ResourceResponse createResource(ResourceRequest request);

    List<ResourceResponse> getAllResources(
            ResourceType type,
            ResourceStatus status,
            Integer minCapacity,
            String location);

    ResourceResponse getResourceById(String id);

    ResourceResponse updateResource(String id, ResourceRequest request);

    void deleteResource(String id);
}

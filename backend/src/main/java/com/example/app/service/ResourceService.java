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

    ResourceResponse getResourceById(Long id);

    ResourceResponse updateResource(Long id, ResourceRequest request);

    void deleteResource(Long id);
}

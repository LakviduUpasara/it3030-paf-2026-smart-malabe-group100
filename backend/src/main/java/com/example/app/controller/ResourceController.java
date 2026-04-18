package com.example.app.controller;

import com.example.app.dto.ResourceRequest;
import com.example.app.dto.ResourceResponse;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.ResourceType;
import com.example.app.service.ResourceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse createResource(@Valid @RequestBody ResourceRequest request) {
        return resourceService.createResource(request);
    }

    @GetMapping
    public List<ResourceResponse> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location) {
        return resourceService.getAllResources(type, status, minCapacity, location);
    }

    @GetMapping("/{id}")
    public ResourceResponse getResourceById(@PathVariable Long id) {
        return resourceService.getResourceById(id);
    }

    @PutMapping("/{id}")
    public ResourceResponse updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        return resourceService.updateResource(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
    }
}

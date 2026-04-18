package com.example.app.service;

import com.example.app.dto.AvailabilityWindowRequest;
import com.example.app.dto.AvailabilityWindowResponse;
import com.example.app.dto.ResourceRequest;
import com.example.app.dto.ResourceResponse;
import com.example.app.entity.AvailabilityWindow;
import com.example.app.entity.Resource;
import com.example.app.entity.ResourceStatus;
import com.example.app.entity.ResourceType;
import com.example.app.exception.ResourceNotFoundException;
import com.example.app.repository.ResourceRepository;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    public ResourceResponse createResource(ResourceRequest request) {
        validateAvailabilityWindows(request.getAvailabilityWindows());

        Resource resource = mapToEntity(request);
        Resource savedResource = resourceRepository.save(resource);
        return mapToResponse(savedResource);
    }

    @Override
    public List<ResourceResponse> getAllResources(
            ResourceType type,
            ResourceStatus status,
            Integer minCapacity,
            String location) {

        String normalizedLocation = normalizeText(location);

        List<Resource> resources;
        if (type == null && status == null && minCapacity == null && normalizedLocation == null) {
            resources = resourceRepository.findAll();
        } else {
            resources = resourceRepository.findAllByFilters(type, status, minCapacity, normalizedLocation);
        }

        return resources.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ResourceResponse getResourceById(Long id) {
        Resource resource = findResourceById(id);
        return mapToResponse(resource);
    }

    @Override
    public ResourceResponse updateResource(Long id, ResourceRequest request) {
        validateAvailabilityWindows(request.getAvailabilityWindows());

        Resource resource = findResourceById(id);
        resource.setName(normalizeRequiredText(request.getName()));
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(normalizeRequiredText(request.getLocation()));
        resource.setStatus(request.getStatus());
        resource.setAvailabilityWindows(mapAvailabilityWindows(request.getAvailabilityWindows()));

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    @Override
    public void deleteResource(Long id) {
        Resource resource = findResourceById(id);
        resourceRepository.delete(resource);
    }

    private Resource findResourceById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    private Resource mapToEntity(ResourceRequest request) {
        return Resource.builder()
                .name(normalizeRequiredText(request.getName()))
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(normalizeRequiredText(request.getLocation()))
                .status(request.getStatus())
                .availabilityWindows(mapAvailabilityWindows(request.getAvailabilityWindows()))
                .build();
    }

    private List<AvailabilityWindow> mapAvailabilityWindows(List<AvailabilityWindowRequest> requests) {
        return requests.stream()
                .map(this::mapToAvailabilityWindow)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private AvailabilityWindow mapToAvailabilityWindow(AvailabilityWindowRequest request) {
        return AvailabilityWindow.builder()
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
    }

    private ResourceResponse mapToResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .status(resource.getStatus())
                .availabilityWindows(resource.getAvailabilityWindows()
                        .stream()
                        .map(this::mapToAvailabilityWindowResponse)
                        .toList())
                .build();
    }

    private AvailabilityWindowResponse mapToAvailabilityWindowResponse(AvailabilityWindow availabilityWindow) {
        return AvailabilityWindowResponse.builder()
                .dayOfWeek(availabilityWindow.getDayOfWeek())
                .startTime(availabilityWindow.getStartTime())
                .endTime(availabilityWindow.getEndTime())
                .build();
    }

    private void validateAvailabilityWindows(List<AvailabilityWindowRequest> windows) {
        if (windows == null || windows.isEmpty()) {
            throw new IllegalArgumentException("At least one availability window is required");
        }

        Set<String> uniqueWindows = new HashSet<>();

        for (AvailabilityWindowRequest window : windows) {
            if (window.getDayOfWeek() == null
                    || window.getStartTime() == null
                    || window.getEndTime() == null) {
                throw new IllegalArgumentException(
                        "Availability window day, start time, and end time are required");
            }

            if (!window.getEndTime().isAfter(window.getStartTime())) {
                throw new IllegalArgumentException("Availability window end time must be after start time");
            }

            String uniqueKey = window.getDayOfWeek()
                    + "|" + window.getStartTime()
                    + "|" + window.getEndTime();

            if (!uniqueWindows.add(uniqueKey)) {
                throw new IllegalArgumentException("Duplicate availability windows are not allowed");
            }
        }

        for (int i = 0; i < windows.size(); i++) {
            for (int j = i + 1; j < windows.size(); j++) {
                AvailabilityWindowRequest first = windows.get(i);
                AvailabilityWindowRequest second = windows.get(j);

                if (first.getDayOfWeek() == second.getDayOfWeek() && windowsOverlap(first, second)) {
                    throw new IllegalArgumentException(
                            "Availability windows must not overlap on the same day");
                }
            }
        }
    }

    private boolean windowsOverlap(AvailabilityWindowRequest first, AvailabilityWindowRequest second) {
        return first.getStartTime().isBefore(second.getEndTime())
                && first.getEndTime().isAfter(second.getStartTime());
    }

    /**
     * Derives {@link DayOfWeek} from {@link AvailabilityWindowRequest#getAnchorDate()} when present;
     * rejects mismatches if the client also sent {@code dayOfWeek}.
     */
    private void normalizeAndValidateWindowDays(List<AvailabilityWindowRequest> windows) {
        for (AvailabilityWindowRequest w : windows) {
            if (w.getAnchorDate() != null) {
                DayOfWeek derived = w.getAnchorDate().getDayOfWeek();
                if (w.getDayOfWeek() != null && w.getDayOfWeek() != derived) {
                    throw new IllegalArgumentException(String.format(
                            "dayOfWeek (%s) does not match anchorDate %s (that calendar date is a %s).",
                            w.getDayOfWeek(), w.getAnchorDate(), derived));
                }
                w.setDayOfWeek(derived);
            } else if (w.getDayOfWeek() == null) {
                throw new IllegalArgumentException(
                        "Each availability window must include dayOfWeek and/or anchorDate (calendar day).");
            }
        }
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }
}

package com.example.app.notifications;

import com.example.app.exception.ApiException;
import com.example.app.lms.MongoHealthService;
import com.example.app.notifications.document.PortalDataEntry;
import com.example.app.notifications.repository.PortalDataEntryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PortalDataService {

    private final PortalDataEntryRepository portalDataEntryRepository;
    private final MongoHealthService mongoHealthService;
    private final ObjectMapper objectMapper;

    public JsonNode get(String key) {
        mongoHealthService.requireConnection();
        if (key == null || key.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Key is required");
        }
        String k = key.trim();
        return portalDataEntryRepository
                .findById(k)
                .map(e -> readJson(e.getJson()))
                .orElse(objectMapper.getNodeFactory().objectNode());
    }

    public void put(String key, JsonNode body) {
        mongoHealthService.requireConnection();
        if (key == null || key.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Key is required");
        }
        String k = key.trim();
        String json = body == null ? "{}" : body.toString();
        PortalDataEntry entry =
                portalDataEntryRepository
                        .findById(k)
                        .orElseGet(() -> PortalDataEntry.builder().key(k).build());
        entry.setJson(json);
        entry.setUpdatedAt(Instant.now());
        portalDataEntryRepository.save(entry);
    }

    private JsonNode readJson(String json) {
        if (json == null || json.isBlank()) {
            return objectMapper.getNodeFactory().objectNode();
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            return objectMapper.getNodeFactory().objectNode();
        }
    }
}

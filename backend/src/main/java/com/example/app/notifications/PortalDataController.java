package com.example.app.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/portal-data")
@RequiredArgsConstructor
public class PortalDataController {

    private final PortalDataService portalDataService;

    @GetMapping("/{key}")
    public JsonNode get(@PathVariable String key) {
        return portalDataService.get(key);
    }

    @PutMapping("/{key}")
    public JsonNode put(@PathVariable String key, @RequestBody(required = false) JsonNode body) {
        portalDataService.put(key, body);
        return portalDataService.get(key);
    }
}

package com.example.app.registration.controller;

import com.example.app.registration.dto.SubgroupAutoAssignRequest;
import com.example.app.registration.dto.SubgroupAutoAssignResponse;
import com.example.app.registration.service.SubgroupAutoAssignService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subgroups")
@RequiredArgsConstructor
public class SubgroupAutoAssignController {

    private final SubgroupAutoAssignService subgroupAutoAssignService;

    @PostMapping("/auto-assign")
    public SubgroupAutoAssignResponse autoAssign(@RequestBody SubgroupAutoAssignRequest request) {
        return subgroupAutoAssignService.autoAssign(request);
    }
}

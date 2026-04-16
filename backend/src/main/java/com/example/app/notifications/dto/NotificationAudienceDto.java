package com.example.app.notifications.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class NotificationAudienceDto {

    private List<String> roles = new ArrayList<>();
    private List<String> userRoles = new ArrayList<>();
    private List<String> facultyCodes = new ArrayList<>();
    private List<String> degreeCodes = new ArrayList<>();
    private List<String> semesterCodes = new ArrayList<>();
    private List<String> streamCodes = new ArrayList<>();
    private List<String> intakeIds = new ArrayList<>();
    private List<String> subgroupCodes = new ArrayList<>();
    private List<String> recipientUserIds = new ArrayList<>();
}

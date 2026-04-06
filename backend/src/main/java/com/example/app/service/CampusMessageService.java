package com.example.app.service;

import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import java.util.List;

public interface CampusMessageService {

    List<CampusMessageResponse> getAllMessages();

    CampusMessageResponse createMessage(CampusMessageRequest request);
}


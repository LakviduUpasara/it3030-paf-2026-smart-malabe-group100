/*package com.example.app.service;

import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import com.example.app.entity.CampusMessage;
import com.example.app.repository.CampusMessageRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CampusMessageServiceImpl implements CampusMessageService {

    private final CampusMessageRepository campusMessageRepository;

    @Override
    public List<CampusMessageResponse> getAllMessages() {
        return campusMessageRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CampusMessageResponse createMessage(CampusMessageRequest request) {
        CampusMessage message = CampusMessage.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .build();

        CampusMessage savedMessage = campusMessageRepository.save(message);
        return mapToResponse(savedMessage);
    }

    private CampusMessageResponse mapToResponse(CampusMessage message) {
        return CampusMessageResponse.builder()
                .id(message.getId())
                .title(message.getTitle())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}

    */
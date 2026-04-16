package com.example.app.service;

import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import com.example.app.entity.CampusMessage;
import com.example.app.repository.CampusMessageRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CampusMessageServiceImpl implements CampusMessageService {

    private final CampusMessageRepository campusMessageRepository;

    public CampusMessageServiceImpl(CampusMessageRepository campusMessageRepository) {
        this.campusMessageRepository = campusMessageRepository;
    }

    @Override
    public List<CampusMessageResponse> getAllMessages() {
        return campusMessageRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public CampusMessageResponse createMessage(CampusMessageRequest request) {
        CampusMessage message = new CampusMessage();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());

        CampusMessage savedMessage = campusMessageRepository.save(message);
        return mapToResponse(savedMessage);
    }

    private CampusMessageResponse mapToResponse(CampusMessage message) {
        return new CampusMessageResponse(
                message.getId(),
                message.getTitle(),
                message.getContent(),
                message.getCreatedAt());
    }
}

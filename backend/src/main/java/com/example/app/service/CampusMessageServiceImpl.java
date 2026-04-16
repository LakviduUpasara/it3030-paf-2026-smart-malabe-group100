package com.example.app.service;

import com.example.app.dto.CampusMessageRequest;
import com.example.app.dto.CampusMessageResponse;
import com.example.app.entity.CampusMessage;
import com.example.app.repository.CampusMessageRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CampusMessageServiceImpl implements CampusMessageService {

    private static final Logger logger = LoggerFactory.getLogger(CampusMessageServiceImpl.class);

    private final CampusMessageRepository campusMessageRepository;

    public CampusMessageServiceImpl(CampusMessageRepository campusMessageRepository) {
        this.campusMessageRepository = campusMessageRepository;
    }

    @Override
    public List<CampusMessageResponse> getAllMessages() {
        logger.info("Fetching all campus messages");
        List<CampusMessageResponse> messages = campusMessageRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
        logger.info("Retrieved {} campus messages", messages.size());
        return messages;
    }

    @Override
    public CampusMessageResponse createMessage(CampusMessageRequest request) {
        logger.info("Creating campus message: {}", request.getTitle());
        CampusMessage message = new CampusMessage();
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());

        CampusMessage savedMessage = campusMessageRepository.save(message);
        logger.info("Campus message created with ID: {}", savedMessage.getId());
        return mapToResponse(savedMessage);
    }

    private CampusMessageResponse mapToResponse(CampusMessage message) {
        CampusMessageResponse response = new CampusMessageResponse();
        response.setId(message.getId());
        response.setTitle(message.getTitle());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}


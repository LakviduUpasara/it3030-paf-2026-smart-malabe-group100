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
    private static final String CAMPUS_MESSAGE_SEQUENCE_NAME = "campus_messages_sequence";

    private final CampusMessageRepository campusMessageRepository;
    private final SequenceGeneratorService sequenceGeneratorService;

    public CampusMessageServiceImpl(CampusMessageRepository campusMessageRepository,
                                    SequenceGeneratorService sequenceGeneratorService) {
        this.campusMessageRepository = campusMessageRepository;
        this.sequenceGeneratorService = sequenceGeneratorService;
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
        message.setId(generateEntityId(CAMPUS_MESSAGE_SEQUENCE_NAME));
        message.setTitle(request.getTitle());
        message.setContent(request.getContent());
        message.applyDefaults();

        CampusMessage savedMessage = campusMessageRepository.save(message);
        logger.info("Campus message created with ID: {}", savedMessage.getId());
        return mapToResponse(savedMessage);
    }

    private CampusMessageResponse mapToResponse(CampusMessage message) {
        CampusMessageResponse response = new CampusMessageResponse();
        response.setId(toResponseId(message.getId()));
        response.setTitle(message.getTitle());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }

    private String generateEntityId(String sequenceName) {
        return String.valueOf(sequenceGeneratorService.generateSequence(sequenceName));
    }

    private Long toResponseId(String id) {
        try {
            return Long.valueOf(id);
        } catch (NumberFormatException e) {
            throw new IllegalStateException("Stored campus message id is not numeric: " + id, e);
        }
    }
}


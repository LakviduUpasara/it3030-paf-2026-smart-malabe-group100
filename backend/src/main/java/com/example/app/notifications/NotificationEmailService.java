package com.example.app.notifications;

import com.example.app.config.AppProperties;
import com.example.app.exception.ApiException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEmailService {

    private final ObjectProvider<JavaMailSender> javaMailSender;
    private final AppProperties appProperties;

    public void sendHtmlBroadcast(List<String> toEmails, String subject, String htmlBody) {
        if (toEmails == null || toEmails.isEmpty()) {
            return;
        }
        List<String> clean =
                toEmails.stream()
                        .filter(e -> e != null && !e.isBlank())
                        .map(String::trim)
                        .distinct()
                        .collect(Collectors.toList());
        if (clean.isEmpty()) {
            return;
        }
        if (!appProperties.getNotifications().getEmail().isEnabled()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Notification email is disabled");
        }
        JavaMailSender sender = javaMailSender.getIfAvailable();
        if (sender == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email is not configured (no mail host)");
        }
        String from = appProperties.getNotifications().getEmail().getFromAddress();
        log.info("Sending notification email from {} to {} recipient(s)", from, clean.size());
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(clean.toArray(new String[0]));
            helper.setSubject(subject != null ? subject : "Notification");
            helper.setText(htmlBody != null ? htmlBody : "", true);
            sender.send(message);
            log.info("Notification email sent successfully to {} recipient(s)", clean.size());
        } catch (Exception e) {
            log.error("Failed to send notification email: {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to send email: " + e.getMessage());
        }
    }
}

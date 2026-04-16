package com.example.app.service;

import com.example.app.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Delivers email OTP for sign-in when not in developer mode. Uses SMTP when configured; otherwise
 * falls back to logging.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthEmailOtpNotifier {

    private final AppProperties appProperties;
    private final ObjectProvider<JavaMailSender> mailSender;

    public void sendSignInOtp(String toEmail, String code) {
        if (appProperties.isDeveloperMode()) {
            log.debug("Developer mode is on: email OTP delivery is skipped for {}", toEmail);
            return;
        }

        if (!appProperties.getNotifications().getEmail().isEnabled()) {
            log.warn("Email notifications disabled; sign-in OTP for {} is {}", toEmail, code);
            return;
        }

        log.info("Sign-in OTP for {}: {}", toEmail, code);

        mailSender.ifAvailable(sender -> {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setFrom(appProperties.getNotifications().getEmail().getFromAddress());
            message.setSubject(appProperties.getNotifications().getEmail().getSignInSubject());
            message.setText("Your Smart Campus verification code is: " + code
                    + "\n\nIf you did not try to sign in, you can ignore this message.");
            sender.send(message);
            log.debug("Sent sign-in OTP email via JavaMailSender to {}", toEmail);
        });
    }
}

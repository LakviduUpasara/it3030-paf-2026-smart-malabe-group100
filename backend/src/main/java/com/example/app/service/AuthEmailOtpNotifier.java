package com.example.app.service;

import com.example.app.config.AppProperties;
import com.example.app.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Sends sign-in email OTP when developer mode is off and outbound email is enabled.
 * <p>
 * Requires a configured {@link JavaMailSender} (set {@code spring.mail.host} and credentials).
 * Gmail: use an App Password and set the From address to the same account as {@code spring.mail.username}
 * unless you use a verified Send-As alias.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthEmailOtpNotifier {

    private final AppProperties appProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    /**
     * Sends a sign-in OTP email. Never swallows failures when email delivery is expected.
     *
     * @throws ApiException with {@link HttpStatus#SERVICE_UNAVAILABLE} if SMTP is not configured or send fails
     */
    public void sendSignInOtp(String toEmail, String code) {
        if (appProperties.isDeveloperMode()) {
            log.debug("Developer mode: skipping outbound sign-in OTP email for {}", toEmail);
            return;
        }

        if (!appProperties.getNotifications().getEmail().isEnabled()) {
            log.warn(
                    "Email notifications disabled (app.notifications.email.enabled=false); sign-in OTP for {} not sent",
                    toEmail
            );
            return;
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.error(
                    "Sign-in OTP for {} was not emailed: no JavaMailSender bean. "
                            + "Set spring.mail.host (e.g. SPRING_MAIL_HOST=smtp.gmail.com) and credentials.",
                    toEmail
            );
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email is not configured. Set spring.mail.host, username, and password (e.g. Gmail App Password)."
            );
        }

        String from = resolveFromAddress();
        String subject = appProperties.getNotifications().getEmail().getSignInSubject();
        String body =
                """
                Your Smart Campus verification code is: %s

                This code expires in a few minutes. If you did not try to sign in, you can ignore this message.
                """
                        .formatted(code)
                        .strip();

        log.info("Attempting to send sign-in OTP email to {} (from {})", toEmail, from);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        try {
            sender.send(message);
            log.info("Successfully sent sign-in OTP email to {}", toEmail);
        } catch (MailException ex) {
            log.error("Failed to send sign-in OTP email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not send verification email. Check SMTP settings (Gmail: App Password, TLS port 587). "
                            + ex.getMessage(),
                    ex
            );
        }
    }

    private String resolveFromAddress() {
        String configured = appProperties.getNotifications().getEmail().getFromAddress();
        if (StringUtils.hasText(configured)
                && !configured.endsWith("smartcampus.local")
                && !"noreply@localhost".equalsIgnoreCase(configured.trim())) {
            return configured.trim();
        }
        if (StringUtils.hasText(springMailUsername)) {
            log.debug("Using spring.mail.username as From address for OTP email");
            return springMailUsername.trim();
        }
        if (StringUtils.hasText(configured)) {
            return configured.trim();
        }
        throw new ApiException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "No sender address: set app.notifications.email.from-address or spring.mail.username."
        );
    }
}

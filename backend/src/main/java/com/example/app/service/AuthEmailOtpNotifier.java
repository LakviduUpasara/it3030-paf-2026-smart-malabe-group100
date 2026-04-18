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

    /** Outcome so the API can expose an inline OTP when nothing was mailed. */
    public enum SignInOtpEmailOutcome {
        /** SMTP send attempted and succeeded. */
        SENT,
        /** Developer mode: inbox is intentionally skipped. */
        SKIPPED_DEVELOPER_MODE,
        /** {@code app.notifications.email.enabled} is false. */
        SKIPPED_NOTIFICATIONS_DISABLED
    }

    private final AppProperties appProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    @Value("${spring.mail.host:}")
    private String springMailHost;

    /**
     * Sends a sign-in OTP email when configured. Otherwise returns a skip outcome (caller may expose the code in JSON).
     *
     * @throws ApiException with {@link HttpStatus#SERVICE_UNAVAILABLE} if SMTP is expected but not configured or send fails
     */
    public SignInOtpEmailOutcome sendSignInOtp(String toEmail, String code) {
        if (appProperties.isDeveloperMode()) {
            log.debug("Developer mode: skipping outbound sign-in OTP email for {}", toEmail);
            return SignInOtpEmailOutcome.SKIPPED_DEVELOPER_MODE;
        }

        if (!appProperties.getNotifications().getEmail().isEnabled()) {
            log.warn(
                    "Email notifications disabled (app.notifications.email.enabled=false); sign-in OTP for {} not sent",
                    toEmail
            );
            return SignInOtpEmailOutcome.SKIPPED_NOTIFICATIONS_DISABLED;
        }

        if (!StringUtils.hasText(springMailHost)) {
            log.error(
                    "Sign-in OTP for {} was not emailed: spring.mail.host is blank. "
                            + "Set SPRING_MAIL_HOST (e.g. smtp.gmail.com) or set app.notifications.email.enabled=false.",
                    toEmail
            );
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email is enabled but SMTP host is not set. Add SPRING_MAIL_HOST (e.g. smtp.gmail.com) and mail "
                            + "credentials, or disable app.notifications.email.enabled until SMTP is configured."
            );
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
        } catch (Exception ex) {
            // Jakarta mail / transport sometimes throws checked or non-MailException errors — avoid raw500 on login.
            log.error("Unexpected error sending sign-in OTP email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not send verification email: " + ex.getMessage(),
                    ex
            );
        }
        return SignInOtpEmailOutcome.SENT;
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

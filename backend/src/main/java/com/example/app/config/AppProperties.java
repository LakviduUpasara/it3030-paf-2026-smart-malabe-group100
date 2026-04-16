package com.example.app.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

/**
 * Application-wide flags. {@code developerMode} must stay {@code false} in any shared or
 * production deployment.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private boolean developerMode = false;

    @NestedConfigurationProperty
    private final Notifications notifications = new Notifications();

    @Getter
    @Setter
    public static class Notifications {

        @NestedConfigurationProperty
        private final Email email = new Email();
    }

    @Getter
    @Setter
    public static class Email {

        /**
         * When {@code true} and developer mode is {@code false}, sign-in OTP emails are sent (if
         * SMTP is configured) and API responses avoid exposing OTP debug fields unless allowed.
         */
        private boolean enabled = true;

        /**
         * Used as From address when SMTP is available.
         */
        private String fromAddress = "noreply@smartcampus.local";

        private String signInSubject = "Your Smart Campus sign-in code";
    }
}

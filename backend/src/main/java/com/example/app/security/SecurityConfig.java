package com.example.app.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final SessionAuthenticationFilter sessionAuthenticationFilter;
    private final FirstLoginSessionAuthorizationFilter firstLoginSessionAuthorizationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // CORS preflight must not require auth (browser sends OPTIONS without Bearer token).
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/v1/health/**", "/api/v1/auth/**").permitAll()
                        // Public sign-up: load the same faculty/degree/intake/module metadata as the admin console forms.
                        .requestMatchers(HttpMethod.GET, "/api/v1/faculties", "/api/v1/faculties/**")
                                .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/degree-programs", "/api/v1/degree-programs/**")
                                .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/catalog/modules", "/api/v1/catalog/modules/**")
                                .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/intakes/dropdown")
                                .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/intakes/*/subgroups")
                                .permitAll()
                        .requestMatchers("/api/v1/admin/signup-requests/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "MANAGER")
                        // Platform user directory (/admins) must be matched before /api/v1/admin/** so paths are never
                        // confused with other admin APIs (e.g. /api/v1/admin/...).
                        .requestMatchers("/api/v1/admins", "/api/v1/admins/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN")
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/lecturers", "/api/v1/lecturers/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "MANAGER")
                        .requestMatchers("/api/v1/lab-assistants", "/api/v1/lab-assistants/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "MANAGER")
                        .requestMatchers("/api/v1/students", "/api/v1/students/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "MANAGER")
                        .requestMatchers("/api/v1/intakes", "/api/v1/intakes/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN")
                        .requestMatchers("/api/v1/subgroups", "/api/v1/subgroups/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN")
                        .requestMatchers("/api/v1/module-offerings", "/api/v1/module-offerings/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/portal-data/notification-feed")
                                .authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/v1/portal-data/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .requestMatchers(HttpMethod.GET, "/api/v1/portal-data/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/notifications/audience")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .requestMatchers(HttpMethod.POST, "/api/v1/notifications/email")
                                .hasRole("ADMIN")
                        .requestMatchers("/api/v1/faculties/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .requestMatchers("/api/v1/degree-programs/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .requestMatchers("/api/v1/catalog/modules/**")
                                .hasAnyRole("ADMIN", "LOST_ITEM_ADMIN", "LECTURER")
                        .anyRequest().authenticated())
                .addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(firstLoginSessionAuthorizationFilter, SessionAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}

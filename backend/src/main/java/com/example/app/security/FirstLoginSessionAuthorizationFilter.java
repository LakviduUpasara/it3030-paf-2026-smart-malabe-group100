package com.example.app.security;

import com.example.app.entity.SessionPhase;
import com.example.app.entity.SessionToken;
import com.example.app.repository.SessionTokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class FirstLoginSessionAuthorizationFilter extends OncePerRequestFilter {

    private final SessionTokenRepository sessionTokenRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser)) {
            filterChain.doFilter(request, response);
            return;
        }
        if (!(authentication.getCredentials() instanceof String tokenValue) || tokenValue.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<SessionToken> sessionToken = sessionTokenRepository.findById(tokenValue.trim());
        if (sessionToken.isEmpty() || sessionToken.get().getExpiresAt().isBefore(LocalDateTime.now())) {
            filterChain.doFilter(request, response);
            return;
        }

        SessionPhase phase = sessionToken.get().getPhase();
        if (phase == null || phase == SessionPhase.FULL) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!isAllowedPath(request, phase)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"message\":\"Complete sign-in setup first, or use a full session for this action.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedPath(HttpServletRequest request, SessionPhase phase) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isBlank() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        return switch (phase) {
            case PASSWORD_CHANGE -> (method.equals("GET") && path.endsWith("/auth/me"))
                    || (method.equals("POST") && path.endsWith("/auth/first-login/change-password"))
                    || (method.equals("POST") && path.endsWith("/auth/logout"));
            case TWO_FACTOR_METHOD_SELECTION -> (method.equals("GET") && path.endsWith("/auth/me"))
                    || (method.equals("POST") && path.endsWith("/auth/first-login/select-2fa-method"))
                    || (method.equals("POST") && path.endsWith("/auth/logout"));
            case FULL -> true;
        };
    }
}

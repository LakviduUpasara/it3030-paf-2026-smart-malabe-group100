package com.example.app.security;

import com.example.app.entity.SessionToken;
import com.example.app.entity.UserAccount;
import com.example.app.repository.SessionTokenRepository;
import com.example.app.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionTokenRepository sessionTokenRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String headerValue = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (headerValue != null && headerValue.startsWith("Bearer ")) {
            String tokenValue = headerValue.substring(7).trim();
            Optional<SessionToken> sessionToken = sessionTokenRepository.findById(tokenValue)
                    .filter(token -> token.getExpiresAt().isAfter(LocalDateTime.now()));

            sessionToken.ifPresent(token -> {
                Optional<UserAccount> userAccount = userAccountRepository.findById(token.getUserId());
                if (userAccount.isEmpty()) {
                    sessionTokenRepository.deleteById(tokenValue);
                    return;
                }

                AuthenticatedUser authenticatedUser = AuthenticatedUser.from(userAccount.get());
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        authenticatedUser,
                        tokenValue,
                        authenticatedUser.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            });
        }

        filterChain.doFilter(request, response);
    }
}

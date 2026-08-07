package com.zoop.backend.config;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.zoop.backend.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final InternalApiKeyValidator internalApiKeyValidator;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7).trim();
            if (!token.isEmpty() && jwtUtil.isTokenValid(token)
                    && SecurityContextHolder.getContext().getAuthentication() == null) {
                String subject = jwtUtil.extractSubject(token);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(subject, null, java.util.List.of());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        // Python AI workers call Spring without a browser JWT. Treat a valid
        // internal key as a server identity so the default security policy can
        // remain closed for every unlisted endpoint.
        String internalKey = request.getHeader("X-Zoop-Internal-Key");
        boolean localWorkerRequest = !internalApiKeyValidator.isConfigured()
                && "local-development-worker".equals(internalKey);
        if (SecurityContextHolder.getContext().getAuthentication() == null
                && (internalApiKeyValidator.isValid(internalKey) || localWorkerRequest)) {
            UsernamePasswordAuthenticationToken internalAuthentication =
                    new UsernamePasswordAuthenticationToken("zoop-ai-worker", null, java.util.List.of());
            internalAuthentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(internalAuthentication);
        }
        filterChain.doFilter(request, response);
    }
}

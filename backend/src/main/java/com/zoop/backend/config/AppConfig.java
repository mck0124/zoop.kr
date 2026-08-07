package com.zoop.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class AppConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public AppConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Value("${zoop.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // 🔐 비밀번호 인코더 Bean 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 🔓 Spring Security 기본 허용 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/api/auth/**",
                    "/api/applications",
                    "/api/postings/public",
                    "/api/postings/info/**",
                    "/api/posts/active",
                    "/api/ai/support",
                    "/api/candidate/request-password-reset",
                    "/api/candidate/reset-password",
                    "/api/invitations/clicked/**",
                    "/api/companyadmins/check-id",
                    "/api/candidates/check-id",
                    "/api/candidates/check-exists",
                    "/api/candidates/find-id",
                    "/api/resumes/public",
                    "/api/incident-reports/submit",
                    "/api/companies/**",
                    "/api/files/**",
                    "/health",
                    "/error"
                ).permitAll()
                .requestMatchers(
                    "/api/companyadmins/**",
                    "/api/admin-interview-evaluations/**",
                    "/api/github-search/**",
                    "/api/postings/**"
                ).authenticated()
                // Legacy candidate and AI worker routes still perform their own ownership checks
                // or are called server-to-server without a browser JWT.
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // 모든 경로 허용
                        .allowedOrigins(frontendUrl)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                        .allowedHeaders("*")
                        .exposedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600); // preflight 캐시 시간
            }
        };
    }
}

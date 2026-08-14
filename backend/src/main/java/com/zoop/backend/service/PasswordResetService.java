package com.zoop.backend.service;

import com.zoop.backend.domain.dto.finding.PasswordResetRequest;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.PasswordResetToken;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.PasswordResetTokenRepository;
import com.zoop.backend.service.EmailService; // 사용자 정의 이메일 발송 서비스

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final CandidateRepository candidateRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${zoop.frontend.url:http://localhost:3100}")
    private String frontendUrl;


    public void requestPasswordReset(PasswordResetRequest request) {
        Candidate candidate = candidateRepository
            .findByGithubLoginAndCandidateEmailAndCandidateNameAndCandidatePhoneNumber(
                request.getGithubLogin(),
                request.getEmail(),
                request.getCandidateName(),
                request.getCandidatePhoneNumber()
            )
        .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        String token = UUID.randomUUID().toString();    // 토큰생성
        LocalDateTime expiration = LocalDateTime.now().plusHours(1);  // 토큰 유효기한: 1시간

        PasswordResetToken resetToken = PasswordResetToken.builder()       // 빌더객체 생성
                .token(token)
                .candidate(candidate)
                .expirationDate(expiration)
                .build();

        tokenRepository.save(resetToken);       // 객체 저장

        String resetLink = frontendUrl + "/auth/applicant/reset-password/" + token;
        try {
            emailService.sendPasswordResetEmail(request.getEmail(), request.getGithubLogin(), resetLink);
        } catch (MessagingException e) {
            throw new RuntimeException("비밀번호 재설정 메일 전송 중 오류 발생", e);
        }
    }

    // 비밀번호 리셋
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        if (resetToken.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("토큰이 만료되었습니다.");
        }

        Candidate candidate = resetToken.getCandidate();
        candidate.setCandidatePassword(passwordEncoder.encode(newPassword));
        candidateRepository.save(candidate);

        // ✅ candidate_updated_at 업데이트
        LocalDateTime now = LocalDateTime.now();
        candidateRepository.updateCandidateUpdatedAt(candidate.getCandidateId(), now);

        tokenRepository.deleteByToken(token); // 재사용 방지
    }

}

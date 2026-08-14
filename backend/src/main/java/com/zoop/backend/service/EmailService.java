package com.zoop.backend.service;

import java.net.URLEncoder;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import com.zoop.backend.domain.entity.EmailVerification;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.EmailVerificationRepository;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailVerificationRepository repository;
    private final Random random = new Random();

    @Value("${zoop.frontend.url:http://localhost:3100}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender, EmailVerificationRepository repository) {
        this.mailSender = mailSender;
        this.repository = repository;
    }

    public void sendVerificationCode(String toEmail) throws MessagingException {
        String code = String.format("%06d", random.nextInt(999999));

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject("[ZOOP] 이메일 인증 코드");
        helper.setText("인증 코드: " + code, false);

        mailSender.send(message);

        EmailVerification verification = new EmailVerification();
        verification.setEmail(toEmail);
        verification.setCode(code);
        repository.save(verification);
    }

    public boolean verifyCode(String email, String code) {
        return repository.findTopByEmailOrderByCreatedAtDesc(email)
                .filter(v -> !v.isVerified())
                .filter(v -> v.getCode().equals(code))
                .filter(v -> v.getCreatedAt() != null && v.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(5))) // 5분 이내만 유효
                .map(v -> {
                    v.setVerified(true);
                    repository.save(v);
                    return true;
                }).orElse(false);
    }

    /**
     * 초대 이메일
     */
    public void sendInvitationEmail(String toEmail, String githubLogin, String token, Post post) throws MessagingException {
        
        String subject = "[ZOOP] " + post.getPostTitle() + " - 인터뷰 초대";
        String link;
        try {
            link = frontendUrl + "/invite/" + token + "?email=" + URLEncoder.encode(toEmail, "UTF-8");
            log.info("📨 메일 발송: 초대 링크 → {}", link);
        } catch (java.io.UnsupportedEncodingException e) {
            // UTF-8은 항상 지원되므로 이 예외는 발생하지 않아야 하지만, 안전을 위해 처리
            link = frontendUrl + "/invite/" + token + "?email=" + toEmail;
        }

        String body = String.format("""
        <div style=\"font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px;\">
            <h2 style=\"color:#333;\">👋 안녕하세요 %s 님,</h2>
            <p style=\"font-size:15px; color:#555;\">ZOOP 플랫폼에서 아래 공고에 대한 인터뷰 초대를 보냈습니다.</p>

            <div style=\"background-color:#fff; border:1px solid #ddd; border-radius:8px; padding:16px; margin-top:20px;\">
                <h3 style=\"color:#28a745;\">📌 %s</h3>
                <table style=\"width:100%%; font-size:14px; color:#444; border-collapse:collapse;\">
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">기술스택</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">위치</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">모집 인원</td>
                        <td>%s명</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">급여</td>
                        <td>%s ~ %s만원</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">공고 기간</td>
                        <td>%s ~ %s</td>
                    </tr>
                </table>
            </div>

            <div style=\"margin-top:30px; text-align:center;\">
                <a href=\"%s\" style=\"background-color:#28a745; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;\">
                    👉 초대 확인하기
                </a>
            </div>

            <p style=\"margin-top:30px; font-size:13px; color:#777;\">감사합니다.<br/>ZOOP 팀 드림</p>
        </div>
    """, githubLogin,
            post.getPostTitle(),
            post.getPostProgrammingLanguage(),
            post.getPostLocation(),
            post.getPostHeadcount(),
            post.getPostSalaryStart(),
            post.getPostSalaryEnd(),
            post.getPostPostedDate(),
            post.getPostExpiryDate(),
            link
        );

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, true); // ✅ HTML 전송

        mailSender.send(message);
    }

    /**
     * 지원 확인 이메일
     */
    public void sendApplicationConfirmationEmail(String toEmail, String candidateName, String postTitle) throws MessagingException {
        String subject = "[ZOOP] " + postTitle + " - 지원 확인";
        
        String body = String.format("""
        <div style=\"font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px;\">
            <h2 style=\"color:#333;\">👋 안녕하세요 %s 님,</h2>
            <p style=\"font-size:15px; color:#555;\">ZOOP 플랫폼에 지원해주셔서 감사합니다.</p>

            <div style=\"background-color:#fff; border:1px solid #ddd; border-radius:8px; padding:16px; margin-top:20px;\">
                <h3 style=\"color:#28a745;\">📌 %s</h3>
                <p style=\"font-size:14px; color:#444;\">지원이 성공적으로 접수되었습니다.</p>
                <p style=\"font-size:14px; color:#444;\">검토 후 결과를 이메일로 안내드리겠습니다.</p>
            </div>

            <div style=\"margin-top:30px; padding:16px; background-color:#e8f5e8; border-radius:8px;\">
                <h4 style=\"color:#28a745; margin-top:0;\">📋 지원 절차</h4>
                <ol style=\"color:#555; font-size:14px;\">
                    <li>지원서 검토 (1-2일 소요)</li>
                    <li>1차 AI 면접 (선택사항)</li>
                    <li>기업 면접</li>
                    <li>최종 결과 안내</li>
                </ol>
            </div>

            <p style=\"margin-top:30px; font-size:13px; color:#777;\">감사합니다.<br/>ZOOP 팀 드림</p>
        </div>
        """, candidateName, postTitle);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, true); // HTML 전송

        mailSender.send(message);
    }

        /**
     * 커스텀 초대 이메일 발송
     */
    public void sendCustomInvitationEmail(String toEmail, String githubLogin, String token, Post post, String customSubject, String customContent) throws MessagingException {
        
        String link;
        try {
            link = frontendUrl + "/invite/" + token + "?email=" + URLEncoder.encode(toEmail, "UTF-8");
            log.info("📨 커스텀 메일 발송: 초대 링크 → {}", link);
        } catch (java.io.UnsupportedEncodingException e) {
            // UTF-8은 항상 지원되므로 이 예외는 발생하지 않아야 하지만, 안전을 위해 처리
            link = frontendUrl + "/invite/" + token + "?email=" + toEmail;
        }

        // 커스텀 내용에서 동적 변수 치환
        String finalSubject = replacePlaceholders(customSubject, githubLogin, post, link);
        String finalContent = replacePlaceholders(customContent, githubLogin, post, link);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject(finalSubject);
        helper.setText(finalContent, true); // ✅ HTML 전송

        mailSender.send(message);
    }

    /**
     * 이메일 내용의 플레이스홀더를 실제 값으로 치환
     */
    private String replacePlaceholders(String content, String githubLogin, Post post, String link) {
        return content
            .replace("{{githubLogin}}", githubLogin != null ? githubLogin : "")
            .replace("{{postTitle}}", post.getPostTitle() != null ? post.getPostTitle() : "")
            .replace("{{postDescription}}", post.getPostDescription() != null ? post.getPostDescription() : "")
            .replace("{{postProgrammingLanguage}}", post.getPostProgrammingLanguage() != null ? post.getPostProgrammingLanguage() : "")
            .replace("{{postLocation}}", post.getPostLocation() != null ? post.getPostLocation() : "")
            .replace("{{postHeadcount}}", post.getPostHeadcount() != null ? String.valueOf(post.getPostHeadcount()) : "")
            .replace("{{postSalaryStart}}", post.getPostSalaryStart() != null ? post.getPostSalaryStart() : "")
            .replace("{{postSalaryEnd}}", post.getPostSalaryEnd() != null ? post.getPostSalaryEnd() : "")
            .replace("{{postPostedDate}}", post.getPostPostedDate() != null ? post.getPostPostedDate().toString() : "")
            .replace("{{postExpiryDate}}", post.getPostExpiryDate() != null ? post.getPostExpiryDate().toString() : "")
            .replace("{{invitationLink}}", link != null ? link : "");
    }

    /**
     * 비밀번호 재설정 이메일 (팀에서 추가한 기능)
     */
    public void sendPasswordResetEmail(String toEmail, String githubLogin, String resetLink) throws MessagingException {
        String subject = "[ZOOP] 비밀번호 재설정 안내";

        String body = String.format("""
        <div style=\"font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px;\">
            <h2 style=\"color:#333;\">안녕하세요 %s 님,</h2>
            <p style=\"font-size:15px; color:#555;\">ZOOP에서 비밀번호 재설정을 요청하셨습니다.</p>
            <p style=\"font-size:14px; color:#777;\">아래 버튼을 클릭하여 비밀번호를 재설정해주세요. <strong>해당 링크는 1시간 동안만 유효합니다.</strong></p>

            <div style=\"margin-top:30px; text-align:center;\">
                <a href=\"%s\" style=\"background-color:#28a745; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;\">
                    🔒 비밀번호 재설정하기
                </a>
            </div>

            <p style=\"margin-top:30px; font-size:13px; color:#999;\">본인이 요청하지 않은 경우 이 메일은 무시하셔도 됩니다.</p>
            <p style=\"font-size:13px; color:#777;\">감사합니다.<br/>ZOOP 팀 드림</p>
        </div>
        """, githubLogin, resetLink);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);      // 수신자 설정
        helper.setSubject(subject);
        helper.setText(body, true); // HTML 전송

        mailSender.send(message);
    }

    /**
     * 5분이 지난 이메일 인증 데이터 삭제 (매 1분마다 실행)
     */
    @Scheduled(cron = "0 * * * * *") // 매 1분마다
    @Transactional
    public void deleteExpiredEmailVerifications() {
        java.time.LocalDateTime threshold = java.time.LocalDateTime.now().minusMinutes(5);
        repository.deleteByCreatedAtBefore(threshold);
    }

    /**
     * 합격 안내 이메일
     */
    public void sendPassNotificationEmail(String toEmail, String candidateName, String postTitle, String companyName) throws MessagingException {
        String subject = "[ZOOP] " + postTitle + " - 합격 안내";

        String body = String.format("""
        <div style=\"font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px;\">
            <h2 style=\"color:#333;\">🎉 축하합니다! %s 님</h2>
            <p style=\"font-size:15px; color:#555;\">ZOOP 플랫폼을 통해 지원하신 공고에 합격하셨습니다!</p>

            <div style=\"background-color:#fff; border:2px solid #28a745; border-radius:8px; padding:20px; margin:20px 0;\">
                <h3 style=\"color:#28a745; margin-top:0;\">✅ 합격 안내</h3>
                <table style=\"width:100%%; font-size:14px; color:#444; border-collapse:collapse;\">
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">회사명</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">공고명</td>
                        <td>%s</td>
                    </tr>
                    <tr>
                        <td style=\"padding:8px 0; font-weight:bold;\">합격일</td>
                        <td>%s</td>
                    </tr>
                </table>
            </div>

            <div style=\"margin-top:30px; padding:16px; background-color:#e8f5e8; border-radius:8px;\">
                <h4 style=\"color:#28a745; margin-top:0;\">📋 다음 단계</h4>
                <ol style=\"color:#555; font-size:14px;\">
                    <li>기업에서 별도로 연락을 드릴 예정입니다</li>
                    <li>입사 관련 상세 안내를 받으실 수 있습니다</li>
                    <li>문의사항이 있으시면 기업에 직접 연락하시기 바랍니다</li>
                </ol>
            </div>

            <div style=\"margin-top:30px; text-align:center;\">
                <a href=\"%s\" style=\"background-color:#28a745; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:bold; display:inline-block;\">
                    🏠 ZOOP 홈으로 가기
                </a>
            </div>

            <p style=\"margin-top:30px; font-size:13px; color:#777;\">합격을 진심으로 축하드립니다!<br/>ZOOP 팀 드림</p>
        </div>
        """, candidateName, companyName, postTitle, 
             java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일")),
             frontendUrl);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(body, true); // HTML 전송

        mailSender.send(message);
    }
}

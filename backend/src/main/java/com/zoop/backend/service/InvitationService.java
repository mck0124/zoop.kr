package com.zoop.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import com.zoop.backend.domain.dto.BulkInvitationSendRequest;
import com.zoop.backend.domain.dto.CandidateInfo;
import com.zoop.backend.domain.dto.InvitationSendRequest;
import com.zoop.backend.domain.dto.modal.InvitationSentDateResponse;
import com.zoop.backend.domain.entity.EmailContents;
import com.zoop.backend.domain.entity.Invitation;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.InvitationRepository;
import com.zoop.backend.repository.PostRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

    @Value("${zoop.frontend.url:http://localhost:3100}")
    private String frontendUrl;

    private final InvitationRepository invitationRepository;
    private final PostRepository postRepository;
    private final EmailService emailService;
    private final JobCandProgressService jobCandProgressService;
    private final EmailContentsService emailContentsService;

    public void sendInvitation(InvitationSendRequest dto) {
        // 1. 고유 토큰 생성
        String token = UUID.randomUUID().toString();

        // 2. post 조회 (여기서 companyAdminId도 가져옴)
        Optional<Post> optionalPost = postRepository.findById(dto.getPostId());
        if (optionalPost.isEmpty()) {
            log.error("❌ postId={}에 해당하는 공고가 없습니다.", dto.getPostId());
            return;
        }
        Post post = optionalPost.get();

        // 3. 이메일 내용 처리 (커스텀 또는 기본 템플릿)
        EmailContents emailContents = null;
        if (dto.getCustomEmailSubject() != null && dto.getCustomEmailContent() != null) {
            // 커스텀 이메일인 경우 (제목과 내용이 모두 있으면)
            emailContents = emailContentsService.findOrCreateEmailContents(
                dto.getPostId(),
                dto.getCustomEmailSubject(),
                dto.getCustomEmailContent()
            );
            log.info("📧 커스텀 이메일 내용 처리 완료: emailId={}", emailContents.getEmailId());
        }

        // 4. Invitation 객체 생성
        Invitation invitation = Invitation.builder()
                .postId(dto.getPostId())
                .githubLogin(dto.getGithubLogin())
                .companyAdminId(post.getCompanyAdminId())
                .invitationUniqueToken(token)
                .invitationSentDate(LocalDateTime.now())
                .invitationStatus("sent")
                .emailContentsId(emailContents != null ? emailContents.getEmailId() : null)
                .build();

        // 5. DB 저장
        invitationRepository.save(invitation);
        log.info(invitation.toString());

        // 6. 메일 전송 (emailContents 존재 여부에 따라 분기)
        try {
            if (emailContents != null) {
                // 커스텀 이메일 발송
                emailService.sendCustomInvitationEmail(
                    dto.getCandidateEmail(),
                    dto.getGithubLogin(),
                    token,
                    post,
                    emailContents.getEmailSubject(),
                    emailContents.getEmailContent()
                );
                log.info("📨 커스텀 초대 메일 발송 완료: {}", dto.getCandidateEmail());
            } else {
                // 기본 템플릿 이메일 발송
                emailService.sendInvitationEmail(
                    dto.getCandidateEmail(),
                    dto.getGithubLogin(),
                    token,
                    post
                );
                log.info("📨 템플릿 초대 메일 발송 완료: {}", dto.getCandidateEmail());
            }
            
            // 7. job_cand_progress 테이블의 stage를 2n으로 업데이트
            jobCandProgressService.updateProgressStageBulk(List.of(dto));
            log.info("✅ job_cand_curr_stage를 2n으로 업데이트 완료: postId={}, githubLogin={}", dto.getPostId(), dto.getGithubLogin());
            
        } catch (Exception e) {
            log.error("❌ 메일 발송 실패: {}", e.getMessage(), e);
            invitationRepository.updateStatusById(invitation.getInvitationId(), "failed");
        }

        // log.info("📨 메일 발송: 초대 링크 → " + frontendUrl + "/invite/" + token);
    }

    /**
     * 일괄 초대 메일 전송
     */
    public void sendBulkInvitations(BulkInvitationSendRequest request) {
        log.info("📨 일괄 초대 메일 전송 시작: postId={}, 후보자 수={}", 
            request.getPostId(), request.getCandidates().size());

        // 1. post 조회
        Optional<Post> optionalPost = postRepository.findById(request.getPostId());
        if (optionalPost.isEmpty()) {
            log.error("❌ postId={}에 해당하는 공고가 없습니다.", request.getPostId());
            throw new RuntimeException("해당 공고를 찾을 수 없습니다: " + request.getPostId());
        }
        Post post = optionalPost.get();

        // 2. 이메일 내용 생성/재사용 (중복 방지)
        EmailContents emailContents = emailContentsService.findOrCreateEmailContents(
            request.getPostId(),
            request.getCustomEmailSubject(),
            request.getCustomEmailContent()
        );
        log.info("📧 이메일 내용 처리 완료: emailId={}", emailContents.getEmailId());

        // 3. 일괄전송을 위한 InvitationSendRequest 목록 생성 (job_cand_progress 업데이트용)
        List<InvitationSendRequest> invitationRequests = new ArrayList<>();

        // 4. 각 후보자에 대해 Invitation 생성 및 메일 발송
        List<String> successfulEmails = new ArrayList<>();
        List<String> failedEmails = new ArrayList<>();

        for (CandidateInfo candidate : request.getCandidates()) {
            try {
                // 4-1. 고유 토큰 생성
                String token = UUID.randomUUID().toString();

                // 4-2. Invitation 객체 생성 (모두 같은 emailContentsId 참조)
                Invitation invitation = Invitation.builder()
                        .postId(request.getPostId())
                        .githubLogin(candidate.getGithubLogin())
                        .companyAdminId(request.getCompanyAdminId())
                        .invitationUniqueToken(token)
                        .invitationSentDate(LocalDateTime.now())
                        .invitationStatus("sent")
                        .emailContentsId(emailContents.getEmailId())
                        .build();

                // 4-3. DB 저장
                invitationRepository.save(invitation);

                // 4-4. 메일 발송
                emailService.sendCustomInvitationEmail(
                    candidate.getCandidateEmail(),
                    candidate.getGithubLogin(),
                    token,
                    post,
                    emailContents.getEmailSubject(),
                    emailContents.getEmailContent()
                );

                successfulEmails.add(candidate.getCandidateEmail());
                log.info("📨 개별 초대 메일 발송 완료: {}", candidate.getCandidateEmail());

                // 4-5. job_cand_progress 업데이트용 목록에 추가
                InvitationSendRequest invitationRequest = new InvitationSendRequest();
                invitationRequest.setPostId(request.getPostId());
                invitationRequest.setGithubLogin(candidate.getGithubLogin());
                invitationRequest.setCompanyAdminId(request.getCompanyAdminId());
                invitationRequest.setCandidateEmail(candidate.getCandidateEmail());
                invitationRequests.add(invitationRequest);

            } catch (Exception e) {
                log.error("❌ 개별 메일 발송 실패: {}, 오류: {}", candidate.getCandidateEmail(), e.getMessage());
                failedEmails.add(candidate.getCandidateEmail());
                
                // 실패한 경우 invitation 상태 업데이트
                invitationRepository.findByGithubLogin(candidate.getGithubLogin())
                    .ifPresent(inv -> {
                        inv.setInvitationStatus("failed");
                        invitationRepository.save(inv);
                    });
            }
        }

        // 5. job_cand_progress 테이블 일괄 업데이트
        if (!invitationRequests.isEmpty()) {
            try {
                jobCandProgressService.updateProgressStageBulk(invitationRequests);
                log.info("✅ job_cand_curr_stage 일괄 업데이트 완료: {} 건", invitationRequests.size());
            } catch (Exception e) {
                log.error("❌ job_cand_progress 업데이트 실패: {}", e.getMessage());
            }
        }

        // 6. 결과 로깅
        log.info("📨 일괄 초대 메일 전송 완료! 성공: {} 건, 실패: {} 건", 
            successfulEmails.size(), failedEmails.size());
        
        if (!failedEmails.isEmpty()) {
            log.warn("⚠️ 발송 실패한 이메일들: {}", failedEmails);
        }
    }

    /**합친 이후 */
    public List<InvitationSentDateResponse> getAllInvitationSentDates(Long postId, String githubLogin) {
        List<Invitation> invitations = invitationRepository.findAllByPostIdAndGithubLoginOrderByInvitationSentDateDesc(postId, githubLogin);
        return invitations.stream()
                .map(inv -> new InvitationSentDateResponse(inv.getInvitationSentDate()))
                .collect(Collectors.toList());
    }
}

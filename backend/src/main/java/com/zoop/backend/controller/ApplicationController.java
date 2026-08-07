package com.zoop.backend.controller;

import com.zoop.backend.domain.dto.ApplicationRequestDto;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PostRepository;
import com.zoop.backend.service.EmailService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Tag(name = "ApplicationController", description = "지원 신청 관련 API")
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final CandidateRepository candidateRepository;
    private final JobCandProgressRepository jobCandProgressRepository;
    private final PostRepository postRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Operation(summary = "지원 신청", description = "공개 채용 공고에 지원 신청을 합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode = "200", description = "지원 신청 성공",
            content = @Content(schema = @Schema(implementation = Map.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 데이터 누락, 형식 오류 등)"),
        @ApiResponse(responseCode = "404", description = "해당 공고를 찾을 수 없음"),
        @ApiResponse(responseCode = "409", description = "이미 지원한 공고"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<Map<String, Object>> applyForJob(@RequestBody ApplicationRequestDto dto) {
        try {
            // 1. 공고 존재 확인
            Post post = postRepository.findById(dto.getPostId())
                .orElse(null);
            
            if (post == null) {
                return ResponseEntity.notFound().build();
            }

            if (!"ACTIVE".equals(post.getPostStatus())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "마감된 공고입니다."));
            }

            // 2. GitHub 아이디 유효성 검사
            if (dto.getGithubLogin() == null || dto.getGithubLogin().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "GitHub 아이디는 필수입니다."));
            }

            // 3. 이미 지원했는지 확인 (이메일 기준)
            Candidate existingCandidate = candidateRepository.findByCandidateEmail(dto.getEmail())
                .orElse(null);
            
            if (existingCandidate != null) {
                // 기존 지원자인 경우, 이미 이 공고에 지원했는지 확인
                JobCandProgress existingProgress = jobCandProgressRepository
                    .findByPost_PostIdAndCandidate_CandidateId(dto.getPostId(), existingCandidate.getCandidateId())
                    .orElse(null);
                
                if (existingProgress != null) {
                    return ResponseEntity.status(409)
                        .body(Map.of("error", "이미 지원한 공고입니다."));
                }
            }

            // 4. 지원자 정보 저장 또는 업데이트
            Candidate candidate;
            if (existingCandidate != null) {
                // 기존 지원자 정보 업데이트
                candidate = existingCandidate;
                candidate.setCandidateName(dto.getName());
                candidate.setCandidatePhoneNumber(dto.getPhone());
                candidate.setCandidateUpdatedAt(LocalDateTime.now());
            } else {
                // 새로운 지원자 생성
                String githubLogin = dto.getGithubLogin().trim();
                candidate = Candidate.builder()
                    .githubLogin(githubLogin)
                    .candidateEmail(dto.getEmail())
                    // 공개 지원 계정에는 알려진 기본 비밀번호를 저장하지 않는다.
                    // 지원자는 비밀번호 찾기 흐름으로 최초 비밀번호를 설정한다.
                    .candidatePassword(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .candidateName(dto.getName())
                    .candidatePhoneNumber(dto.getPhone())
                    .candidateRegistrationDate(LocalDateTime.now())
                    .candidateCreatedAt(LocalDateTime.now())
                    .candidateUpdatedAt(LocalDateTime.now())
                    .build();
            }
            
            candidate = candidateRepository.save(candidate);

            // 5. 지원 진행 상태 생성
            JobCandProgress progress = JobCandProgress.builder()
                .post(post)
                .candidate(candidate)
                .jobCandCurrStage("1n") // 필터링 단계로 시작
                .jobCandCreatedAt(LocalDateTime.now())
                .jobCandUpdatedAt(LocalDateTime.now())
                .githubLogin(candidate.getGithubLogin())
                .build();
            
            jobCandProgressRepository.save(progress);

            // 6. 지원 완료 이메일 발송 (선택사항)
            try {
                emailService.sendApplicationConfirmationEmail(
                    dto.getEmail(), 
                    dto.getName(), 
                    dto.getPostTitle()
                );
            } catch (Exception e) {
                // 이메일 발송 실패는 지원 신청 실패로 처리하지 않음
                System.err.println("지원 확인 이메일 발송 실패: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                "message", "지원이 성공적으로 완료되었습니다.",
                "applicationId", progress.getJobCandidateId(),
                "candidateId", candidate.getCandidateId()
            ));

        } catch (Exception e) {
            System.err.println("지원 신청 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "지원 신청 처리 중 오류가 발생했습니다."));
        }
    }
}

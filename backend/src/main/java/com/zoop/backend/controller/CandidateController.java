package com.zoop.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;

import com.zoop.backend.domain.dto.CandidateSignupRequest;
import com.zoop.backend.domain.dto.finding.FindGithubLoginRequest;
import com.zoop.backend.domain.dto.finding.FindGithubLoginResponse;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.GithubSearchResult;
import com.zoop.backend.domain.entity.Invitation;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.GithubSearchResultRepository;
import com.zoop.backend.repository.InvitationRepository;
import com.zoop.backend.service.CandidateService;
import com.zoop.backend.service.JobCandProgressService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Tag(name="CandidateController", description = "개인회원(후보자) 관련 API")
@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;
    private final CandidateRepository candidateRepository;
    private final InvitationRepository invitationRepository;
    private final GithubSearchResultRepository githubSearchResultRepository;
    private final JobCandProgressService jobCandProgressService;

    // 1. 후보자 추가
    @Operation(summary = "개인회원 정보 등록", description = "새로운 개인회원(후보자) 정보를 시스템에 등록합니다.")
    @ApiResponses(value={
        @ApiResponse(responseCode="201", description="개인회원 정보 등록 성공 및 등록된 개인회원 정보 반환",
            content = @Content(schema = @Schema(implementation = Candidate.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청(예: 필수 필드 누락, 데이터 형식 오류 등",
            content = @Content(schema = @Schema(implementation = String.class))),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/process")
    public ResponseEntity<?> addCandidate(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "등록할 개인회원(후보자) 정보",
            required = true,
            content = @Content(schema = @Schema(implementation = Candidate.class))
        )
        @RequestBody CandidateSignupRequest request) {
        try {
            // 1. 입력받은 candidate 정보 출력
            log.info("회원가입 요청: {}", request.toString());
            
            // 2. Candidate 객체 생성(엔티티로 변환)
            Candidate candidate = new Candidate();
            candidate.setCandidateName(request.getCandidateName());
            candidate.setCandidateEmail(request.getCandidateEmail());
            candidate.setCandidatePassword(request.getCandidatePassword());
            candidate.setCandidatePhoneNumber(request.getCandidatePhoneNumber());
            candidate.setCandidateRegistrationDate(request.getCandidateRegistrationDate());
            candidate.setCandidateUpdatedAt(request.getCandidateUpdatedAt());
            candidate.setCandidateCreatedAt(request.getCandidateCreatedAt());
            candidate.setGithubLogin(request.getGithubLogin());
            candidate.setGoogleId(request.getGoogleId());
            
            // 3. 저장
            Candidate savedCandidate = candidateService.save(candidate);

            // 4. 토큰기반 Invitation 업데이트
            // 만약 InvitationToken이 전달된다면
            if(request.getInvitationToken() != null){  
                
                // 토큰을 기반하여 Invitation조회
                Optional<Invitation> optional = invitationRepository.findByInvitationUniqueToken(request.getInvitationToken());
                if(optional.isPresent()){
                    Invitation invitation = optional.get();
                    
                    // 토큰이 유효하다면 Invitation의 상태를 업데이트
                    invitation.setInvitationStatus("ACCEPTED");
                    invitation.setCandidateId(savedCandidate.getCandidateId());
                    invitationRepository.save(invitation);
                    
                    // job_cand_progress 테이블의 candidate_id도 업데이트
                    // jobCandProgressService.updateCandidateId(request.getInvitationToken(), savedCandidate.getCandidateId());
                    
                    log.info("초대 토큰 기반 회원가입 완료: candidateId={}, invitationToken={}", 
                            savedCandidate.getCandidateId(), request.getInvitationToken());
                }
            }
            
            // 저장된 후보자와 함께 201 CREATED 상태 코드 반환
            return new ResponseEntity<>(savedCandidate, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("회원가입 중 오류 발생: {}", e.getMessage());
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("회원가입 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
            return new ResponseEntity<>("회원가입 중 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // 2. 아이디 중복검사
    @GetMapping("/check-id")
    public ResponseEntity<String> checkGithubLoginDuplicate(@RequestParam String githubLogin) {
        log.info("깃허브 로그인 중복 검사: {}", githubLogin);
        
        try {
            boolean exists = candidateRepository.existsByGithubLogin(githubLogin);
            if (exists) {
                return ResponseEntity.ok("duplicate");
            } else {
                return ResponseEntity.ok("available");
            }
        } catch (Exception e) {
            log.error("깃허브 로그인 중복 검사 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
        }
    }

    // 3. 후보자 존재 확인
    @GetMapping("/check-exists")
    public ResponseEntity<Map<String, Boolean>> checkCandidateExists(@RequestParam String githubLogin) {
        log.info("후보자 존재 확인: {}", githubLogin);
        
        try {
            boolean exists = candidateRepository.existsByGithubLogin(githubLogin);
            Map<String, Boolean> response = Map.of(
                "exists", exists,
                "githubLogin", githubLogin != null && !githubLogin.trim().isEmpty()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("후보자 존재 확인 중 오류 발생: {}", e.getMessage());
            Map<String, Boolean> errorResponse = Map.of("exists", false, "githubLogin", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // 4. 후보자 ID로 조회 (상세 버전)
    @GetMapping("/{candidateId}")
    public ResponseEntity<?> getCandidateById(@PathVariable Long candidateId) {
        log.info("후보자 ID로 조회: candidateId={}", candidateId);
        
        try {
            Optional<Candidate> candidate = candidateRepository.findById(candidateId);
            if (candidate.isPresent()) {
                return ResponseEntity.ok(candidate.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "해당 ID의 후보자를 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            log.error("후보자 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "후보자 조회 중 오류가 발생했습니다."));
        }
    }

    @PutMapping("/{candidateId}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long candidateId, @RequestBody Map<String, String> request) {
        try {
            assertCandidateAccess(candidateId);
            Candidate updated = candidateService.updateProfile(
                    candidateId, request.get("candidateName"), request.get("candidateEmail"));
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{candidateId}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long candidateId, @RequestBody Map<String, String> request) {
        try {
            assertCandidateAccess(candidateId);
            candidateService.changePassword(candidateId, request.get("currentPassword"), request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "비밀번호가 변경되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private void assertCandidateAccess(Long candidateId) {
        String subject = SecurityContextHolder.getContext().getAuthentication() == null
                ? "" : SecurityContextHolder.getContext().getAuthentication().getName();
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!String.valueOf(candidateId).equals(subject) && !candidate.getGithubLogin().equals(subject)) {
            throw new org.springframework.security.access.AccessDeniedException("본인 계정만 변경할 수 있습니다.");
        }
    }

    // 5. 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findGithubLogin(@RequestBody FindGithubLoginRequest request) {
        try {
            log.info("GitHub 로그인 찾기 요청: name={}, email={}", request.getName(), request.getEmail());
            
            FindGithubLoginResponse response = candidateService.findGithubLogin(request);
            
            log.info("GitHub 로그인 찾기 성공: githubLogin={}", response.getGithubLogin());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("GitHub 로그인 찾기 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("GitHub 로그인 찾기 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "GitHub 로그인 찾기 중 오류가 발생했습니다."));
        }
    }

    // 6. 이메일로 GitHub 로그인 조회 (간단 버전)
    @GetMapping("/email/{githubLogin}")
    public ResponseEntity<?> getCandidate(@PathVariable String githubLogin) {
        try {
            Optional<Candidate> candidate = candidateRepository.findByGithubLogin(githubLogin);
            if (candidate.isPresent()) {
                CandidateInfoDto info = new CandidateInfoDto(candidate.get());
                return ResponseEntity.ok(info);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "해당 GitHub 로그인의 후보자를 찾을 수 없습니다."));
            }
        } catch (Exception e) {
            log.error("후보자 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "후보자 조회 중 오류가 발생했습니다."));
        }
    }

    // 7. GitHub 검색 결과 조회
    @GetMapping("/github-search/{githubLogin}")
    public ResponseEntity<?> getGithubSearchResults(@PathVariable String githubLogin) {
        log.info("GitHub 검색 결과 조회: githubLogin={}", githubLogin);
        
        try {
            List<GithubSearchResult> results = githubSearchResultRepository.findByGithubLogin(githubLogin);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("GitHub 검색 결과 조회 중 오류 발생: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "GitHub 검색 결과 조회 중 오류가 발생했습니다."));
        }
    }

    // DTO 클래스
    public static class CandidateInfoDto {
        private final String name;
        private final String email;
        private final String phone;
        
        public CandidateInfoDto(Candidate c) {
            this.name = c.getCandidateName();
            this.email = c.getCandidateEmail();
            this.phone = c.getCandidatePhoneNumber();
        }
        
        // Getters
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
    }
}

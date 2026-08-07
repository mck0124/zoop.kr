package com.zoop.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.CandidatePortfolio;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.PortfolioJobMatch;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.AiAnalysisResultRepository;
import com.zoop.backend.repository.CandidatePortfolioRepository;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PortfolioJobMatchRepository;
import com.zoop.backend.repository.PostRepository;
import com.zoop.backend.service.CandidateNotificationService;
import com.zoop.backend.service.CompanyNotificationService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/portfolio-job-matches")
@Slf4j
public class PortfolioJobMatchController {
    
    @Autowired
    private PortfolioJobMatchRepository portfolioJobMatchRepository;
    
    @Autowired
    private JobCandProgressRepository jobCandProgressRepository;
    
    @Autowired
    private AiAnalysisResultRepository aiAnalysisResultRepository;

    @Autowired
    private CompanyNotificationService companyNotificationService;

    @Autowired
    private CandidateNotificationService candidateNotificationService;
    
    @Autowired
    private CandidatePortfolioRepository candidatePortfolioRepository;
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private CandidateRepository candidateRepository;
    
    @PostMapping
    public ResponseEntity<?> savePortfolioJobMatch(@RequestBody Map<String, Object> request) {
        try {
            log.info("포트폴리오-채용공고 매칭 결과 저장 시작");
            
            Long candPortfolioId = Long.valueOf(request.get("candPortfolioId").toString());  // portfolioId -> candPortfolioId로 변경
            Long jobPostingId = Long.valueOf(request.get("jobPostingId").toString());
            Double matchingScore = Double.valueOf(request.get("matchingScore").toString());
            String matchingReason = (String) request.get("matchingReason");
            
            log.info("매칭 저장 요청: candPortfolioId={}, jobPostingId={}, score={}", candPortfolioId, jobPostingId, matchingScore);
            
            if (matchingScore < 0.0 || matchingScore > 100.0) {
                return ResponseEntity.badRequest().body("매칭 점수는 0점에서 100점 사이여야 합니다.");
            }

            // review/not_enough_evidence 판단도 숨기지 않고 저장한다.
            // 단, strong match(80점 이상)만 자동 알림과 단계 전환을 일으킨다.
            Optional<PortfolioJobMatch> existingMatch = portfolioJobMatchRepository
                    .findByCandPortfolioIdAndPostId(candPortfolioId, jobPostingId);
            boolean shouldPromote = existingMatch.map(existing -> existing.getMatchingScore() < 80.0).orElse(true)
                    && matchingScore >= 80.0;
            PortfolioJobMatch match = existingMatch.orElseGet(() -> PortfolioJobMatch.builder()
                            .candPortfolioId(candPortfolioId)
                            .postId(jobPostingId)
                            .build());
            match.setMatchingScore(matchingScore);
            match.setMatchingReason(matchingReason);
            
            PortfolioJobMatch savedMatch = portfolioJobMatchRepository.save(match);
            System.out.println("매칭 저장 완료: " + savedMatch.getMatchId());

            if (matchingScore < 80.0) {
                log.info("매칭 점수 {}점: 결과는 저장하지만 자동 알림·단계 전환은 보류", matchingScore);
                return ResponseEntity.status(HttpStatus.CREATED).body(savedMatch);
            }
            if (!shouldPromote) {
                log.info("기존 strong match 갱신: 중복 알림·단계 전환은 생략");
                return ResponseEntity.status(HttpStatus.CREATED).body(savedMatch);
            }

            // --- strong match에만 매칭 알림 생성 ---
            Optional<JobCandProgress> progressOpt = jobCandProgressRepository.findByCandPortfolioIdAndPost_PostId(candPortfolioId, jobPostingId);
            if (progressOpt.isPresent()) {
                JobCandProgress progress = progressOpt.get();
                Long candidateId = progress.getCandidate().getCandidateId();
                Long companyAdminId = progress.getPost().getCompanyAdminId();
                Long companyId = progress.getPost().getCompanyId();

                System.out.println("알림 생성 시도: candidateId=" + candidateId + ", companyAdminId=" + companyAdminId + ", companyId=" + companyId);

                // 기업 알림
                companyNotificationService.createMatchedCandidateNotification(
                    companyAdminId, jobPostingId, candidateId
                );
                System.out.println("기업 알림 생성 완료");
                // 개인 알림
                candidateNotificationService.createCompanyMatchedNotification(
                    candidateId, jobPostingId, companyId
                );
                System.out.println("개인 알림 생성 완료");
            } else {
                // progress가 없으면 새로 생성
                // candPortfolioId로 candidateId 조회
                CandidatePortfolio candidatePortfolio = candidatePortfolioRepository.findById(candPortfolioId).orElse(null);
                if (candidatePortfolio != null) {
                    Long candidateId = candidatePortfolio.getCandidateId();
                    // Post 엔티티 조회
                    Post post = postRepository.findById(jobPostingId).orElse(null);
                    if (post != null) {
                        Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
                        if (candidate != null) {
                            JobCandProgress newProgress = JobCandProgress.builder()
                                .post(post)
                                .candidate(candidate)
                                .candPortfolioId(candPortfolioId)
                                .jobCandCurrStage("2y")
                                .jobCandPortfolioSubDate(java.time.LocalDateTime.now())
                                .jobCandCreatedAt(java.time.LocalDateTime.now())
                                .jobCandUpdatedAt(java.time.LocalDateTime.now())
                                .githubLogin(candidate.getGithubLogin())
                                .build();
                            jobCandProgressRepository.save(newProgress);
                            System.out.println("[AUTO] JobCandProgress 새로 생성: portfolioId=" + candPortfolioId + ", postId=" + jobPostingId);
                        }
                    }
                }
                System.out.println("progressOpt가 비어 있음: portfolioId=" + candPortfolioId + ", jobPostingId=" + jobPostingId);
            }
            
            // job_cand_progress 테이블의 job_cand_curr_stage를 '2y'로 업데이트
            updateJobCandProgressStage(candPortfolioId, jobPostingId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMatch);
            
        } catch (Exception e) {
            log.error("포트폴리오-채용공고 매칭 결과 저장 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("매칭 결과 저장 중 오류가 발생했습니다.");
        }
    }
    
    private void updateJobCandProgressStage(Long portfolioId, Long jobPostingId) {
        try {
            // cand_portfolio_id로 JobCandProgress 조회
            List<JobCandProgress> progressList = jobCandProgressRepository.findByCandPortfolioId(portfolioId);
            
            for (JobCandProgress progress : progressList) {
                // post_id가 일치하는 경우에만 stage 업데이트
                if (progress.getPost().getPostId().equals(jobPostingId)) {
                    String currentStage = progress.getJobCandCurrStage();
                    if ("0".equals(currentStage) || "1n".equals(currentStage) || "2n".equals(currentStage)) {
                        log.info("PortfolioJobMatch Stage 업데이트: {} → 2y", currentStage);
                        progress.setJobCandCurrStage("2y");
                        jobCandProgressRepository.save(progress);
                    }
                    break; // 첫 번째 일치하는 항목만 업데이트
                }
            }
        } catch (Exception e) {
            log.error("JobCandProgress stage 업데이트 실패: {}", e.getMessage(), e);
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}")
    public ResponseEntity<?> getMatchesByPortfolioId(@PathVariable Long portfolioId) {
        try {
            List<PortfolioJobMatch> matches = portfolioJobMatchRepository.findByCandPortfolioIdOrderByMatchingScoreDesc(portfolioId);
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            log.error("포트폴리오 매칭 결과 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("매칭 결과 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @GetMapping("/post/{postId}")
    public ResponseEntity<?> getMatchesByPostId(@PathVariable Long postId) {
        try {
            List<PortfolioJobMatch> matches = portfolioJobMatchRepository.findByPostIdOrderByMatchingScoreDesc(postId);
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            log.error("공고별 매칭 결과 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("매칭 결과 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @GetMapping("/top-matches/{postId}")
    public ResponseEntity<?> getTopMatchesByPostId(@PathVariable Long postId, 
                                                   @RequestParam(defaultValue = "30.0") Double minScore) {
        try {
            List<PortfolioJobMatch> matches = portfolioJobMatchRepository.findTopMatchesByPostId(postId, minScore);
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            log.error("상위 매칭 결과 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("매칭 결과 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @GetMapping("/portfolio/{portfolioId}/job-candidate-id")
    public ResponseEntity<?> getJobCandidateIdByPortfolio(@PathVariable Long portfolioId) {
        try {
            // portfolio_id로 job_cand_progress에서 job_candidate_id 조회
            Optional<JobCandProgress> progress = jobCandProgressRepository
                    .findByCandPortfolioId(portfolioId)
                    .stream()
                    .findFirst();
            
            if (progress.isPresent()) {
                Map<String, Object> result = new HashMap<>();
                result.put("jobCandidateId", progress.get().getJobCandidateId());
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            log.error("job_candidate_id 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("job_candidate_id 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/candidate/{candidateId}/post/{postId}")
    public ResponseEntity<?> getCandidateMatchInfo(@PathVariable Integer candidateId, @PathVariable Long postId) {
        try {
            // 1. candidate_id로 cand_portfolio_id 조회
            Long candPortfolioId = jobCandProgressRepository.findByCandidate_CandidateId(candidateId.intValue())
                    .stream()
                    .filter(progress -> progress.getPost().getPostId().equals(postId))
                    .map(progress -> progress.getCandPortfolioId())
                    .findFirst()
                    .orElse(null);
            
            if (candPortfolioId == null) {
                return ResponseEntity.ok(Map.of("hasMatch", false));
            }
            
            // 2. 매칭 정보 조회
            PortfolioJobMatch match = portfolioJobMatchRepository.findByCandPortfolioIdAndPostId(candPortfolioId, postId)
                    .orElse(null);
            
            // 3. 포트폴리오 분석 정보 조회
            List<AiAnalysisResult> portfolioAnalysis = aiAnalysisResultRepository
                    .findByJobCandidateIdAndAnalysisType(candidateId.longValue(), "standalone_portfolio");
            
            Map<String, Object> result = new HashMap<>();
            result.put("hasMatch", match != null);
            
            if (match != null) {
                result.put("matchingScore", match.getMatchingScore());
                result.put("matchingReason", match.getMatchingReason());
                result.put("matchCreatedAt", match.getMatchCreatedAt());
            }
            
            if (!portfolioAnalysis.isEmpty()) {
                // 가장 최근 분석 결과 사용
                AiAnalysisResult latestAnalysis = portfolioAnalysis.get(0);
                result.put("portfolioAnalysis", latestAnalysis.getAnalysisData());
                result.put("portfolioAnalysisScore", latestAnalysis.getAnalysisScore());
                result.put("portfolioAnalysisDate", latestAnalysis.getAnalysisDate());
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("후보자 매칭 정보 조회 중 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("매칭 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // === [프론트엔드 요청에 맞는 단일 매칭 조회 엔드포인트 추가] ===
    @GetMapping("/portfolio/{candPortfolioId}/post/{postId}")
    public ResponseEntity<?> getMatchByPortfolioIdAndPostId(@PathVariable Long candPortfolioId, @PathVariable Long postId) {
        try {
            Optional<PortfolioJobMatch> matchOpt = portfolioJobMatchRepository.findByCandPortfolioIdAndPostId(candPortfolioId, postId);
            if (matchOpt.isPresent()) {
                return ResponseEntity.ok(matchOpt.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("매칭 정보를 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            log.error("포트폴리오+공고 매칭 단일 조회 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("매칭 단일 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}

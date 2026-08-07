package com.zoop.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.zoop.backend.config.GithubBridgeConfig;
import com.zoop.backend.domain.dto.FilterRequestDto;
import com.zoop.backend.domain.dto.GithubCandidateDto;
import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.GithubSearchResult;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.AiAnalysisResultRepository;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.GithubSearchResultRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PostRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class GithubBridgeService {

    private final GithubSearchResultRepository resultRepo;
    private final AiAnalysisResultRepository aiAnalysisResultRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final GithubBridgeConfig config;
    private final PostRepository postRepository;
    private final JobCandProgressRepository jobCandProgressRepository;
    private final CandidateRepository candidateRepository;

    @Transactional
    public void fetchFromPythonAndSave(FilterRequestDto filter) {
        try {
            // null 체크 추가
            if (filter == null) {
                throw new RuntimeException("FilterRequestDto가 null입니다.");
            }
            
            if (filter.getPostId() == null) {
                throw new RuntimeException("Post ID가 null입니다.");
            }
            
            // 1. postId로 Post 엔티티 조회
            Post post = postRepository.findById(filter.getPostId())
                .orElseThrow(() -> new RuntimeException("해당 postId의 공고가 없습니다: " + filter.getPostId()));

            // 2. Post 엔티티에서 필터 정보 추출 (콤마로 구분된 문자열을 리스트로 변환)
            List<String> languages = post.getPostProgrammingLanguage() != null && !post.getPostProgrammingLanguage().isBlank()
                ? Arrays.asList(post.getPostProgrammingLanguage().split(",")) : new ArrayList<>();
            List<String> regions = post.getPostLocation() != null && !post.getPostLocation().isBlank()
                ? Arrays.asList(post.getPostLocation().split(",")) : new ArrayList<>();
            int headcount = post.getPostHeadcount() != null ? post.getPostHeadcount() : 5; // 기본값 5
            String idealCandidate = post.getPostIdealCandidate();

            // 3. Python API에 보낼 Map 생성
            Map<String, Object> pythonFilter = new HashMap<>();
            pythonFilter.put("languages", languages);
            pythonFilter.put("regions", regions);
            pythonFilter.put("nationwide", false); // 필요시 post에서 추출
            pythonFilter.put("headcount", headcount);
            pythonFilter.put("idealCandidate", idealCandidate != null ? idealCandidate : "");
            pythonFilter.put("language", filter.getLanguage() != null ? filter.getLanguage() : "en");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(pythonFilter, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                config.getUrl() + "/search", HttpMethod.POST, requestEntity, Map.class
            );

            if (response.getBody() == null) {
                throw new RuntimeException("Python API에서 응답이 null입니다.");
            }

            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
            
            if (candidates == null) {
                System.out.println("[WARNING] Python API에서 candidates가 null입니다.");
                return;
            }

            for (Map<String, Object> user : candidates) {
                // 점수 파싱 개선 (llm_score 또는 score 둘 다 시도)
                Double score = null;
                if (user.get("llm_score") != null) {
                    if (user.get("llm_score") instanceof Number) {
                        score = ((Number) user.get("llm_score")).doubleValue();
                    } else if (user.get("llm_score") instanceof String) {
                        try {
                            score = Double.parseDouble((String) user.get("llm_score"));
                        } catch (NumberFormatException e) {
                            System.err.println("[ERROR] llm_score 파싱 실패: " + user.get("llm_score"));
                        }
                    }
                } else if (user.get("score") != null) {
                    if (user.get("score") instanceof Number) {
                        score = ((Number) user.get("score")).doubleValue();
                    } else if (user.get("score") instanceof String) {
                        try {
                            score = Double.parseDouble((String) user.get("score"));
                        } catch (NumberFormatException e) {
                            System.err.println("[ERROR] score 파싱 실패: " + user.get("score"));
                        }
                    }
                } else {
                    System.out.println("[WARNING] llm_score와 score 모두 null 또는 0");
                }

                // GitHub 검색 결과 저장
                
                GithubSearchResult result = GithubSearchResult.builder()
                    .postId(post.getPostId())
                    .githubLogin((String) user.get("login"))
                    .githubProfileUrl((String) user.get("profile_url"))
                    .candidateEmail((String) user.get("email"))
                    .analysisScore(score)
                    .githubSearchDate(LocalDateTime.now())
                    .githubCreatedAt(LocalDateTime.now())
                    .build();

                GithubSearchResult savedResult = resultRepo.save(result);
                
                // === AI 분석 결과 저장 ===
                if (user.get("analysis") != null) {
                    try {
                        String analysisData = (String) user.get("analysis");
                        Double analysisScore = score; // llm_score를 분석 점수로 사용
                        
                        AiAnalysisResult aiAnalysis = AiAnalysisResult.builder()
                            .analysisType("github")
                            .githubSearchResultId(savedResult.getGithubSearchResultId())
                            .jobCandidateId(null) // GitHub 검색 결과는 jobCandidateId가 없을 수 있음
                            .analysisData(analysisData)
                            .analysisScore(analysisScore)
                            .analysisDate(LocalDateTime.now())
                            .analysisCreatedAt(LocalDateTime.now())
                            .build();
                        
                        AiAnalysisResult savedAiAnalysis = aiAnalysisResultRepository.save(aiAnalysis);
                        // GitHub 검색 결과에 AI 분석 ID 연결
                        savedResult.setAiGithubAnalysisId(savedAiAnalysis.getAnalysisId());
                        resultRepo.save(savedResult);
                        
                    } catch (Exception e) {
                        System.err.println("[ERROR] AI 분석 결과 저장 실패: " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                // === JobCandProgress 저장 ===
                String githubLogin = (String) user.get("login");
                Optional<Candidate> candidateOpt = candidateRepository.findByGithubLogin(githubLogin);
                Candidate candidate = candidateOpt.orElse(null);
                
                // postId + githubLogin 조합으로 중복 체크
                Optional<JobCandProgress> existing = jobCandProgressRepository.findByPost_PostIdAndGithubLogin(post.getPostId(), githubLogin);
                JobCandProgress progress = existing.orElseGet(JobCandProgress::new);
                progress.setPost(post);
                progress.setGithubLogin(githubLogin);
                progress.setCandidate(candidate);
                progress.setJobCandCurrStage("1n");
                progress.setJobCandCreatedAt(LocalDateTime.now());
                progress.setJobCandUpdatedAt(LocalDateTime.now());
                jobCandProgressRepository.save(progress);
            }
        } catch (Exception e) {
            System.err.println("[ERROR] fetchFromPythonAndSave 예외: " + e.getMessage());
            e.printStackTrace();
        }
    }
    

    @Transactional
    public void saveGithubCandidates(Long postId, List<GithubCandidateDto> candidates) {
        for (GithubCandidateDto dto : candidates) {
            GithubSearchResult result = GithubSearchResult.builder()
                .postId(postId)
                .githubLogin(dto.getLogin())
                .githubProfileUrl(dto.getProfileUrl())
                .candidateEmail(dto.getEmail())
                .analysisScore(dto.getScore())
                .githubSearchDate(LocalDateTime.now())
                .githubCreatedAt(LocalDateTime.now())
                .build();
            
            resultRepo.save(result);
        }
    }

    // 인재상 저장
    public void saveIdealCandidateToPost(Long postId, String idealCandidate) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post not found: " + postId));
        post.setPostIdealCandidate(idealCandidate);
        postRepository.save(post);
    }
}

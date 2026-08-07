package com.zoop.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.zoop.backend.domain.dto.AiAnalysisResultDto;
import com.zoop.backend.domain.entity.CandidatePortfolio;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.repository.CandidatePortfolioRepository;
import com.zoop.backend.repository.PostRepository;
import com.zoop.backend.repository.PortfolioJobMatchRepository;
import com.zoop.backend.domain.entity.PortfolioJobMatch;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PortfolioMatchingService {
    
    @Autowired
    private CandidatePortfolioRepository candidatePortfolioRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private AiAnalysisResultService aiAnalysisResultService;

    @Autowired
    private PortfolioJobMatchRepository portfolioJobMatchRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${python.matching.api.url:http://localhost:8003}")
    private String pythonMatchingApiUrl;
    
    /**
     * PENDING 상태의 candidate_portfolios를 찾아서 AI 분석 실행
     */
    public void analyzePendingCandidatePortfolios() {
        List<CandidatePortfolio> pendingPortfolios = candidatePortfolioRepository.findByPortfolioAnalysisStatus("PENDING");
        log.info("PENDING 상태의 candidate_portfolios 발견: {}개", pendingPortfolios.size());
        
        for (CandidatePortfolio portfolio : pendingPortfolios) {
            try {
                log.info("포트폴리오 분석 시작: candPortfolioId={}", portfolio.getCandPortfolioId());
                
                // Python API 호출하여 AI 분석 실행
                String analysisResult = callPortfolioAnalysisAPI(portfolio);
                
                if (analysisResult != null && !analysisResult.isBlank()) {
                    // AI 분석 결과를 ai_analysis_result 테이블에 저장 (type: "standalone_portfolio")
                    // 먼저 job_candidate_id 없이 저장
                    AiAnalysisResultDto dto = AiAnalysisResultDto.builder()
                        .analysisType("standalone_portfolio")
                        .jobCandidateId(null) // 나중에 업데이트할 예정
                        .candPortfolioId(portfolio.getCandPortfolioId())
                        .analysisData(analysisResult)
                        .analysisScore(extractScore(analysisResult))
                        .build();
                    
                    AiAnalysisResult savedAnalysis = aiAnalysisResultService.saveAiAnalysisResult(dto);
                    
                    // 포트폴리오 상태를 COMPLETED로 명시적으로 업데이트
                    candidatePortfolioRepository.updatePortfolioStatus(portfolio.getCandPortfolioId(), "COMPLETED");
                    // candidatePortfolioRepository.save(portfolio); // 기존 코드 주석 처리
                    
                    log.info("포트폴리오 분석 완료: candPortfolioId={}, analysisId={}", 
                            portfolio.getCandPortfolioId(), savedAnalysis.getAnalysisId());
                }
                
            } catch (Exception e) {
                log.error("포트폴리오 분석 실패: candPortfolioId={}", portfolio.getCandPortfolioId(), e);
                
                // 분석 실패 시 상태를 FAILED로 명시적으로 업데이트
                candidatePortfolioRepository.updatePortfolioStatus(portfolio.getCandPortfolioId(), "FAILED");
                // candidatePortfolioRepository.save(portfolio); // 기존 코드 주석 처리
            }
        }
    }
    
    /**
     * Python API를 호출하여 포트폴리오 분석 실행
     */
    private String callPortfolioAnalysisAPI(CandidatePortfolio portfolio) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            // Form 데이터 구성
            var formData = new org.springframework.util.LinkedMultiValueMap<String, String>();
            formData.add("file_url", portfolio.getPortfolioFilePath());
            formData.add("cand_portfolio_id", String.valueOf(portfolio.getCandPortfolioId()));
            formData.add("candidate_id", String.valueOf(portfolio.getCandidateId()));
            
            HttpEntity<org.springframework.util.MultiValueMap<String, String>> entity = new HttpEntity<>(formData, headers);
            
            ResponseEntity<java.util.Map> response = restTemplate.postForEntity(
                    pythonMatchingApiUrl + "/analyze-candidate-portfolio", entity, java.util.Map.class);
            
            if (response.getBody() != null) {
                return (String) response.getBody().get("analysis_data");
            }
            
        } catch (Exception e) {
            log.error("Python API 호출 실패", e);
        }
        
        return null;
    }
    
    /**
     * 분석 결과에서 점수 추출
     */
    private Double extractScore(String result) {
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\(점수: (\\d+)점\\)").matcher(result);
            if (m.find()) return Double.valueOf(m.group(1));
        } catch (Exception ignore) {}
        return null;
    }
    
    /**
     * 포트폴리오 매칭 처리를 비동기로 실행
     */
    @Async
    public void processPortfolioMatching(Long candPortfolioId) {
        try {
            log.info("포트폴리오 매칭 시작: candPortfolioId={}", candPortfolioId);
            
            // 1. 포트폴리오 정보 조회
            CandidatePortfolio portfolio = candidatePortfolioRepository.findById(candPortfolioId)
                    .orElseThrow(() -> new RuntimeException("포트폴리오를 찾을 수 없습니다: " + candPortfolioId));
            
            // 2. 활성 공고 목록 조회
            List<Post> activePosts = postRepository.findByPostStatusOrderByPostCreatedAtDesc("ACTIVE");
            
            // 3. Python API 호출하여 AI 매칭 실행
            callPortfolioMatchingAPI(portfolio, activePosts);
            
            // 4. 분석 상태 업데이트 (PENDING 유지)
            // portfolio.setPortfolioAnalysisStatus("COMPLETED");
            // candidatePortfolioRepository.save(portfolio);
            
            log.info("포트폴리오 매칭 완료: candPortfolioId={}", candPortfolioId);
            
        } catch (Exception e) {
            log.error("포트폴리오 매칭 중 오류 발생: candPortfolioId={}", candPortfolioId, e);
            
            // 오류 시 상태 업데이트
            try {
                CandidatePortfolio portfolio = candidatePortfolioRepository.findById(candPortfolioId).orElse(null);
                if (portfolio != null) {
                    portfolio.setPortfolioAnalysisStatus("FAILED");
                    candidatePortfolioRepository.save(portfolio);
                }
            } catch (Exception updateError) {
                log.error("포트폴리오 상태 업데이트 실패", updateError);
            }
        }
    }
    
    /**
     * Python API를 호출하여 포트폴리오 매칭 실행
     */
    private void callPortfolioMatchingAPI(CandidatePortfolio portfolio, List<Post> activePosts) {
        try {
            // Python API 엔드포인트 호출 (포트 8003)
            String pythonApiUrl = pythonMatchingApiUrl + "/analyze-portfolio";
            
            log.info("Python API 호출: portfolioId={}, activePostsCount={}", 
                    portfolio.getCandPortfolioId(), activePosts.size());
            
            // TODO: 실제 HTTP 클라이언트 구현
            // RestTemplate 또는 WebClient를 사용하여 Python API 호출
            // 현재는 로그만 출력하고 실제 호출은 Python 서버에서 처리
            
        } catch (Exception e) {
            log.error("Python API 호출 중 오류", e);
            throw new RuntimeException("AI 매칭 API 호출 실패", e);
        }
    }
    
    /**
     * 특정 공고에 대한 매칭된 포트폴리오 조회
     */
    public List<PortfolioJobMatch> getMatchedPortfoliosForJob(Long postId) {
        if (postId == null) {
            return List.of();
        }
        return portfolioJobMatchRepository.findByPostIdOrderByMatchingScoreDesc(postId);
    }
}

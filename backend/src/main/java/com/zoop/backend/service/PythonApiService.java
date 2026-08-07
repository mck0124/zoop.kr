package com.zoop.backend.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class PythonApiService {

    @Value("${python.api.url:http://localhost:8000}")
    private String pythonApiUrl;

    // 면접 예상질문 전용 URL (8003포트)
    @Value("${python.interview.api.url:http://localhost:8003}")
    private String pythonInterviewApiUrl;

    private final RestTemplate restTemplate;

    public PythonApiService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Python FastAPI에 면접 예상질문 생성 요청
     */
    public List<String> generatePreparationQuestions(
            String postTitle, 
            String postDescription, 
            String programmingLanguage, 
            String idealCandidate, 
            String location, 
            String salaryRange, 
            Integer headcount, 
            String portfolioAnalysis) {
        
        try {
            log.info("Python API 호출 시작: {}/generate-preparation-questions", pythonInterviewApiUrl);
            log.info("요청 파라미터 - postTitle: {}, programmingLanguage: {}", postTitle, programmingLanguage);
            
            // 🔍 디버깅: 실제 전송되는 데이터 상세 로그
            log.info("=== Python API 전송 데이터 상세 ===");
            log.info("postTitle: '{}'", postTitle);
            log.info("postDescription: '{}'", postDescription);
            log.info("programmingLanguage: '{}'", programmingLanguage);
            log.info("idealCandidate: '{}' (length: {})", idealCandidate, idealCandidate != null ? idealCandidate.length() : "null");
            log.info("location: '{}' (length: {})", location, location != null ? location.length() : "null");
            log.info("salaryRange: '{}'", salaryRange);
            log.info("headcount: {}", headcount);
            log.info("portfolioAnalysis: '{}' (length: {})", portfolioAnalysis, portfolioAnalysis != null ? portfolioAnalysis.length() : "null");
            log.info("================================");
            
            // Form 데이터 준비
            MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
            formData.add("post_title", postTitle != null ? postTitle : "");
            formData.add("post_description", postDescription != null ? postDescription : "");
            formData.add("programming_language", programmingLanguage != null ? programmingLanguage : "");
            formData.add("ideal_candidate", idealCandidate != null ? idealCandidate : "");
            formData.add("location", location != null ? location : "");
            formData.add("salary_range", salaryRange != null ? salaryRange : "");
            formData.add("headcount", headcount != null ? String.valueOf(headcount) : "1");
            formData.add("portfolio_analysis", portfolioAnalysis != null ? portfolioAnalysis : "");

            // 🔍 디버깅: 실제 전송되는 Form 데이터 로그
            log.info("=== 실제 전송되는 Form 데이터 ===");
            formData.forEach((key, values) -> {
                log.info("{}: {}", key, values);
            });
            log.info("==============================");

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            // 요청 엔티티 생성
            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(formData, headers);

            // API 호출 - 면접 예상질문 전용 URL 사용 (8003포트)
            String url = pythonInterviewApiUrl + "/generate-preparation-questions";
            log.info("호출 URL: {}", url);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);

            // 응답 처리
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Boolean success = (Boolean) responseBody.get("success");
                
                if (Boolean.TRUE.equals(success)) {
                    List<String> questions = (List<String>) responseBody.get("questions");
                    log.info("Python API 호출 성공: {}개 질문 생성", questions != null ? questions.size() : 0);
                    return questions != null ? questions : getDefaultQuestions();
                } else {
                    String error = (String) responseBody.get("error");
                    log.error("Python API 응답 에러: {}", error);
                    return getDefaultQuestions();
                }
            } else {
                log.error("Python API 호출 실패: HTTP {}", response.getStatusCode());
                return getDefaultQuestions();
            }

        } catch (Exception e) {
            log.error("Python API 호출 중 예외 발생: {}", e.getMessage(), e);
            return getDefaultQuestions();
        }
    }

    /**
     * Python API 호출 실패 시 기본 질문 반환
     */
    public List<String> getDefaultQuestions() {
        log.info("기본 예상질문 반환");
        return Arrays.asList(
            "자기소개와 함께 이 직무에 지원한 동기를 말씀해주세요.",
            "본인의 기술적 강점과 경험에 대해 설명해주세요.",
            "우리 회사와 이 직무에 대해 어떻게 이해하고 계신가요?",
            "해당 기술 스택을 선택한 이유와 경험에 대해 말씀해주세요.",
            "가장 어려웠던 기술적 문제와 해결 과정을 설명해주세요.",
            "팀워크나 협업 경험 중 기억에 남는 사례가 있나요?",
            "개발자로서 본인의 성장 목표는 무엇인가요?",
            "최근에 관심 있게 학습하고 있는 기술이나 분야가 있나요?",
            "프로젝트에서 겪은 실패 경험과 배운 점이 있다면 말씀해주세요.",
            "우리 회사에서 어떤 기여를 하고 싶으신가요?"
        );
    }

    /**
     * Python API 서버 상태 확인
     */
    public boolean isHealthy() {
        try {
            String url = pythonApiUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Python API 상태 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 면접 예상질문 Python API 서버 상태 확인
     */
    public boolean isInterviewApiHealthy() {
        try {
            String url = pythonInterviewApiUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("면접 예상질문 Python API 상태 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    /** Server-side support assistant proxy. The OpenAI credential never reaches the browser. */
    public String answerSupportQuestion(String question) {
        try {
            Map<String, Object> payload = Map.of(
                "history", List.of(),
                "user_input", question,
                "lang", "ko"
            );
            ResponseEntity<Map> response = restTemplate.postForEntity(
                pythonApiUrl + "/chat", payload, Map.class);
            if (response.getBody() == null) return "AI 답변을 불러오지 못했습니다.";
            Object answer = response.getBody().get("answer");
            return answer != null ? answer.toString() : "AI 답변을 불러오지 못했습니다.";
        } catch (Exception e) {
            log.warn("고객센터 AI 호출 실패: {}", e.getMessage());
            return "현재 AI 상담이 잠시 지연되고 있습니다. FAQ에서 먼저 확인해 주세요.";
        }
    }
}

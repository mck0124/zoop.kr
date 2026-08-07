package com.zoop.backend.service;

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
            String portfolioAnalysis,
            String language) {
        
        try {
            log.info("Python API 호출 시작: {}/generate-preparation-questions", pythonInterviewApiUrl);
            log.info("요청 파라미터 - postTitle: {}, programmingLanguage: {}", postTitle, programmingLanguage);
            
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
            formData.add("language", language != null ? language : "en");

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
                    if (questions == null || questions.isEmpty()) {
                        throw new IllegalStateException("AI가 질문을 생성하지 못했습니다.");
                    }
                    return questions;
                } else {
                    String error = (String) responseBody.get("error");
                    log.error("Python API 응답 에러: {}", error);
                    throw new IllegalStateException(error != null ? error : "AI 질문 생성에 실패했습니다.");
                }
            } else {
                log.error("Python API 호출 실패: HTTP {}", response.getStatusCode());
                throw new IllegalStateException("AI 질문 서비스가 응답하지 않습니다.");
            }

        } catch (Exception e) {
            log.error("Python API 호출 중 예외 발생: {}", e.getMessage(), e);
            if (e instanceof IllegalStateException) throw (IllegalStateException) e;
            throw new IllegalStateException("AI 질문 서비스 호출에 실패했습니다.", e);
        }
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

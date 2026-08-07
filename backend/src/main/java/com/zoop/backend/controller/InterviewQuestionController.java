package com.zoop.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.zoop.backend.service.InterviewQuestionService;
import com.zoop.backend.repository.CandidateRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/interview-questions")
@Tag(name = "InterviewQuestionController", description = "면접 예상질문 관련 API")
@Slf4j
public class InterviewQuestionController {

    @Autowired
    private InterviewQuestionService interviewQuestionService;

    @Autowired
    private CandidateRepository candidateRepository;

    @Operation(summary = "면접 예상질문 생성", description = "특정 공고와 후보자에 대한 면접 예상질문을 생성합니다. 캐시가 있으면 캐시된 질문을, 없거나 내용이 변경되었으면 새로운 질문을 생성합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "질문 생성 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (공고 또는 후보자 정보 없음)"),
        @ApiResponse(responseCode = "403", description = "접근 권한 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/generate/{postId}/{candidateId}")
    public ResponseEntity<Map<String, Object>> generateQuestions(
        @Parameter(description = "공고 ID", required = true, example = "123")
        @PathVariable Long postId,
        @Parameter(description = "후보자 ID", required = true, example = "456")  
        @PathVariable Long candidateId
    ) {
        
        Map<String, Object> response = new HashMap<>();

        try {
            if (!ownsCandidate(candidateId)) {
                response.put("success", false);
                response.put("questions", List.of());
                response.put("error", "접근 권한이 없습니다.");
                return ResponseEntity.status(403).body(response);
            }
            log.info("면접 예상질문 생성 API 호출: postId={}, candidateId={}", postId, candidateId);
            
            // 면접 예상질문 생성
            List<String> questions = interviewQuestionService.generateInterviewQuestions(postId, candidateId);
            
            // 성공 응답
            response.put("success", true);
            response.put("questions", questions);
            response.put("error", null);
            
            log.info("면접 예상질문 생성 완료: {}개 질문 반환", questions.size());
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            log.error("면접 예상질문 생성 실패: {}", e.getMessage());
            
            // 에러 응답
            response.put("success", false);
            response.put("questions", List.of());
            response.put("error", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            log.error("면접 예상질문 생성 중 예상치 못한 오류: {}", e.getMessage(), e);
            
            // 서버 에러 응답
            response.put("success", false);
            response.put("questions", List.of());
            response.put("error", "서버 내부 오류가 발생했습니다.");
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "질문 존재 여부 확인", description = "특정 공고와 후보자에 대한 질문이 있는지 확인합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "확인 완료"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @GetMapping("/exists/{postId}/{candidateId}")
    public ResponseEntity<Map<String, Object>> checkQuestionsExist(
        @Parameter(description = "공고 ID", required = true, example = "123")
        @PathVariable Long postId,
        @Parameter(description = "후보자 ID", required = true, example = "456")
        @PathVariable Long candidateId
    ) {
        
        Map<String, Object> response = new HashMap<>();

        try {
            if (!ownsCandidate(candidateId)) {
                response.put("success", false);
                response.put("exists", false);
                response.put("error", "접근 권한이 없습니다.");
                return ResponseEntity.status(403).body(response);
            }
            boolean exists = interviewQuestionService.hasQuestions(postId, candidateId);
            
            response.put("success", true);
            response.put("exists", exists);
            response.put("error", null);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("질문 존재 여부 확인 중 오류: {}", e.getMessage(), e);
            
            response.put("success", false);
            response.put("exists", false);
            response.put("error", "확인 중 오류가 발생했습니다.");
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 에러 응답 생성 헬퍼 메서드
     */
    private Map<String, Object> createErrorResponse(String errorMessage) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("questions", List.of());
        response.put("error", errorMessage);
        return response;
    }

    private boolean ownsCandidate(Long candidateId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return candidateRepository.findById(candidateId)
                .map(candidate -> candidate.getGithubLogin() != null
                        && candidate.getGithubLogin().equals(authentication.getName()))
                .orElse(false);
    }
}

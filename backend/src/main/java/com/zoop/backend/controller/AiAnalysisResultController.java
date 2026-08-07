package com.zoop.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.dto.AiAnalysisResultDto;
import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.service.AiAnalysisResultService;
import com.zoop.backend.service.AiAccessService;
import com.zoop.backend.config.InternalApiKeyValidator;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "AiAnalysisResultController", description = "AI 분석 결과 관련 API")
@RestController
@RequestMapping("/api/ai-analysis-results")
@RequiredArgsConstructor
public class AiAnalysisResultController {

    private final AiAnalysisResultService aiAnalysisResultService;
    private final InternalApiKeyValidator internalApiKeyValidator;
    private final AiAccessService aiAccessService;

    @GetMapping
    public ResponseEntity<List<AiAnalysisResult>> getAllAiAnalysisResults() {
        if (!aiAccessService.isCompanyAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // 모든 AI 분석 결과 조회
        List<AiAnalysisResult> results = aiAnalysisResultService.findAll();
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{analysisId}")
    public ResponseEntity<AiAnalysisResult> getById(@PathVariable Long analysisId) {
        return aiAnalysisResultService.findById(analysisId)
                .filter(aiAccessService::canAccessAnalysis)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @Operation(summary = "AI 분석 결과 저장", description = "GitHub 후보자에 대한 AI 분석 결과를 저장합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "AI 분석 결과 저장 성공",
            content = @Content(schema = @Schema(implementation = AiAnalysisResult.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<AiAnalysisResult> saveAiAnalysisResult(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "AI 분석 결과 저장을 위한 데이터",
            required = true,
            content = @Content(schema = @Schema(implementation = AiAnalysisResultDto.class))
        )
        @RequestBody AiAnalysisResultDto dto,
        @RequestHeader(value = "X-Zoop-Internal-Key", required = false) String internalKey) {
        if (!internalApiKeyValidator.isAllowed(internalKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        AiAnalysisResult saved = aiAnalysisResultService.saveAiAnalysisResult(dto);
        return ResponseEntity.status(201).body(saved);
    }

    @Operation(summary = "GitHub 검색 결과 ID로 AI 분석 결과 조회", description = "특정 GitHub 검색 결과에 대한 AI 분석 결과를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "AI 분석 결과 반환",
            content = @Content(schema = @Schema(implementation = AiAnalysisResult.class))),
        @ApiResponse(responseCode = "404", description = "AI 분석 결과 없음")
    })
    @GetMapping("/github/{githubSearchResultId}")
    public ResponseEntity<AiAnalysisResult> getByGithubSearchResultId(
        @Parameter(description = "GitHub 검색 결과 ID", required = true, example = "1")
        @PathVariable Long githubSearchResultId) {
        
        return aiAnalysisResultService.findByGithubSearchResultId(githubSearchResultId)
                .filter(aiAccessService::canAccessAnalysis)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
    }

    @Operation(summary = "게시글 ID로 AI 분석 결과 목록 조회", description = "특정 채용 공고에 대한 모든 AI 분석 결과를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "AI 분석 결과 목록 반환",
            content = @Content(schema = @Schema(implementation = AiAnalysisResult.class)))
    })
    @GetMapping("/post/{postId}")
    public ResponseEntity<List<AiAnalysisResult>> getByPostId(
        @Parameter(description = "게시글 ID", required = true, example = "1")
        @PathVariable Long postId) {
        
        if (!aiAccessService.canAccessPost(postId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<AiAnalysisResult> results = aiAnalysisResultService.findByPostId(postId);
        return ResponseEntity.ok(results);
    }

    // AI 분석 결과의 job_candidate_id 업데이트
    @PutMapping("/{analysisId}/job-candidate-id")
    public ResponseEntity<?> updateJobCandidateId(
        @PathVariable Long analysisId,
        @RequestBody Map<String, Object> request,
        @RequestHeader(value = "X-Zoop-Internal-Key", required = false) String internalKey) {
        if (!internalApiKeyValidator.isAllowed(internalKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            Long jobCandidateId = Long.valueOf(request.get("jobCandidateId").toString());
            
            Optional<AiAnalysisResult> analysisOpt = aiAnalysisResultService.findById(analysisId);
            if (analysisOpt.isPresent()) {
                AiAnalysisResult analysis = analysisOpt.get();
                analysis.setJobCandidateId(jobCandidateId);
                aiAnalysisResultService.save(analysis);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "job_candidate_id가 성공적으로 업데이트되었습니다.",
                    "analysisId", analysisId,
                    "jobCandidateId", jobCandidateId
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AI 분석 결과 연결 업데이트 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/update-job-candidate-id")
    public ResponseEntity<?> updateJobCandidateId(@RequestBody Map<String, Long> request,
                                                   @RequestHeader(value = "X-Zoop-Internal-Key", required = false) String internalKey) {
        if (!internalApiKeyValidator.isAllowed(internalKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Long candPortfolioId = request.get("candPortfolioId");
        Long jobCandidateId = request.get("jobCandidateId");
        int updated = aiAnalysisResultService.updateJobCandidateIdForPortfolio(candPortfolioId, jobCandidateId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @Operation(summary = "분석 타입으로 AI 분석 결과 목록 조회", description = "특정 분석 타입의 AI 분석 결과를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "AI 분석 결과 목록 반환",
            content = @Content(schema = @Schema(implementation = AiAnalysisResult.class)))
    })
    @GetMapping("/type/{analysisType}")
    public ResponseEntity<List<AiAnalysisResult>> getByAnalysisType(
        @Parameter(description = "분석 타입 (github, portfolio, interview)", required = true, example = "github")
        @PathVariable String analysisType) {
        
        if (!aiAccessService.isCompanyAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<AiAnalysisResult> results = aiAnalysisResultService.findByAnalysisType(analysisType);
        return ResponseEntity.ok(results);
    }

    // 내 버전: 직접 지원자의 포트폴리오 AI 분석 결과 조회
    @Operation(summary = "직접 지원자의 AI 분석 결과 조회", description = "특정 직접 지원자의 포트폴리오 AI 분석 결과를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "AI 분석 결과 반환",
            content = @Content(schema = @Schema(implementation = AiAnalysisResult.class))),
        @ApiResponse(responseCode = "404", description = "AI 분석 결과 없음")
    })
    @GetMapping("/portfolio/{jobCandidateId}")
    public ResponseEntity<AiAnalysisResult> getPortfolioAnalysisByJobCandidateId(
        @Parameter(description = "직접 지원자의 job_candidate_id", required = true, example = "1")
        @PathVariable Long jobCandidateId) {
        
        if (!aiAccessService.canAccessJobCandidate(jobCandidateId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<AiAnalysisResult> results = aiAnalysisResultService.findByJobCandidateIdAndAnalysisType(jobCandidateId, "portfolio");
        if (results.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(results.get(0)); // 가장 최근 분석 결과 반환
    }

    // 팀 버전: AI 분석 결과 삭제 기능
    @Operation(summary = "AI 분석 결과 삭제", description = "특정 AI 분석 결과를 삭제합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "AI 분석 결과 삭제 성공"),
        @ApiResponse(responseCode = "404", description = "AI 분석 결과 없음")
    })
    @DeleteMapping("/{analysisId}")
    public ResponseEntity<Void> deleteAiAnalysisResult(
        @Parameter(description = "AI 분석 결과 ID", required = true, example = "1")
        @PathVariable Long analysisId) {
        
        var analysis = aiAnalysisResultService.findById(analysisId);
        if (analysis.isEmpty() || !aiAccessService.isCompanyAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        boolean deleted = aiAnalysisResultService.deleteById(analysisId);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}

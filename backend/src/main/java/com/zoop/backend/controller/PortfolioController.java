package com.zoop.backend.controller;

import java.util.Date;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoop.backend.domain.dto.CareerDataDto;
import com.zoop.backend.domain.dto.PortfolioSubmissionResponseDto;
import com.zoop.backend.domain.entity.CandidatePortfolio;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Portfolio;
import com.zoop.backend.repository.CandidatePortfolioRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PortfolioRepository;
import com.zoop.backend.service.PortfolioMatchingService;
import com.zoop.backend.service.PortfolioService;
import com.zoop.backend.service.S3Service;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "PortfolioController", description = "포트폴리오 제출 관련 API")
@RestController
@RequestMapping("/api/portfolios")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final ObjectMapper objectMapper;
    private final PortfolioRepository portfolioRepository;
    private final S3Service s3Service;
    private final CandidatePortfolioRepository candidatePortfolioRepository;
    private final PortfolioMatchingService portfolioMatchingService;
    private final JobCandProgressRepository jobCandProgressRepository;
    
    @Autowired
    public PortfolioController(PortfolioService portfolioService, ObjectMapper objectMapper, PortfolioRepository portfolioRepository, S3Service s3Service, CandidatePortfolioRepository candidatePortfolioRepository, PortfolioMatchingService portfolioMatchingService, JobCandProgressRepository jobCandProgressRepository) {
        this.portfolioService = portfolioService;
        this.objectMapper = objectMapper;
        this.portfolioRepository = portfolioRepository;
        this.s3Service = s3Service;
        this.candidatePortfolioRepository = candidatePortfolioRepository;
        this.portfolioMatchingService = portfolioMatchingService;
        this.jobCandProgressRepository = jobCandProgressRepository;
    }
    
    @Operation(summary = "포트폴리오 제출", description = "지원자가 포트폴리오와 관련 정보를 제출합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "포트폴리오 제출 성공",
            content = @Content(schema = @Schema(implementation = PortfolioSubmissionResponseDto.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 동의 누락 등)"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<?> submitPortfolio(
            @Parameter(description = "공고 ID", required = true)
            @RequestParam("postId") Integer postId,
            
            @Parameter(description = "지원자 ID", required = true)
            @RequestParam("candidateId") Integer candidateId,
            
            @Parameter(description = "포트폴리오 파일 (새 파일 업로드 시)")
            @RequestParam(value = "portfolioFile", required = false) MultipartFile portfolioFile,
            
            @Parameter(description = "기존 포트폴리오 사용 여부")
            @RequestParam(value = "useExistingPortfolio", required = false, defaultValue = "false") String useExistingPortfolio,
            
            @Parameter(description = "기존 포트폴리오 파일 경로")
            @RequestParam(value = "existingPortfolioPath", required = false) String existingPortfolioPath,
            
            @Parameter(description = "포트폴리오 URL (선택사항)")
            @RequestParam("portfolioUrl") String portfolioUrl,
            
            @Parameter(description = "경력 정보 (JSON 형식)")
            @RequestParam("careerData") String careerDataJson,
            
            @Parameter(description = "지원 목표 및 동기")
            @RequestParam("goalStatement") String goalStatement,
            
            @Parameter(description = "직무 적합성")
            @RequestParam("suitabilityStatement") String suitabilityStatement,
            
            @Parameter(description = "필수 개인정보 수집 동의")
            @RequestParam("agreeRequiredPersonal") Boolean agreeRequiredPersonal,
            
            @Parameter(description = "선택 개인정보 수집 동의")
            @RequestParam("agreeOptionalPersonal") Boolean agreeOptionalPersonal,
            
            @Parameter(description = "추후 포지션 제안 동의")
            @RequestParam("agreeFutureProposals") Boolean agreeFutureProposals,
            
            @Parameter(description = "채용정보 수신 동의")
            @RequestParam("agreeReceiveRecruitmentInfo") Boolean agreeReceiveRecruitmentInfo,
            
            @Parameter(description = "포트폴리오 제출 소스 (예: 'direct', 'resume', 'standalone')")
            @RequestParam(value = "source", required = false) String source
    ) {
        try {
            // JSON 문자열을 객체로 변환
            CareerDataDto careerData = objectMapper.readValue(careerDataJson, CareerDataDto.class);
            
            // 포트폴리오 저장 서비스 호출
            PortfolioSubmissionResponseDto response = portfolioService.submitPortfolio(
                postId, 
                candidateId, 
                portfolioFile, 
                Boolean.parseBoolean(useExistingPortfolio),
                existingPortfolioPath,
                portfolioUrl, 
                careerData, 
                goalStatement, 
                suitabilityStatement, 
                agreeRequiredPersonal, 
                agreeOptionalPersonal, 
                agreeFutureProposals, 
                agreeReceiveRecruitmentInfo,
                source
            );
            
            // 리다이렉션 URL 추가
            response.setRedirectUrl("/candidate/dashboard");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 제출 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PostMapping("/standalone")
    public ResponseEntity<?> submitStandalonePortfolio(
            @RequestParam("candidateId") Long candidateId,
            @RequestParam(value = "portfolioFile", required = false) MultipartFile portfolioFile,
            @RequestParam(value = "portfolioUrl", required = false) String portfolioUrl,
            @RequestParam(value = "portfolioDescription", required = false) String portfolioDescription
    ) {
        try {
            // 1. candidate_portfolios 테이블에 저장
            String portfolioFilePath = null;
            if (portfolioFile != null && !portfolioFile.isEmpty()) {
                try {
                    portfolioFilePath = s3Service.uploadPortfolioFile(portfolioFile);
                } catch (Exception s3Error) {
                    // S3 업로드 실패는 제출을 성공으로 처리하지 않는다.
                    throw new RuntimeException("포트폴리오 파일 업로드에 실패했습니다.", s3Error);
                }
            }

            // CandidatePortfolio 엔티티 생성 및 저장
            CandidatePortfolio portfolio = CandidatePortfolio.builder()
                    .candidateId(candidateId)
                    .portfolioFilePath(portfolioFilePath)
                    .portfolioAnalysisStatus("COMPLETED")
                    .portfolioCreatedAt(new Date())
                    .portfolioUpdatedAt(new Date())
                    .build();

            CandidatePortfolio savedPortfolio = candidatePortfolioRepository.save(portfolio);

            // 3. JobCandProgress에서 해당 candidate의 stage를 2y로 업데이트
            try {
                List<JobCandProgress> progressList = jobCandProgressRepository.findByCandidate_CandidateId(candidateId.intValue());
                for (JobCandProgress progress : progressList) {
                    String currentStage = progress.getJobCandCurrStage();
                    if ("0".equals(currentStage) || "1n".equals(currentStage) || "2n".equals(currentStage)) {
                        System.out.println("[PortfolioController] Standalone 포트폴리오 제출 - Stage 업데이트: " + currentStage + " → 2y");
                        progress.setJobCandCurrStage("2y");
                        jobCandProgressRepository.save(progress);
                    }
                }
            } catch (Exception e) {
                System.err.println("[PortfolioController] Stage 업데이트 중 오류: " + e.getMessage());
            }

            // 2. AI 분석 및 매칭 실행 (비동기)
            portfolioMatchingService.processPortfolioMatching(savedPortfolio.getCandPortfolioId());

            Map<String, Object> response = new HashMap<>();
            response.put("portfolioId", savedPortfolio.getCandPortfolioId());
            response.put("message", "포트폴리오가 성공적으로 제출되었습니다. AI 분석이 진행 중입니다.");
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("[PortfolioController] 포트폴리오 제출 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "포트폴리오 제출 중 오류가 발생했습니다."));
        }
    }

    // 이력서 등록용 포트폴리오 업로드 API (새로 추가)
    @PostMapping("/resume-upload")
    public ResponseEntity<?> uploadResumePortfolio(
            @RequestParam("candidateId") Long candidateId,
            @RequestParam(value = "portfolioFile", required = false) MultipartFile portfolioFile
    ) {
        try {
            // 파일이 없으면 insert 시도하지 않고 400 에러 반환
            if (portfolioFile == null || portfolioFile.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이력서 파일을 첨부해 주세요.");
            }

            // 1. candidate_portfolios 테이블에 저장
            String portfolioFilePath = null;
            if (portfolioFile != null && !portfolioFile.isEmpty()) {
                try {
                    portfolioFilePath = s3Service.uploadPortfolioFile(portfolioFile);
                } catch (Exception s3Error) {
                    throw new RuntimeException("이력서 파일 업로드에 실패했습니다.", s3Error);
                }
            }

            // CandidatePortfolio 엔티티 생성 및 저장
            CandidatePortfolio portfolio = CandidatePortfolio.builder()
                    .candidateId(candidateId)
                    .portfolioFilePath(portfolioFilePath)
                    .portfolioAnalysisStatus("PENDING")
                    .portfolioCreatedAt(new Date())
                    .portfolioUpdatedAt(new Date())
                    .build();

            CandidatePortfolio savedPortfolio = candidatePortfolioRepository.save(portfolio);

            // 응답 DTO에 S3 URL 포함
            PortfolioSubmissionResponseDto response = new PortfolioSubmissionResponseDto();
            response.setPortfolioId(savedPortfolio.getCandPortfolioId().intValue());
            response.setPortfolioFilePath(savedPortfolio.getPortfolioFilePath());
            response.setSuccess(true);
            response.setMessage("이력서 포트폴리오가 성공적으로 업로드되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 제출 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Operation(summary = "지원자별 포트폴리오 조회", description = "특정 지원자가 특정 공고에 제출한 포트폴리오를 조회합니다.")
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<?> getPortfoliosByCandidate(
            @Parameter(description = "지원자 ID", required = true)
            @PathVariable Integer candidateId,
            @Parameter(description = "공고 ID (선택사항)")
            @RequestParam(required = false) Integer postId
    ) {
        try {
            return ResponseEntity.ok(portfolioService.getPortfoliosByCandidate(candidateId, postId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Operation(summary = "포트폴리오 상세 조회", description = "특정 포트폴리오의 상세 정보를 조회합니다.")
    @GetMapping("/{portfolioId}")
    public ResponseEntity<?> getPortfolio(
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Integer portfolioId
    ) {
        try {
            return portfolioService.getPortfolio(portfolioId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "공고별 직접 지원자 조회", description = "특정 공고에 포트폴리오를 제출한 직접 지원자 목록을 조회합니다.")
    @GetMapping("/by-post/{postId}")
    public ResponseEntity<?> getDirectApplicantsByPost(
            @Parameter(description = "공고 ID", required = true)
            @PathVariable Integer postId
    ) {
        try {
            return ResponseEntity.ok(portfolioService.getDirectApplicantsByPost(postId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("직접 지원자 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "지원자의 최근 포트폴리오 조회", description = "지원자의 가장 최근에 업로드한 포트폴리오 정보를 조회합니다.")
    @GetMapping("/recent/{candidateId}")
    public ResponseEntity<?> getRecentPortfolioByCandidate(
            @Parameter(description = "지원자 ID", required = true)
            @PathVariable Integer candidateId
    ) {
        try {
            return ResponseEntity.ok(portfolioService.getRecentPortfolioByCandidate(candidateId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("최근 포트폴리오 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "PENDING 상태 포트폴리오 목록 조회", description = "분석 대기 중인 포트폴리오 전체를 반환합니다.")
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingPortfolios() {
        try {
            return ResponseEntity.ok(portfolioService.getPendingPortfolios());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("PENDING 포트폴리오 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "포트폴리오 분석 상태 업데이트", description = "특정 포트폴리오의 분석 상태를 업데이트합니다.")
    @PutMapping("/{portfolioId}/analysis-status")
    public ResponseEntity<?> updatePortfolioAnalysisStatus(
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Integer portfolioId,
            @Parameter(description = "분석 상태 (PENDING, COMPLETED, FAILED)", required = true)
            @RequestParam String status
    ) {
        try {
            portfolioService.updatePortfolioAnalysisStatus(portfolioId, status);
            return ResponseEntity.ok().body("포트폴리오 분석 상태가 업데이트되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 분석 상태 업데이트 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "PENDING 상태 candidate_portfolios 목록 조회", description = "분석 대기 중인 candidate_portfolios 전체를 반환합니다.")
    @GetMapping("/candidate-pending")
    public ResponseEntity<?> getPendingCandidatePortfolios() {
        try {
            List<CandidatePortfolio> pendingPortfolios = candidatePortfolioRepository.findByPortfolioAnalysisStatus("PENDING");
            return ResponseEntity.ok(pendingPortfolios);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("PENDING candidate_portfolios 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "기존 포트폴리오 분석 상태 업데이트", description = "기존 포트폴리오의 분석 상태를 업데이트합니다.")
    @PutMapping("/{portfolioId}/status")
    public ResponseEntity<?> updatePortfolioAnalysisStatus(
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Integer portfolioId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("portfolioAnalysisStatus");
            if (status == null) {
                return ResponseEntity.badRequest().body("portfolioAnalysisStatus가 필요합니다.");
            }
            
            Optional<Portfolio> portfolioOpt = portfolioRepository.findById(portfolioId);
            if (portfolioOpt.isPresent()) {
                Portfolio portfolio = portfolioOpt.get();
                portfolio.setPortfolioAnalysisStatus(status);
                portfolioRepository.save(portfolio);
                return ResponseEntity.ok(Map.of("message", "포트폴리오 분석 상태가 업데이트되었습니다.", "portfolioId", portfolioId));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 상태 업데이트 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "PENDING 포트폴리오 일괄 분석", description = "분석 대기 중인 포트폴리오를 모두 분석하고 결과를 저장합니다.")
    @PostMapping("/analyze-pending")
    public ResponseEntity<?> analyzePendingPortfolios() {
        try {
            portfolioService.analyzePendingPortfolios();
            return ResponseEntity.ok("분석이 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("PENDING 포트폴리오 분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "PENDING candidate_portfolios 일괄 분석", description = "분석 대기 중인 candidate_portfolios를 모두 분석하고 결과를 ai_analysis_result에 저장합니다.")
    @PostMapping("/analyze-pending-candidate-portfolios")
    public ResponseEntity<?> analyzePendingCandidatePortfolios() {
        try {
            portfolioMatchingService.analyzePendingCandidatePortfolios();
            return ResponseEntity.ok("candidate_portfolios 분석이 완료되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("PENDING candidate_portfolios 분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "서버 상태 확인", description = "서버가 정상적으로 실행 중인지 확인합니다.")
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok("서버가 정상적으로 실행 중입니다.");
    }

    // 팀에서 추가한 jobCandidateId 기반 기능들
    @Operation(summary = "포트폴리오 제출 날짜 조회", description = "jobCandidateId로 포트폴리오 제출 날짜를 조회합니다.")
    @GetMapping("/{jobCandidateId}/submission-date")
    public ResponseEntity<?> getPortfolioSubmissionDate(@PathVariable Long jobCandidateId) {
        return portfolioService.getSubmissionDate(jobCandidateId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("해당 후보자의 포트폴리오가 존재하지 않습니다."));
    }

    @Operation(summary = "jobCandidateId로 포트폴리오 조회", description = "jobCandidateId를 사용하여 포트폴리오 정보를 조회합니다.")
    @GetMapping("/job-candidate/{jobCandidateId}")
    public ResponseEntity<?> getPortfolioByJobCandidateId(
            @Parameter(description = "jobCandidateId", required = true)
            @PathVariable Long jobCandidateId
    ) {
        try {
            return portfolioService.getPortfolioByJobCandidateId(jobCandidateId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("포트폴리오 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Operation(summary = "지원자의 최근 candidate_portfolios 파일 조회", description = "지원자의 가장 최근에 업로드한 candidate_portfolios 파일 정보를 조회합니다.")
    @GetMapping("/candidate-portfolio/recent/{candidateId}")
    public ResponseEntity<?> getRecentCandidatePortfolioByCandidate(
            @Parameter(description = "지원자 ID", required = true)
            @PathVariable Long candidateId
    ) {
        List<CandidatePortfolio> portfolios = candidatePortfolioRepository.findByCandidateIdOrderByPortfolioCreatedAtDesc(candidateId);
        if (portfolios == null || portfolios.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasPortfolio", false));
        }
        CandidatePortfolio recent = portfolios.get(0);
        Map<String, Object> result = new HashMap<>();
        result.put("hasPortfolio", true);
        result.put("candPortfolioId", recent.getCandPortfolioId());
        result.put("portfolioFilePath", recent.getPortfolioFilePath());
        result.put("portfolioAnalysisStatus", recent.getPortfolioAnalysisStatus());
        result.put("portfolioSubmissionDate", recent.getPortfolioSubmissionDate());
        result.put("portfolioCreatedAt", recent.getPortfolioCreatedAt());
        // 파일명 추출 (S3 URL에서)
        if (recent.getPortfolioFilePath() != null) {
            String fileName = recent.getPortfolioFilePath().substring(
                recent.getPortfolioFilePath().lastIndexOf("/") + 1
            );
            // UUID 부분 제거하여 원본 파일명 복원
            if (fileName.contains("_")) {
                fileName = fileName.substring(fileName.indexOf("_") + 1);
            }
            result.put("originalFileName", fileName);
        }
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "포트폴리오 분석 상태 조회", description = "포트폴리오 ID로 분석 상태만 반환")
    @GetMapping("/status/{portfolioId}")
    public ResponseEntity<?> getPortfolioAnalysisStatus(@PathVariable Long portfolioId) {
        try {
            Optional<CandidatePortfolio> portfolioOpt = candidatePortfolioRepository.findById(portfolioId);
            if (portfolioOpt.isPresent()) {
                String status = portfolioOpt.get().getPortfolioAnalysisStatus();
                return ResponseEntity.ok(Map.of("status", status));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("status", "NOT_FOUND", "message", "해당 포트폴리오가 존재하지 않습니다."));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("status", "ERROR", "message", "포트폴리오 분석 상태를 조회할 수 없습니다."));
        }
    }

    @Operation(summary = "분석 완료 후 포트폴리오 등록", description = "분석이 끝난 후에만 candidate_portfolios에 COMPLETED로 저장")
    @PostMapping("/complete-upload")
    public ResponseEntity<?> completePortfolioUpload(
            @RequestParam("candidateId") Long candidateId,
            @RequestParam("portfolioFilePath") String portfolioFilePath,
            @RequestParam("analysisData") String analysisData
    ) {
        try {
            if (analysisData == null || analysisData.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("분석 결과(analysisData)가 없습니다. 분석이 완료된 후에만 저장할 수 있습니다.");
            }
            CandidatePortfolio portfolio = CandidatePortfolio.builder()
                    .candidateId(candidateId)
                    .portfolioFilePath(portfolioFilePath)
                    .portfolioAnalysisStatus("COMPLETED")
                    .portfolioCreatedAt(new Date())
                    .portfolioUpdatedAt(new Date())
                    .build();
            CandidatePortfolio savedPortfolio = candidatePortfolioRepository.save(portfolio);
            Map<String, Object> response = new HashMap<>();
            response.put("portfolioId", savedPortfolio.getCandPortfolioId());
            response.put("message", "분석 완료 후 포트폴리오가 성공적으로 등록되었습니다.");
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("분석 완료 후 포트폴리오 등록 중 오류가 발생했습니다.");
        }
    }

    @PutMapping("/candidate-portfolio/{candPortfolioId}/analysis-status")
    public ResponseEntity<?> updateCandidatePortfolioAnalysisStatus(
            @PathVariable Long candPortfolioId,
            @RequestParam String status
    ) {
        int updated = candidatePortfolioRepository.updatePortfolioStatus(candPortfolioId, status);
        if (updated == 1) {
            return ResponseEntity.ok("candidate_portfolios 상태가 업데이트되었습니다.");
        } else {
            return ResponseEntity.status(404).body("해당 candPortfolioId를 찾을 수 없습니다.");
        }
    }
}

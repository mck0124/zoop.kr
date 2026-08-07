package com.zoop.backend.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import com.zoop.backend.domain.dto.InterviewScheduleResponseDto;
import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.AiInterviewVideo;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.AiAnalysisResultRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.service.AiInterviewScheduleService;
import com.zoop.backend.service.AiInterviewVideoService;
import com.zoop.backend.service.InterviewAnalysisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "AiInterviewVideoController", description = "AI 면접 영상 관련 API")
@RestController
@RequestMapping("/api/interview-videos")
public class AiInterviewVideoController {

    @Value("${python.questions.api.url:http://localhost:8004}")
    private String pythonQuestionsApiUrl;

    private final AiInterviewVideoService aiInterviewVideoService;
    private final AiInterviewScheduleService aiInterviewScheduleService;
    private final JobCandProgressRepository jobCandProgressRepository;
    private final InterviewAnalysisService interviewAnalysisService;
    private final AiAnalysisResultRepository aiAnalysisResultRepository;

    @Autowired
    public AiInterviewVideoController(AiInterviewVideoService aiInterviewVideoService,
                                    AiInterviewScheduleService aiInterviewScheduleService,
                                    JobCandProgressRepository jobCandProgressRepository,
                                    InterviewAnalysisService interviewAnalysisService,
                                    AiAnalysisResultRepository aiAnalysisResultRepository) {
        this.aiInterviewVideoService = aiInterviewVideoService;
        this.aiInterviewScheduleService = aiInterviewScheduleService;
        this.jobCandProgressRepository = jobCandProgressRepository;
        this.interviewAnalysisService = interviewAnalysisService;
        this.aiAnalysisResultRepository = aiAnalysisResultRepository;
    }

    @Operation(summary = "면접 질문 목록 조회", description = "특정 면접 일정의 질문 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "질문 목록 조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/questions/{scheduleId}")
    public ResponseEntity<List<String>> getQuestionsByScheduleId(
            @Parameter(description = "면접 일정 ID", required = true)
            @PathVariable Integer scheduleId,
            @Parameter(description = "면접 화면 언어 (en, ko, zh)")
            @RequestParam(defaultValue = "en") String language) {
        try {
            // 면접 일정 조회
            InterviewScheduleResponseDto scheduleResponse = aiInterviewScheduleService.getInterviewSchedule(scheduleId.longValue());
            if (scheduleResponse == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // JobCandProgress에서 공고 정보 조회
            JobCandProgress jobCandProgress = jobCandProgressRepository.findByJobCandidateId(scheduleResponse.getJobCandidateId())
                    .orElseThrow(() -> new RuntimeException("해당 후보자 진행 상태를 찾을 수 없습니다."));
            
            Post post = jobCandProgress.getPost();
            if (post == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // 포트폴리오 분석 결과 조회
            String portfolioAnalysis = "";
            try {
                List<AiAnalysisResult> portfolioResults = aiAnalysisResultRepository.findByJobCandidateIdAndAnalysisType(
                    scheduleResponse.getJobCandidateId(), "portfolio");
                if (!portfolioResults.isEmpty()) {
                    AiAnalysisResult portfolioResult = portfolioResults.get(0);
                    portfolioAnalysis = portfolioResult.getAnalysisData();
                }
            } catch (Exception e) {
                System.err.println("포트폴리오 분석 결과 조회 실패: " + e.getMessage());
                // 포트폴리오 분석 결과가 없어도 면접 질문 생성은 계속 진행
            }
            
            // AI를 사용하여 공고 정보, 인재상, 포트폴리오 분석 결과를 바탕으로 질문 생성
            List<String> questions = generateInterviewQuestions(post, portfolioAnalysis, language);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(List.of());
        }
    }
    
    private List<String> generateInterviewQuestions(Post post, String portfolioAnalysis, String language) {
        try {
            // Python AI API를 호출하여 질문 생성
            return callPythonAIForQuestions(post, portfolioAnalysis, language);
        } catch (Exception e) {
            throw new IllegalStateException("AI 면접 질문 생성에 실패했습니다.", e);
        }
    }
    
    private List<String> callPythonAIForQuestions(Post post, String portfolioAnalysis, String language) {
        try {
            // Python AI API URL
            String pythonApiUrl = pythonQuestionsApiUrl + "/generate-questions";
            
            // 공고 정보 준비
            String postTitle = post.getPostTitle() != null ? post.getPostTitle() : "";
            String postDescription = post.getPostDescription() != null ? post.getPostDescription() : "";
            String programmingLanguage = post.getPostProgrammingLanguage() != null ? post.getPostProgrammingLanguage() : "";
            String idealCandidate = post.getPostIdealCandidate() != null ? post.getPostIdealCandidate() : "명시되지 않음";
            String location = post.getPostLocation() != null ? post.getPostLocation() : "명시되지 않음";
            String salaryRange = "";
            if (post.getPostSalaryStart() != null && post.getPostSalaryEnd() != null) {
                salaryRange = post.getPostSalaryStart() + " ~ " + post.getPostSalaryEnd();
            }
            Integer headcount = post.getPostHeadcount() != null ? post.getPostHeadcount() : 1;
            
            // HTTP 요청을 위한 데이터 준비 (포트폴리오 분석 결과 포함)
            String requestBody = String.format(
                "post_title=%s&post_description=%s&programming_language=%s&ideal_candidate=%s&location=%s&salary_range=%s&headcount=%d&portfolio_analysis=%s&language=%s",
                java.net.URLEncoder.encode(postTitle, "UTF-8"),
                java.net.URLEncoder.encode(postDescription, "UTF-8"),
                java.net.URLEncoder.encode(programmingLanguage, "UTF-8"),
                java.net.URLEncoder.encode(idealCandidate, "UTF-8"),
                java.net.URLEncoder.encode(location, "UTF-8"),
                java.net.URLEncoder.encode(salaryRange, "UTF-8"),
                headcount,
                java.net.URLEncoder.encode(portfolioAnalysis, "UTF-8"),
                java.net.URLEncoder.encode(language == null ? "en" : language, "UTF-8")
            );
            
            // HTTP 연결 설정
            java.net.URL url = new java.net.URL(pythonApiUrl);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            byte[] input = requestBody.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            connection.setRequestProperty("Content-Length", String.valueOf(input.length));
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(45000);
            connection.setDoOutput(true);
            
            // 요청 데이터 전송
            try (java.io.OutputStream os = connection.getOutputStream()) {
                os.write(input, 0, input.length);
            }
            
            // 응답 읽기
            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(connection.getInputStream(), "UTF-8"))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    return parseQuestionsFromJson(response.toString());
                }
            } else {
                System.err.println("[AiInterviewVideoController] Python AI API 호출 실패: " + responseCode);
                // 에러 응답도 읽어보기
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                        new java.io.InputStreamReader(connection.getErrorStream(), "UTF-8"))) {
                    StringBuilder errorResponse = new StringBuilder();
                    String errorLine;
                    while ((errorLine = br.readLine()) != null) {
                        errorResponse.append(errorLine);
                    }
                    System.err.println("[AiInterviewVideoController] 에러 응답: " + errorResponse.toString());
                } catch (Exception e) {
                    System.err.println("[AiInterviewVideoController] 에러 응답 읽기 실패: " + e.getMessage());
                }
                throw new RuntimeException("AI API 호출 실패");
            }
        } catch (Exception e) {
            System.err.println("[AiInterviewVideoController] Python AI API 호출 중 오류: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("AI 질문 생성 중 오류: " + e.getMessage());
        }
    }
    
    private List<String> parseQuestionsFromJson(String jsonResponse) {
        try {
            // Jackson ObjectMapper 사용
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(jsonResponse);
            
            List<String> questions = new ArrayList<>();
            
            // questions 배열에서 질문들을 추출
            if (rootNode.has("questions") && rootNode.get("questions").isArray()) {
                com.fasterxml.jackson.databind.JsonNode questionsNode = rootNode.get("questions");
                for (com.fasterxml.jackson.databind.JsonNode questionNode : questionsNode) {
                    if (questionNode.isTextual()) {
                        questions.add(questionNode.asText());
                    }
                }
            }
            
            if (questions.isEmpty()) {
                throw new IllegalStateException("AI 응답에 면접 질문이 없습니다.");
            }
            
            return questions;
        } catch (Exception e) {
            System.err.println("[AiInterviewVideoController] JSON 파싱 오류: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("AI 면접 질문 응답을 해석하지 못했습니다.", e);
        }
    }

    @Operation(summary = "면접 영상 업로드", description = "면접 영상을 업로드합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "업로드 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping("/upload")
    public ResponseEntity<?> uploadInterviewVideo(
            @Parameter(description = "면접 일정 ID", required = true)
            @RequestParam Integer scheduleId,
            @Parameter(description = "질문 번호", required = true)
            @RequestParam Integer questionNumber,
            @Parameter(description = "질문 내용", required = true)
            @RequestParam String questionContent,
            @Parameter(description = "영상 파일", required = true)
            @RequestParam("videoFile") MultipartFile videoFile) {
        try {
            AiInterviewVideo video = aiInterviewVideoService.uploadInterviewVideo(scheduleId.longValue(), questionNumber, questionContent, videoFile);
            return ResponseEntity.ok(video);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("업로드 중 오류: " + e.getMessage());
        }
    }

    @Operation(summary = "특정 일정의 영상 목록 조회", description = "특정 면접 일정의 모든 영상을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "영상 목록 조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<List<AiInterviewVideo>> getVideosByScheduleId(
            @Parameter(description = "면접 일정 ID", required = true)
            @PathVariable Integer scheduleId) {
        try {
            List<AiInterviewVideo> videos = aiInterviewVideoService.findByScheduleId(scheduleId.longValue());
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "특정 영상 조회", description = "특정 영상의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "영상 조회 성공"),
            @ApiResponse(responseCode = "404", description = "해당 영상을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{videoId}")
    public ResponseEntity<AiInterviewVideo> getVideoById(
            @Parameter(description = "영상 ID", required = true)
            @PathVariable Long videoId) {
        try {
            AiInterviewVideo video = aiInterviewVideoService.findById(videoId);
            return ResponseEntity.ok(video);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "후보자별 영상 목록 조회", description = "특정 후보자의 모든 면접 영상을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "영상 목록 조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/by-job-candidate/{jobCandidateId}")
    public ResponseEntity<List<AiInterviewVideo>> getVideosByJobCandidateId(
            @Parameter(description = "후보자 ID", required = true)
            @PathVariable Long jobCandidateId) {
        try {
            List<AiInterviewVideo> videos = aiInterviewVideoService.getVideosByJobCandidateId(jobCandidateId);
            return ResponseEntity.ok(videos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

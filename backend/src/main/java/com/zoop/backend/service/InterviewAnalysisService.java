package com.zoop.backend.service;

import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.domain.entity.AiInterviewSchedule;
import com.zoop.backend.repository.AiInterviewScheduleRepository;
import com.zoop.backend.repository.JobCandProgressRepository;

@Service
public class InterviewAnalysisService {
    
    private final JobCandProgressRepository jobCandProgressRepository;
    private final AiInterviewScheduleRepository aiInterviewScheduleRepository;
    private final RestTemplate restTemplate;
    
    @Value("${python.interview.api.url:${python.api.url:http://localhost:8102}}")
    private String pythonApiUrl;
    
    @Autowired
    public InterviewAnalysisService(JobCandProgressRepository jobCandProgressRepository,
                                    AiInterviewScheduleRepository aiInterviewScheduleRepository) {
        this.jobCandProgressRepository = jobCandProgressRepository;
        this.aiInterviewScheduleRepository = aiInterviewScheduleRepository;
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * 면접 완료 시 비동기로 분석 시작
     */
    public void startInterviewAnalysis(Integer scheduleId, Long jobCandidateId) {
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(Long.valueOf(scheduleId))
            .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다: " + scheduleId));
        String currentAnalysisStatus = schedule.getAiAnalysisStatus();
        if ("done".equals(currentAnalysisStatus) || "processing".equals(currentAnalysisStatus)) {
            System.out.println("[InterviewAnalysis] Analysis already claimed or completed: schedule=" + scheduleId + ", status=" + currentAnalysisStatus);
            return;
        }
        schedule.setAiAnalysisStatus("processing");
        aiInterviewScheduleRepository.save(schedule);

        CompletableFuture.runAsync(() -> {
            try {
                System.out.println("[InterviewAnalysis] Starting analysis for schedule: " + scheduleId + ", jobCandidate: " + jobCandidateId);
                
                // scheduleId로 JobCandProgress 조회
                JobCandProgress progress = jobCandProgressRepository.findByAiIntrvwScheduleId(Long.valueOf(scheduleId))
                    .orElseThrow(() -> new RuntimeException("해당 scheduleId의 JobCandProgress를 찾을 수 없습니다: " + scheduleId));
                Post post = progress.getPost();
                String postTitle = post != null && post.getPostTitle() != null ? post.getPostTitle() : "";
                String postDescription = post != null && post.getPostDescription() != null ? post.getPostDescription() : "";
                String idealCandidate = post != null && post.getPostIdealCandidate() != null ? post.getPostIdealCandidate() : "";

                // Python API 호출
                String url = pythonApiUrl + "/analyze-interview";

                // Form data로 전송
                MultiValueMap<String, String> requestMap = new LinkedMultiValueMap<>();
                requestMap.add("schedule_id", String.valueOf(scheduleId));
                requestMap.add("job_candidate_id", String.valueOf(jobCandidateId));
                requestMap.add("post_title", postTitle);
                requestMap.add("post_description", postDescription);
                requestMap.add("ideal_candidate", idealCandidate);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
                HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(requestMap, headers);

                ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    System.out.println("[InterviewAnalysis] Analysis started successfully");
                    if (response.getBody() != null && response.getBody().contains("\"success\":false")) {
                        markAnalysisFailed(scheduleId);
                    }
                } else {
                    System.err.println("[InterviewAnalysis] Failed to start analysis: " + response.getStatusCode());
                    markAnalysisFailed(scheduleId);
                }
                
            } catch (Exception e) {
                System.err.println("[InterviewAnalysis] Error starting analysis: " + e.getMessage());
                e.printStackTrace();
                aiInterviewScheduleRepository.findById(Long.valueOf(scheduleId)).ifPresent(failedSchedule -> {
                    failedSchedule.setAiAnalysisStatus("failed");
                    aiInterviewScheduleRepository.save(failedSchedule);
                });
            }
        });
    }

    private void markAnalysisFailed(Integer scheduleId) {
        aiInterviewScheduleRepository.findById(Long.valueOf(scheduleId)).ifPresent(schedule -> {
            schedule.setAiAnalysisStatus("failed");
            aiInterviewScheduleRepository.save(schedule);
        });
    }
    
    /**
     * 개별 영상 분석 트리거
     */
    public void triggerVideoAnalysis(Integer videoId) {
        CompletableFuture.runAsync(() -> {
            try {
                System.out.println("[InterviewAnalysis] Starting video analysis for videoId: " + videoId);
                
                // Python API 호출
                String url = pythonApiUrl + "/analyze-video";
                
                // Form data로 전송
                String requestBody = String.format("video_id=%d", videoId);
                
                ResponseEntity<String> response = restTemplate.postForEntity(url, requestBody, String.class);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    System.out.println("[InterviewAnalysis] Video analysis started successfully");
                } else {
                    System.err.println("[InterviewAnalysis] Failed to start video analysis: " + response.getStatusCode());
                }
                
            } catch (Exception e) {
                System.err.println("[InterviewAnalysis] Error starting video analysis: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }
}

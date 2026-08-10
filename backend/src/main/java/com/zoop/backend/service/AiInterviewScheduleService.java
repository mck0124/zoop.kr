package com.zoop.backend.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.zoop.backend.domain.dto.InterviewScheduleRequestDto;
import com.zoop.backend.domain.dto.InterviewScheduleResponseDto;
import com.zoop.backend.domain.dto.modal.AiInterviewScheduleResponse;
import com.zoop.backend.domain.dto.modal.InterviewVideoResponse;
import com.zoop.backend.domain.entity.AiInterviewSchedule;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.repository.AiInterviewScheduleRepository;
import com.zoop.backend.repository.JobCandProgressRepository;

@Service
public class AiInterviewScheduleService {
    private final AiInterviewScheduleRepository aiInterviewScheduleRepository;
    private final JobCandProgressRepository jobCandProgressRepository;
    private final S3Service s3Service;
    private final InterviewAnalysisService interviewAnalysisService;
    private final JobCandProgressService jobCandProgressService;

    @Autowired
    public AiInterviewScheduleService(AiInterviewScheduleRepository aiInterviewScheduleRepository,
                                    JobCandProgressRepository jobCandProgressRepository,
                                    S3Service s3Service,
                                    InterviewAnalysisService interviewAnalysisService,
                                    JobCandProgressService jobCandProgressService) {
        this.aiInterviewScheduleRepository = aiInterviewScheduleRepository;
        this.jobCandProgressRepository = jobCandProgressRepository;
        this.s3Service = s3Service;
        this.interviewAnalysisService = interviewAnalysisService;
        this.jobCandProgressService = jobCandProgressService;
    }
    
    @Transactional
    public InterviewScheduleResponseDto scheduleInterview(InterviewScheduleRequestDto requestDto) {
        // 디버깅 로그 추가
        System.out.println("=== AiInterviewScheduleService.scheduleInterview() 호출됨 ===");
        System.out.println("요청된 postId: " + requestDto.getPostId());
        System.out.println("요청된 candidateId: " + requestDto.getCandidateId());
        System.out.println("요청된 scheduledTime: " + requestDto.getScheduledTime());
        
        // 1. postId와 candidateId로 JobCandProgress 레코드 찾기
        System.out.println("JobCandProgress 레코드 검색 시작...");
        JobCandProgress jobCandProgress = jobCandProgressRepository
            .findByPost_PostIdAndCandidate_CandidateId(requestDto.getPostId(), requestDto.getCandidateId())
            .orElseThrow(() -> {
                System.err.println("JobCandProgress 레코드를 찾을 수 없습니다!");
                System.err.println("검색 조건 - postId: " + requestDto.getPostId() + ", candidateId: " + requestDto.getCandidateId());
                
                // 전체 JobCandProgress 레코드 조회해서 디버깅
                List<JobCandProgress> allRecords = jobCandProgressRepository.findAll();
                System.err.println("전체 JobCandProgress 레코드 수: " + allRecords.size());
                for (JobCandProgress record : allRecords) {
                    System.err.println("레코드 - jobCandidateId: " + record.getJobCandidateId() + 
                                    ", postId: " + (record.getPost() != null ? record.getPost().getPostId() : "null") + 
                                    ", candidateId: " + (record.getCandidate() != null ? record.getCandidate().getCandidateId() : "null"));
                }
                
                return new RuntimeException("해당 공고에 대한 후보자 진행 상태를 찾을 수 없습니다. postId: " + requestDto.getPostId() + ", candidateId: " + requestDto.getCandidateId());
            });
        
        System.out.println("JobCandProgress 레코드 찾음 - jobCandidateId: " + jobCandProgress.getJobCandidateId());
        System.out.println("현재 상태: " + jobCandProgress.getJobCandCurrStage());
        
        // 2. 면접 일정 생성
        LocalDateTime receivedDateTime = LocalDateTime.parse(requestDto.getScheduledTime(), DateTimeFormatter.ISO_DATE_TIME);
        
        // 받은 시간을 UTC로 가정하고 파싱 (프론트엔드에서 이미 UTC로 전송됨)
        ZonedDateTime utcTime = receivedDateTime.atZone(ZoneId.of("UTC"));
        
        // 데이터베이스에 저장할 LocalDateTime (UTC 기준)
        LocalDateTime timeToSave = utcTime.toLocalDateTime();
        LocalDateTime deadlineTime = timeToSave.plusDays(7); // 면접 마감 시간은 예약 시간 + 7일로 설정
        
        // 한국 시간으로 변환 (응답용)
        ZonedDateTime koreaTime = utcTime.withZoneSameInstant(ZoneId.of("Asia/Seoul"));
        
        // 3. 면접 링크 생성 (실제로는 더 복잡한 로직이 필요할 수 있음)
        String interviewLink = "https://zoop.ai/interview/" + UUID.randomUUID().toString();
        
        // 4. AiInterviewSchedule 엔티티 생성 및 저장
        AiInterviewSchedule schedule = AiInterviewSchedule.builder()
            .jobCandProgress(jobCandProgress) // 관계 설정 (jobCandidateId 대신)
            .aiInterviewScheduledTime(timeToSave)
            .aiInterviewDeadlineTime(deadlineTime)
            .aiInterviewLink(interviewLink)
            .aiInterviewStatus("scheduled") // 초기 상태는 'scheduled'
            .aiAnalysisStatus("not_started") // 초기 분석 상태는 'not_started'
            .build();
        
        AiInterviewSchedule savedSchedule = aiInterviewScheduleRepository.save(schedule);
        
        // 5. JobCandProgress 상태 업데이트 (2y -> 3n) - 알림 생성 포함
        jobCandProgressService.updateStageWithNotification(jobCandProgress.getJobCandidateId(), "3n");
        
        // aiIntrvwScheduleId 업데이트
        jobCandProgress.setAiIntrvwScheduleId(savedSchedule.getAiInterviewScheduleId());
        jobCandProgressRepository.save(jobCandProgress);

        // 6. 응답 DTO 생성 및 반환
        return InterviewScheduleResponseDto.builder()
                .scheduleId(savedSchedule.getAiInterviewScheduleId())
                .jobCandidateId(savedSchedule.getJobCandProgress().getJobCandidateId())
                .scheduledTime(koreaTime.toLocalDateTime()) // 응답은 한국 시간으로
                .deadlineTime(deadlineTime.atZone(ZoneId.of("UTC")).withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime()) // 마감 시간도 한국 시간으로
                .interviewLink(interviewLink)
                .status("scheduled")
                .message("면접 일정이 성공적으로 등록되었습니다.")
                .success(true)
                .build();
    }

    @Transactional(readOnly = true)
    public List<InterviewScheduleResponseDto> getInterviewSchedulesByCandidate(Long candidateId) {
        List<AiInterviewSchedule> schedules = aiInterviewScheduleRepository.findByJobCandProgress_JobCandidateId(candidateId);
        return schedules.stream()
                .map(schedule -> {
                    // 저장된 UTC 시간을 한국 시간으로 변환
                    LocalDateTime utcScheduledTime = schedule.getAiInterviewScheduledTime();
                    ZonedDateTime utcZonedScheduledTime = utcScheduledTime.atZone(ZoneId.of("UTC"));
                    LocalDateTime koreaScheduledTime = utcZonedScheduledTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

                    LocalDateTime utcDeadlineTime = schedule.getAiInterviewDeadlineTime();
                    ZonedDateTime utcZonedDeadlineTime = utcDeadlineTime.atZone(ZoneId.of("UTC"));
                    LocalDateTime koreaDeadlineTime = utcZonedDeadlineTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();
                    return InterviewScheduleResponseDto.builder()
                            .scheduleId(schedule.getAiInterviewScheduleId())
                            .jobCandidateId(schedule.getJobCandProgress().getJobCandidateId())
                            .scheduledTime(koreaScheduledTime) // 한국 시간으로 반환
                            .deadlineTime(koreaDeadlineTime) // 한국 시간으로 반환
                            .interviewLink(schedule.getAiInterviewLink())
                            .status(schedule.getAiInterviewStatus())
                            .success(true)
                            .message("면접 일정을 성공적으로 조회했습니다.")
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InterviewScheduleResponseDto getInterviewSchedule(Long scheduleId) {
        // 디버깅 로그 추가
        System.out.println("면접 일정 조회 시도: " + scheduleId);
        
        // 직접 SQL 쿼리 로깅
        System.out.println("실행 예정 SQL: SELECT * FROM ai_interview_schedules WHERE ai_intrvw_schedule_id = " + scheduleId);
        
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다. ID: " + scheduleId));
        
        // 조회된 데이터 로깅
        System.out.println("조회된 면접 일정: " + schedule);
        // 저장된 UTC 시간을 한국 시간으로 변환
        LocalDateTime utcScheduledTime = schedule.getAiInterviewScheduledTime();
        ZonedDateTime utcZonedScheduledTime = utcScheduledTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaScheduledTime = utcZonedScheduledTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        LocalDateTime utcDeadlineTime = schedule.getAiInterviewDeadlineTime();
        ZonedDateTime utcZonedDeadlineTime = utcDeadlineTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaDeadlineTime = utcZonedDeadlineTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        return InterviewScheduleResponseDto.builder()
                .scheduleId(schedule.getAiInterviewScheduleId())
                .jobCandidateId(schedule.getJobCandProgress().getJobCandidateId())
                .scheduledTime(koreaScheduledTime) // 한국 시간으로 반환
                .deadlineTime(koreaDeadlineTime) // 한국 시간으로 반환
                .interviewLink(schedule.getAiInterviewLink())
                .status(schedule.getAiInterviewStatus())
                .success(true)
                .message("면접 정보를 성공적으로 조회했습니다.")
                .build();
    }
    
    @Transactional
    public InterviewScheduleResponseDto updateInterviewStatus(Long scheduleId, String status) {
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다."));
        
        schedule.setAiInterviewStatus(status);
        
        if ("completed".equals(status)) {
            schedule.setAiInterviewCompletionTime(LocalDateTime.now());
        }
        
        AiInterviewSchedule updatedSchedule = aiInterviewScheduleRepository.save(schedule);
        
        // 응답 시에도 한국 시간으로 변환하여 반환
        LocalDateTime utcScheduledTime = updatedSchedule.getAiInterviewScheduledTime();
        ZonedDateTime utcZonedScheduledTime = utcScheduledTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaScheduledTime = utcZonedScheduledTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        LocalDateTime utcDeadlineTime = updatedSchedule.getAiInterviewDeadlineTime();
        ZonedDateTime utcZonedDeadlineTime = utcDeadlineTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaDeadlineTime = utcZonedDeadlineTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        return InterviewScheduleResponseDto.builder()
                .scheduleId(updatedSchedule.getAiInterviewScheduleId())
                .jobCandidateId(updatedSchedule.getJobCandProgress().getJobCandidateId())
                .scheduledTime(koreaScheduledTime)
                .deadlineTime(koreaDeadlineTime)
                .interviewLink(updatedSchedule.getAiInterviewLink())
                .status(updatedSchedule.getAiInterviewStatus())
                .message("면접 상태가 성공적으로 업데이트되었습니다.")
                .success(true)
                .build();
    }
    
    @Transactional(readOnly = true)
    public InterviewScheduleResponseDto getInterviewByPostIdAndCandidateId(Long postId, Long candidateId) {
        // JobCandProgress 테이블에서 postId와 candidateId로 jobCandidateId 찾기
        JobCandProgress jobCandProgress = jobCandProgressRepository
            .findByPost_PostIdAndCandidate_CandidateId(postId, candidateId)
            .orElseThrow(() -> new RuntimeException("해당 공고에 대한 후보자 진행 상태를 찾을 수 없습니다."));
        
        // jobCandidateId로 면접 일정 찾기
        Long jobCandidateId = jobCandProgress.getJobCandidateId();
        
        // aiIntrvwScheduleId가 있으면 해당 ID로 면접 일정 조회
        if (jobCandProgress.getAiIntrvwScheduleId() != null) {
            Long scheduleId = jobCandProgress.getAiIntrvwScheduleId();
            return getInterviewSchedule(scheduleId);
        }
        
        // 없으면 jobCandidateId로 면접 일정 조회 (최신 일정 하나만)
        List<AiInterviewSchedule> schedules = aiInterviewScheduleRepository.findByJobCandProgress_JobCandidateId(jobCandidateId);
        if (schedules.isEmpty()) {
            throw new RuntimeException("해당 후보자의 면접 일정을 찾을 수 없습니다.");
        }
        
        // 가장 최근 일정 반환 (생성 시간 기준 내림차순 정렬)
        AiInterviewSchedule latestSchedule = schedules.stream()
            .sorted(Comparator.comparing(AiInterviewSchedule::getAiInterviewCreatedAt).reversed())
            .findFirst()
            .orElseThrow(() -> new RuntimeException("면접 일정을 찾을 수 없습니다."));
        
        return getInterviewSchedule(latestSchedule.getAiInterviewScheduleId());
    }

    @Transactional
    public InterviewScheduleResponseDto completeInterview(Long scheduleId) {
        System.out.println("[AiInterviewScheduleService] 면접 완료 처리 시작: scheduleId=" + scheduleId);
        
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다."));
        
        System.out.println("[AiInterviewScheduleService] 면접 일정 조회 성공: " + schedule.getAiInterviewScheduleId());
        
        boolean alreadyCompleted = "completed".equals(schedule.getAiInterviewStatus());
        // 면접 상태를 완료로 변경
        schedule.setAiInterviewStatus("completed");
        if (!alreadyCompleted || schedule.getAiInterviewCompletionTime() == null) {
            schedule.setAiInterviewCompletionTime(LocalDateTime.now());
        }
        
        // 새 완료 요청은 분석을 대기열에 넣는다. 이미 처리 중이거나 완료된
        // 재시도 요청은 상태를 되돌리지 않아 중복 분석을 만들지 않는다.
        String analysisStatus = schedule.getAiAnalysisStatus();
        if (!alreadyCompleted || (!"done".equals(analysisStatus) && !"processing".equals(analysisStatus))) {
            schedule.setAiAnalysisStatus("pending");
        }
        
        AiInterviewSchedule updatedSchedule = aiInterviewScheduleRepository.save(schedule);
        System.out.println("[AiInterviewScheduleService] 면접 일정 상태 업데이트 완료: " + updatedSchedule.getAiInterviewStatus());
        
        // JobCandProgress 상태를 3y로 업데이트. 재시도 요청에서는 알림을 중복 발송하지 않는다.
        JobCandProgress jobCandProgress = schedule.getJobCandProgress();
        String oldStage = jobCandProgress.getJobCandCurrStage();
        
        System.out.println("[AiInterviewScheduleService] JobCandProgress stage 업데이트: " + oldStage + " → 3y");
        
        if (!alreadyCompleted && !"3y".equals(oldStage)) {
            // 알림 생성과 함께 stage 업데이트
            jobCandProgressService.updateStageWithNotification(jobCandProgress.getJobCandidateId(), "3y");
        }
        
        // 면접 완료 날짜 업데이트
        jobCandProgress.setJobCandAiIntrvwCompltDate(LocalDateTime.now());
        jobCandProgressRepository.save(jobCandProgress);
        
        System.out.println("[AiInterviewScheduleService] JobCandProgress stage 업데이트 완료: 3y");
        
        // 응답 시에도 한국 시간으로 변환하여 반환
        LocalDateTime utcScheduledTime = updatedSchedule.getAiInterviewScheduledTime();
        ZonedDateTime utcZonedScheduledTime = utcScheduledTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaScheduledTime = utcZonedScheduledTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        LocalDateTime utcDeadlineTime = updatedSchedule.getAiInterviewDeadlineTime();
        ZonedDateTime utcZonedDeadlineTime = utcDeadlineTime.atZone(ZoneId.of("UTC"));
        LocalDateTime koreaDeadlineTime = utcZonedDeadlineTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();

        System.out.println("[AiInterviewScheduleService] 면접 완료 처리 완료");
        
        return InterviewScheduleResponseDto.builder()
                .scheduleId(updatedSchedule.getAiInterviewScheduleId())
                .jobCandidateId(updatedSchedule.getJobCandProgress().getJobCandidateId())
                .scheduledTime(koreaScheduledTime)
                .deadlineTime(koreaDeadlineTime)
                .interviewLink(updatedSchedule.getAiInterviewLink())
                .status(updatedSchedule.getAiInterviewStatus())
                .message("면접이 완료되었습니다.")
                .success(true)
                .build();
    }

    @Transactional
    public String uploadInterviewVideo(Long scheduleId, MultipartFile videoFile) throws Exception {
        // 이 메서드는 더 이상 schedule의 videoFilePath를 사용하지 않습니다.
        throw new UnsupportedOperationException("영상 업로드는 ai_interview_videos 테이블을 사용하세요.");
    }

    public Optional<AiInterviewScheduleResponse> getScheduleInfo(Long jobCandidateId) {
        return aiInterviewScheduleRepository.findByJobCandProgress_JobCandidateId(jobCandidateId).stream()
                .findFirst()
                .map(s -> new AiInterviewScheduleResponse(
                        s.getAiInterviewScheduleId(),
                        s.getAiInterviewScheduledTime(),
                        s.getAiInterviewStatus(),
                        s.getAiAnalysisStatus()));
    }

    @Transactional
    public InterviewScheduleResponseDto retryInterviewAnalysis(Long scheduleId) {
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다."));
        if ("processing".equals(schedule.getAiAnalysisStatus())) {
            throw new IllegalStateException("면접 분석이 이미 진행 중입니다.");
        }
        if ("done".equals(schedule.getAiAnalysisStatus())) {
            return getInterviewSchedule(scheduleId);
        }
        schedule.setAiAnalysisStatus("pending");
        aiInterviewScheduleRepository.save(schedule);
        return getInterviewSchedule(scheduleId);
    }

    public Optional<InterviewVideoResponse> getInterviewVideo(Long jobCandidateId) {
        // AiInterviewSchedule 엔티티에는 videoFilePath 필드가 없으므로 null 반환
        return Optional.empty();
    }

    @Transactional
    public void updateAnalysisStatus(Long scheduleId, String status) {
        AiInterviewSchedule schedule = aiInterviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("해당 면접 일정을 찾을 수 없습니다."));
        schedule.setAiAnalysisStatus(status);
        aiInterviewScheduleRepository.save(schedule);
    }

    @Transactional(readOnly = true)
    public List<AiInterviewSchedule> getPendingAnalysisSchedules() {
        return aiInterviewScheduleRepository.findByAiAnalysisStatus("pending");
    }

    @Transactional(readOnly = true)
    public List<AiInterviewSchedule> getPendingInterviewSchedules() {
        return aiInterviewScheduleRepository.findByAiAnalysisStatus("pending");
    }
}

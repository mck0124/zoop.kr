package com.zoop.backend.controller;

import java.util.List;

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

import com.zoop.backend.domain.dto.InterviewScheduleRequestDto;
import com.zoop.backend.domain.dto.InterviewScheduleResponseDto;
import com.zoop.backend.domain.dto.modal.InterviewVideoResponse;
import com.zoop.backend.domain.entity.AiInterviewSchedule;
import com.zoop.backend.service.AiInterviewScheduleService;
import com.zoop.backend.service.InterviewAnalysisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "AiInterviewScheduleController", description = "AI 면접 일정 관련 API")
@RestController
@RequestMapping("/api/interview-schedules")
@RequiredArgsConstructor
public class AiInterviewScheduleController {

    private final AiInterviewScheduleService aiInterviewScheduleService;
    private final InterviewAnalysisService interviewAnalysisService;

    @Operation(summary = "AI 면접 일정 등록", description = "후보자가 AI 면접 일정을 등록합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 일정 등록 성공",
                    content = @Content(schema = @Schema(implementation = InterviewScheduleResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (필수 데이터 누락 등)"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PostMapping
    public ResponseEntity<InterviewScheduleResponseDto> scheduleInterview(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "면접 일정 등록을 위한 정보",
                    required = true,
                    content = @Content(schema = @Schema(implementation = InterviewScheduleRequestDto.class))
            )
            @RequestBody InterviewScheduleRequestDto requestDto) {
        try {
            InterviewScheduleResponseDto response = aiInterviewScheduleService.scheduleInterview(requestDto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("면접 일정 요청을 확인해주세요.").build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("면접 일정 등록 중 오류가 발생했습니다.").build());
        }
    }

    @Operation(summary = "후보자별 AI 면접 일정 조회", description = "특정 후보자의 AI 면접 일정을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 일정 목록 조회 성공",
                    content = @Content(schema = @Schema(implementation = InterviewScheduleResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 후보자의 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<InterviewScheduleResponseDto>> getInterviewSchedulesByCandidate(
            @Parameter(description = "후보자 ID", required = true)
            @PathVariable Integer candidateId) {
        try {
            List<InterviewScheduleResponseDto> schedules = aiInterviewScheduleService.getInterviewSchedulesByCandidate(candidateId.longValue());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "AI 면접 일정 상세 조회", description = "특정 AI 면접 일정의 상세 정보를 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 일정 상세 조회 성공",
                    content = @Content(schema = @Schema(implementation = InterviewScheduleResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{scheduleId}")
    public ResponseEntity<InterviewScheduleResponseDto> getInterviewSchedule(
            @Parameter(description = "면접 일정 ID", required = true)
            @PathVariable Integer scheduleId) {
        try {
            InterviewScheduleResponseDto schedule = aiInterviewScheduleService.getInterviewSchedule(scheduleId.longValue());
            return ResponseEntity.ok(schedule);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "AI 면접 일정 상태 업데이트", description = "AI 면접 일정의 상태를 업데이트합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 일정 상태 업데이트 성공",
                    content = @Content(schema = @Schema(implementation = InterviewScheduleResponseDto.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (상태 값 오류 등)"),
            @ApiResponse(responseCode = "404", description = "해당 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{scheduleId}/status")
    public ResponseEntity<InterviewScheduleResponseDto> updateInterviewStatus(
            @Parameter(description = "면접 일정 ID", required = true)
            @PathVariable Integer scheduleId,
            @Parameter(description = "업데이트할 상태 (예: 'completed', 'cancelled')", required = true)
            @RequestParam String status) {
        try {
            InterviewScheduleResponseDto response = aiInterviewScheduleService.updateInterviewStatus(scheduleId.longValue(), status);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("해당 면접 일정을 찾을 수 없습니다.").build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("면접 상태 업데이트 중 오류가 발생했습니다.").build());
        }
    }

    @Operation(summary = "AI 면접 완료", description = "AI 면접을 완료하고 상태를 업데이트합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 완료 성공",
                    content = @Content(schema = @Schema(implementation = InterviewScheduleResponseDto.class))),
            @ApiResponse(responseCode = "404", description = "해당 일정을 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{scheduleId}/complete")
    public ResponseEntity<InterviewScheduleResponseDto> completeInterview(
            @Parameter(description = "면접 일정 ID", required = true)
            @PathVariable Integer scheduleId) {
        try {
            InterviewScheduleResponseDto response = aiInterviewScheduleService.completeInterview(scheduleId.longValue());
            
            // 면접 완료 후 전체 분석 트리거
            try {
                interviewAnalysisService.startInterviewAnalysis(scheduleId, response.getJobCandidateId().longValue());
                System.out.println("[InterviewSchedule] 면접 완료 후 분석 트리거 완료: scheduleId=" + scheduleId);
            } catch (Exception e) {
                System.err.println("[InterviewSchedule] 면접 완료 후 분석 트리거 실패: " + e.getMessage());
                // 분석 트리거 실패는 면접 완료에 영향을 주지 않음
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("해당 면접 일정을 찾을 수 없습니다.").build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(InterviewScheduleResponseDto.builder().success(false).message("면접 완료 처리 중 오류가 발생했습니다.").build());
        }
    }

    @Operation(summary = "JobCandidate ID로 면접 일정 조회", description = "특정 JobCandidate의 면접 일정을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 일정 조회 성공"),
            @ApiResponse(responseCode = "404", description = "면접 일정을 찾을 수 없음")
    })
    @GetMapping("/{jobCandidateId}/schedule")
    public ResponseEntity<?> getScheduledInterview(@PathVariable Long jobCandidateId) {
        try {
            return aiInterviewScheduleService.getScheduleInfo(jobCandidateId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "JobCandidate ID로 면접 영상 조회", description = "특정 JobCandidate의 면접 영상을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "면접 영상 조회 성공"),
            @ApiResponse(responseCode = "404", description = "면접 영상을 찾을 수 없음")
    })
    @GetMapping("/{jobCandidateId}/video")
    public ResponseEntity<InterviewVideoResponse> getInterviewVideo(@PathVariable Long jobCandidateId) {
        try {
            return aiInterviewScheduleService.getInterviewVideo(jobCandidateId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "면접 스케줄 분석 상태 업데이트", description = "면접 스케줄의 분석 상태를 업데이트합니다.")
    @PutMapping("/{scheduleId}/analysis-status")
    public ResponseEntity<?> updateAnalysisStatus(
            @Parameter(description = "면접 스케줄 ID", required = true)
            @PathVariable Integer scheduleId,
            @Parameter(description = "분석 상태 (pending, done, failed)", required = true)
            @RequestParam String status) {
        try {
            aiInterviewScheduleService.updateAnalysisStatus(scheduleId.longValue(), status);
            return ResponseEntity.ok("분석 상태가 업데이트되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("분석 상태 업데이트 중 오류가 발생했습니다.");
        }
    }

    @Operation(summary = "PENDING 상태 면접 스케줄 조회", description = "분석 대기 중인 면접 스케줄 전체를 반환합니다.")
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingInterviewSchedules() {
        try {
            List<AiInterviewSchedule> pendingSchedules = aiInterviewScheduleService.getPendingInterviewSchedules();
            
            // Python API가 기대하는 형태로 변환
            List<java.util.Map<String, Object>> response = pendingSchedules.stream()
                .map(schedule -> {
                    java.util.Map<String, Object> scheduleMap = new java.util.HashMap<>();
                    scheduleMap.put("aiInterviewScheduleId", schedule.getAiInterviewScheduleId());
                    scheduleMap.put("jobCandidateId", schedule.getJobCandProgress().getJobCandidateId());
                    scheduleMap.put("aiInterviewStatus", schedule.getAiInterviewStatus());
                    scheduleMap.put("aiAnalysisStatus", schedule.getAiAnalysisStatus());
                    return scheduleMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("PENDING 면접 스케줄 조회 중 오류가 발생했습니다.");
        }
    }
}

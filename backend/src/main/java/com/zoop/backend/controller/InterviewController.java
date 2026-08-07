package com.zoop.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.dto.ErrorResponse;
import com.zoop.backend.domain.dto.InterviewScheduleResponseDto;
import com.zoop.backend.service.AiInterviewScheduleService;

/**
 *
 * @author hwangseojin
 */

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    @Autowired
    private AiInterviewScheduleService aiInterviewScheduleService;

    // 기존 getInterviewById 메소드 (scheduleId로 조회)
    @GetMapping("/{id}")
    public ResponseEntity<?> getInterviewById(@PathVariable Integer id) {
        try {
            System.out.println("면접 정보 요청 ID: " + id);
            InterviewScheduleResponseDto interview = aiInterviewScheduleService.getInterviewSchedule(id.longValue());
            System.out.println("조회된 면접 정보: " + interview);
            return ResponseEntity.ok(interview);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("면접 정보를 찾을 수 없습니다: " + e.getMessage()));
        }
    }

    // postId와 candidateId로 면접 일정 조회하는 새로운 엔드포인트
    @GetMapping("/by-post-candidate") // 이 경로가 프론트엔드 fetch URL과 일치해야 합니다.
    public ResponseEntity<?> getInterviewByPostIdAndCandidateId(
            @RequestParam Integer postId,
            @RequestParam Integer candidateId) {
        try {
            System.out.println("면접 정보 요청 - postId: " + postId + ", candidateId: " + candidateId);
            InterviewScheduleResponseDto interview = aiInterviewScheduleService.getInterviewByPostIdAndCandidateId(postId.longValue(), candidateId.longValue());
            System.out.println("조회된 면접 정보 (by post/candidate): " + interview);
            return ResponseEntity.ok(interview);
        } catch (Exception e) {
            e.printStackTrace();
            // 오류 발생 시 클라이언트에게 명확한 메시지 전달
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("해당 공고에 대한 면접 일정을 찾을 수 없습니다: " + e.getMessage()));
        }
    }
}


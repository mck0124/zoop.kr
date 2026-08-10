// DTO: InterviewScheduleResponse.java
package com.zoop.backend.domain.dto.modal;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiInterviewScheduleResponse {
    private Long scheduleId;
    private LocalDateTime aiInterviewScheduledTime;
    private String status; // "scheduled" or "done"
    private String analysisStatus;
}

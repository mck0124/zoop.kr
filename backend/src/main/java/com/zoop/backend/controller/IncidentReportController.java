package com.zoop.backend.controller;

import com.zoop.backend.domain.dto.IncidentReportRequestDto;
import com.zoop.backend.domain.dto.IncidentReportResponseDto;
import com.zoop.backend.service.IncidentReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incident-reports")
public class IncidentReportController {

    @Autowired
    private IncidentReportService incidentReportService;

    @PostMapping("/submit")
    public ResponseEntity<IncidentReportResponseDto> submitReport(@RequestBody IncidentReportRequestDto request) {
        try {
            IncidentReportResponseDto response = incidentReportService.submitReport(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            IncidentReportResponseDto errorResponse = new IncidentReportResponseDto();
            errorResponse.setSuccess(false);
            errorResponse.setMessage("신고 접수 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}

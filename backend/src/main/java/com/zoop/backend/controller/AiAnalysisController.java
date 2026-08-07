package com.zoop.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.dto.modal.InterviewAnalysisResponse;
import com.zoop.backend.domain.dto.modal.PortfolioAnalysisResponse;
import com.zoop.backend.service.AiAnalysisService;
import com.zoop.backend.service.AiAccessService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AiAnalysisController {

    private final AiAnalysisService aiAnalysisService;
    private final AiAccessService aiAccessService;

    //
    @GetMapping("/{jobCandidateId}/portfolio")
    public ResponseEntity<PortfolioAnalysisResponse> getPortfolioAnalysis(@PathVariable Long jobCandidateId) {
        if (!aiAccessService.canAccessJobCandidate(jobCandidateId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(aiAnalysisService.getPortfolioAnalysis(jobCandidateId));
    }

    @GetMapping("/{jobCandidateId}/interview")
    public ResponseEntity<InterviewAnalysisResponse> getInterviewAnalysis(@PathVariable Long jobCandidateId) {
        if (!aiAccessService.canAccessJobCandidate(jobCandidateId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        return aiAnalysisService.getInterviewAnalysis(jobCandidateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

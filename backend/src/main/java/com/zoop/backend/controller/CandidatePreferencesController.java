package com.zoop.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;

import com.zoop.backend.domain.dto.CandidatePreferencesDto;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.service.CandidateService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name="CandidatePreferencesController", description = "후보자 설정 정보 관련 API")
@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidatePreferencesController {

    private final CandidateService candidateService;

    @Operation(summary = "후보자 설정 정보 조회", description = "특정 후보자의 설정 정보를 조회합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "설정 정보 조회 성공",
            content = @Content(schema = @Schema(implementation = CandidatePreferencesDto.class))),
        @ApiResponse(responseCode = "404", description = "후보자를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @GetMapping("/{candidateId}/preferences")
    public ResponseEntity<CandidatePreferencesDto> getPreferences(
            @PathVariable Long candidateId) {
        try {
            if (!ownsCandidate(candidateId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            CandidatePreferencesDto preferences = candidateService.getPreferences(candidateId);
            return ResponseEntity.ok(preferences);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @Operation(summary = "후보자 설정 정보 업데이트", description = "후보자의 설정 정보를 업데이트합니다.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "설정 정보 업데이트 성공",
            content = @Content(schema = @Schema(implementation = Candidate.class))),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "404", description = "후보자를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    @PutMapping("/{candidateId}/preferences")
    public ResponseEntity<Candidate> updatePreferences(
            @PathVariable Long candidateId,
            @RequestBody CandidatePreferencesDto preferencesDto) {
        try {
            if (!ownsCandidate(candidateId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            preferencesDto.setCandidateId(candidateId);
            Candidate updatedCandidate = candidateService.updatePreferences(preferencesDto);
            return ResponseEntity.ok(updatedCandidate);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private boolean ownsCandidate(Long candidateId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return candidateService.findById(candidateId)
                .map(candidate -> candidate.getGithubLogin() != null
                        && candidate.getGithubLogin().equals(authentication.getName()))
                .orElse(false);
    }
}

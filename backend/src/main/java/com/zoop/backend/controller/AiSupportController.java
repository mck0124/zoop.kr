package com.zoop.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.service.PythonApiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiSupportController {
    private final PythonApiService pythonApiService;

    @PostMapping("/support")
    public ResponseEntity<Map<String, String>> support(@RequestBody Map<String, String> request) {
        String question = request == null ? "" : request.getOrDefault("question", "").trim();
        String language = request == null ? "en" : request.getOrDefault("language", "en");
        if (question.isBlank() || question.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Enter a question between 1 and 1,000 characters."));
        }
        return ResponseEntity.ok(Map.of("answer", pythonApiService.answerSupportQuestion(question, language)));
    }
}

package com.zoop.backend.domain.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class FilterRequestDto {
    private Long postId;
    private List<String> roles; // ❗ 실제로 사용하지 않지만 DB 저장용
    private List<String> languages;
    private List<String> regions;
    private boolean nationwide;
    private int salary;   // ❗ DB 저장용
    private int headcount; // ❗ DB 저장용
    private String idealCandidate; // 인재상 저장용
    private String language = "en"; // AI 자연어 결과 언어
}

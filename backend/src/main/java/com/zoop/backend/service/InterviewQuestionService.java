package com.zoop.backend.service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.AiInterviewSchedule;
import com.zoop.backend.domain.entity.InterviewQuestion;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.AiAnalysisResultRepository;
import com.zoop.backend.repository.AiInterviewScheduleRepository;
import com.zoop.backend.repository.InterviewQuestionRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PostRepository;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class InterviewQuestionService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private JobCandProgressRepository jobCandProgressRepository;

    @Autowired
    private AiAnalysisResultRepository aiAnalysisResultRepository;

    @Autowired
    private InterviewQuestionRepository interviewQuestionRepository;

    @Autowired
    private AiInterviewScheduleRepository aiInterviewScheduleRepository;

    @Autowired
    private PythonApiService pythonApiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 면접 예상질문 생성 (캐싱 포함)
     */
    @Transactional
    public List<String> generateInterviewQuestions(Long postId, Long candidateId) {
        log.info("면접 예상질문 생성 요청: postId={}, candidateId={}", postId, candidateId);

        try {
            // 1. 필요한 데이터 수집
            Post post = getPostDetails(postId);
            Long jobCandidateId = getJobCandidateId(postId, candidateId);
            String portfolioAnalysis = getPortfolioAnalysis(jobCandidateId);

            // 2. 컨텐츠 해시 생성 (변경 감지용)
            String contentHash = generateContentHash(post, portfolioAnalysis);
            log.debug("생성된 컨텐츠 해시: {}", contentHash);

            // 3. 기존 질문 확인
            Optional<InterviewQuestion> existingQuestion = interviewQuestionRepository
                .findQuestionByPostAndCandidate(postId, jobCandidateId);

            if (existingQuestion.isPresent()) {
                if (contentHash.equals(existingQuestion.get().getContentHash())) {
                    // 컨텐츠 변경 없음 - 기존 질문 반환
                    log.info("기존 질문 반환: questionId={}", existingQuestion.get().getQuestionId());
                    return parseQuestionsFromJson(existingQuestion.get().getQuestionsJson());
                } else {
                    // 컨텐츠 변경됨 - 기존 질문 수정
                    log.info("컨텐츠 변경 감지 - 기존 질문 수정");
                    List<String> newQuestions = generateNewQuestions(post, portfolioAnalysis);
                    updateExistingQuestions(postId, jobCandidateId, newQuestions, contentHash);
                    return newQuestions;
                }
            }

            // 4. 새로운 질문 생성
            List<String> newQuestions = generateNewQuestions(post, portfolioAnalysis);

            // 5. 생성된 질문 저장 (면접 마감시간 포함)
            LocalDateTime interviewDeadline = getInterviewDeadline(jobCandidateId);
            saveQuestions(postId, jobCandidateId, newQuestions, contentHash, interviewDeadline);

            log.info("새로운 질문 생성 및 저장 완료: {}개 질문", newQuestions.size());
            return newQuestions;

        } catch (Exception e) {
            log.error("면접 예상질문 생성 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("맞춤형 면접 질문을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.", e);
        }
    }

    /**
     * 공고 상세 정보 조회
     */
    private Post getPostDetails(Long postId) {
        return postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다: " + postId));
    }

    /**
     * JobCandidateId 조회
     */
    private Long getJobCandidateId(Long postId, Long candidateId) {
        JobCandProgress progress = jobCandProgressRepository
            .findByPost_PostIdAndCandidate_CandidateId(postId, candidateId)
            .orElseThrow(() -> new RuntimeException("해당 지원 정보를 찾을 수 없습니다: postId=" + postId + ", candidateId=" + candidateId));
        
        return progress.getJobCandidateId();
    }

    /**
     * 포트폴리오 분석 결과 조회
     */
    private String getPortfolioAnalysis(Long jobCandidateId) {
        List<AiAnalysisResult> results = aiAnalysisResultRepository
            .findByJobCandidateIdAndAnalysisTypeOrderByAnalysisDateDesc(jobCandidateId, "portfolio");
        
        if (!results.isEmpty()) {
            String analysisData = results.get(0).getAnalysisData();
            log.debug("포트폴리오 분석 결과 조회 성공: {}자", analysisData != null ? analysisData.length() : 0);
            return analysisData != null ? analysisData : "";
        }
        
        log.info("포트폴리오 분석 결과 없음 - 빈 문자열 반환");
        return "";
    }

    /**
     * 컨텐츠 해시 생성 (변경 감지용)
     */
    private String generateContentHash(Post post, String portfolioAnalysis) {
        StringBuilder content = new StringBuilder();
        content.append(post.getPostTitle() != null ? post.getPostTitle() : "");
        content.append(post.getPostDescription() != null ? post.getPostDescription() : "");
        content.append(post.getPostProgrammingLanguage() != null ? post.getPostProgrammingLanguage() : "");
        content.append(post.getPostIdealCandidate() != null ? post.getPostIdealCandidate() : "");
        content.append(post.getPostLocation() != null ? post.getPostLocation() : "");
        content.append(portfolioAnalysis);

        return DigestUtils.md5DigestAsHex(content.toString().getBytes());
    }

    /**
     * 새로운 질문 생성 (Python API 호출)
     */
    private List<String> generateNewQuestions(Post post, String portfolioAnalysis) {
        String salaryRange = buildSalaryRange(post.getPostSalaryStart(), post.getPostSalaryEnd());
        
        return pythonApiService.generatePreparationQuestions(
            post.getPostTitle(),
            post.getPostDescription(),
            post.getPostProgrammingLanguage(),
            post.getPostIdealCandidate(),
            post.getPostLocation(),
            salaryRange,
            post.getPostHeadcount(),
            portfolioAnalysis
        );
    }

    /**
     * 연봉 범위 문자열 생성
     */
    private String buildSalaryRange(String salaryStart, String salaryEnd) {
        if (salaryStart != null && salaryEnd != null) {
            return salaryStart + "~" + salaryEnd;
        } else if (salaryStart != null) {
            return salaryStart + "~";
        } else if (salaryEnd != null) {
            return "~" + salaryEnd;
        }
        return "";
    }

    /**
     * 생성된 질문들을 DB에 저장
     */
    private void saveQuestions(Long postId, Long jobCandidateId, List<String> questions, String contentHash, LocalDateTime interviewDeadline) {
        try {
            String questionsJson = objectMapper.writeValueAsString(questions);
            
            InterviewQuestion entity = InterviewQuestion.builder()
                .postId(postId)
                .jobCandidateId(jobCandidateId)
                .questionsJson(questionsJson)
                .contentHash(contentHash)
                .interviewDeadline(interviewDeadline)
                .build();

            interviewQuestionRepository.save(entity);
            log.debug("질문 저장 완료: questionId={}", entity.getQuestionId());

        } catch (JsonProcessingException e) {
            log.error("질문 JSON 직렬화 오류: {}", e.getMessage(), e);
            throw new RuntimeException("질문 저장 중 오류 발생", e);
        }
    }

    /**
     * JSON 문자열을 질문 리스트로 파싱
     */
    private List<String> parseQuestionsFromJson(String questionsJson) {
        try {
            return objectMapper.readValue(questionsJson, List.class);
        } catch (JsonProcessingException e) {
            log.error("질문 JSON 파싱 오류: {}", e.getMessage(), e);
            throw new RuntimeException("저장된 면접 질문을 읽지 못했습니다. 다시 생성해주세요.", e);
        }
    }

    /**
     * 특정 공고+후보자의 질문 존재 여부 확인
     */
    public boolean hasQuestions(Long postId, Long candidateId) {
        try {
            Long jobCandidateId = getJobCandidateId(postId, candidateId);
            return interviewQuestionRepository.existsByPostIdAndJobCandidateId(
                postId, jobCandidateId);
        } catch (Exception e) {
            log.warn("질문 존재 여부 확인 중 오류: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 기존 질문 내용 수정
     */
    private void updateExistingQuestions(Long postId, Long jobCandidateId, List<String> questions, String contentHash) {
        try {
            String questionsJson = objectMapper.writeValueAsString(questions);
            int updatedCount = interviewQuestionRepository.updateQuestions(postId, jobCandidateId, questionsJson, contentHash);
            
            if (updatedCount > 0) {
                log.debug("질문 수정 완료: postId={}, jobCandidateId={}", postId, jobCandidateId);
            } else {
                log.warn("질문 수정 실패: 대상 레코드를 찾을 수 없음");
            }
        } catch (JsonProcessingException e) {
            log.error("질문 JSON 직렬화 오류: {}", e.getMessage(), e);
            throw new RuntimeException("질문 수정 중 오류 발생", e);
        }
    }

    /**
     * 면접 마감시간 조회
     */
    private LocalDateTime getInterviewDeadline(Long jobCandidateId) {
        try {
            // AiInterviewSchedule에서 실제 면접 마감시간 조회
            List<AiInterviewSchedule> schedules = aiInterviewScheduleRepository
                .findByJobCandProgress_JobCandidateId(jobCandidateId);
            
            if (!schedules.isEmpty()) {
                // 가장 최근 스케줄의 마감시간 사용
                AiInterviewSchedule latestSchedule = schedules.get(0);
                LocalDateTime deadline = latestSchedule.getAiInterviewDeadlineTime();
                
                log.debug("실제 면접 마감시간 조회 성공: jobCandidateId={}, deadline={}", jobCandidateId, deadline);
                return deadline;
            } else {
                log.warn("면접 스케줄을 찾을 수 없음: jobCandidateId={}, 기본값(3일 후) 사용", jobCandidateId);
                return LocalDateTime.now().plusDays(3);
            }
            
        } catch (Exception e) {
            log.error("면접 마감시간 조회 중 오류: jobCandidateId={}, error={}", jobCandidateId, e.getMessage());
            // 오류 발생 시 안전한 기본값 반환 (3일 후)
            return LocalDateTime.now().plusDays(3);
        }
    }
}

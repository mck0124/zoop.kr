package com.zoop.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service; // JobCandProgress 엔티티 임포트
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // JobCandProgressRepository 임포트
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.zoop.backend.domain.dto.AiAnalysisResultDto;
import com.zoop.backend.service.AiAnalysisResultService;

import com.zoop.backend.domain.dto.CareerDataDto;
import com.zoop.backend.domain.dto.PortfolioSubmissionResponseDto;
import com.zoop.backend.domain.dto.modal.PortfolioSubmissionDateResponse;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.CandidateJobExperience;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Portfolio;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.CandidateJobExperienceRepository;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PortfolioRepository;
import com.zoop.backend.repository.PostRepository;
import com.zoop.backend.service.CompanyNotificationService;

@Service
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final S3Service s3Service;
    private final JobCandProgressRepository jobCandProgressRepository; // JobCandProgressRepository 주입
    private final CandidateRepository candidateRepository;
    private final CandidateJobExperienceRepository candidateJobExperienceRepository;
    private final PostRepository postRepository;
    private final AiAnalysisResultService aiAnalysisResultService;
    private final JobCandProgressService jobCandProgressService;
    private final CompanyNotificationService companyNotificationService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String pythonApiUrl;

    @Autowired
    public PortfolioService(PortfolioRepository portfolioRepository, S3Service s3Service,
                            JobCandProgressRepository jobCandProgressRepository,
                            CandidateRepository candidateRepository,
                            CandidateJobExperienceRepository candidateJobExperienceRepository,
                            PostRepository postRepository,
                            AiAnalysisResultService aiAnalysisResultService,
                            JobCandProgressService jobCandProgressService,
                            CompanyNotificationService companyNotificationService,
                            @Value("${python.api.url:http://localhost:8000}") String pythonBaseUrl) { // 생성자 주입
        this.portfolioRepository = portfolioRepository;
        this.s3Service = s3Service;
        this.jobCandProgressRepository = jobCandProgressRepository;
        this.candidateRepository = candidateRepository;
        this.candidateJobExperienceRepository = candidateJobExperienceRepository;
        this.postRepository = postRepository;
        this.aiAnalysisResultService = aiAnalysisResultService;
        this.jobCandProgressService = jobCandProgressService;
        this.companyNotificationService = companyNotificationService;
        this.pythonApiUrl = pythonBaseUrl.endsWith("/")
                ? pythonBaseUrl + "analyze-portfolio"
                : pythonBaseUrl + "/analyze-portfolio";
    }
    
    @Transactional
    public PortfolioSubmissionResponseDto submitPortfolio(
            Integer postId,
            Integer candidateId, // 이 candidateId는 사용자의 ID입니다 (예: 13)
            MultipartFile portfolioFile,
            boolean useExistingPortfolio,
            String existingPortfolioPath,
            String portfolioUrl,
            CareerDataDto careerData,
            String goalStatement,
            String suitabilityStatement,
            boolean agreeRequiredPersonal,
            boolean agreeOptionalPersonal,
            boolean agreeFutureProposals,
            boolean agreeReceiveRecruitmentInfo,
            String source // "apply" or "dashboard"
    ) {
        System.out.println("==== PortfolioService.submitPortfolio() 호출됨 ====");
        System.out.println("[PortfolioService] portfolioFile: " + (portfolioFile != null ? portfolioFile.getOriginalFilename() : "null"));
        
        // 필수 동의 체크
        if (!agreeRequiredPersonal) {
            throw new IllegalArgumentException("필수 개인정보 수집 및 이용에 동의해야 합니다.");
        }
        
        // 포트폴리오 파일 필수 체크
        // 포트폴리오 파일 처리 (기존 파일 사용 vs 새 파일 업로드)
        String portfolioFilePath = null;
        
        if (useExistingPortfolio && existingPortfolioPath != null && !existingPortfolioPath.trim().isEmpty()) {
            // 기존 포트폴리오 파일 경로 사용
            portfolioFilePath = existingPortfolioPath;
            System.out.println("[PortfolioService] 기존 포트폴리오 파일 사용: " + portfolioFilePath);
        } else if (portfolioFile != null && !portfolioFile.isEmpty()) {
            // 새 파일 S3 업로드
            try {
                System.out.println("[PortfolioService] S3 업로드 시작 전 - portfolioFile: " + portfolioFile.getOriginalFilename());
                portfolioFilePath = s3Service.uploadPortfolioFile(portfolioFile);
                System.out.println("[PortfolioService] S3 업로드 완료 후 - portfolioFilePath: " + portfolioFilePath);
            } catch (Exception e) {
                System.err.println("[PortfolioService] S3 업로드 중 예외 발생: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("포트폴리오 파일 업로드 실패: " + e.getMessage(), e);
            }
        } else {
            throw new IllegalArgumentException("포트폴리오 파일이 필요합니다. 기존 파일을 사용하거나 새 파일을 업로드해주세요.");
        }
        
        // --- 핵심 변경 부분 ---
        // 1. postId와 사용자 candidateId를 사용하여 JobCandProgress 레코드를 찾거나 생성합니다.
        JobCandProgress jobCandProgress = jobCandProgressRepository
            .findByPost_PostIdAndCandidate_CandidateId(postId.longValue(), candidateId.longValue())
            .orElseGet(() -> {
                // 신규 생성
                System.out.println("[PortfolioService] JobCandProgress 레코드가 없어서 새로 생성합니다.");
                Candidate candidate = candidateRepository.findById(Long.valueOf(candidateId))
                    .orElseThrow(() -> new RuntimeException("해당 후보자를 찾을 수 없습니다."));
                var post = postRepository.findById(Long.valueOf(postId))
                    .orElseThrow(() -> new RuntimeException("해당 공고를 찾을 수 없습니다."));
                JobCandProgress newProgress = new JobCandProgress();
                newProgress.setPost(post);
                newProgress.setCandidate(candidate);
                // source에 따라 stage 분기
                if ("dashboard".equals(source)) {
                    newProgress.setJobCandCurrStage("2y");
                } else {
                    newProgress.setJobCandCurrStage("0");
                }
                newProgress.setJobCandPortfolioSubDate(LocalDateTime.now());
                newProgress.setJobCandCreatedAt(LocalDateTime.now());
                newProgress.setJobCandUpdatedAt(LocalDateTime.now());
                newProgress.setGithubLogin(candidate.getGithubLogin());
                JobCandProgress saved = jobCandProgressRepository.save(newProgress);
                // 추가 지원자 알림 (기업)
                if ("apply".equals(source)) {
                    companyNotificationService.createAdditionalApplicantNotification(
                        post.getCompanyAdminId(),
                        post.getPostId(),
                        candidate.getCandidateId()
                    );
                }
                return saved;
            });

        // 이미 존재하는 경우에도 source에 따라 stage를 명확히 분기
        if ("dashboard".equals(source)) {
            jobCandProgress.setJobCandCurrStage("2y");
            jobCandProgress.setJobCandPortfolioSubDate(LocalDateTime.now());
            jobCandProgress.setJobCandUpdatedAt(LocalDateTime.now());
            jobCandProgressRepository.save(jobCandProgress);
        } else if ("apply".equals(source)) {
            jobCandProgress.setJobCandCurrStage("0");
            jobCandProgress.setJobCandPortfolioSubDate(LocalDateTime.now());
            jobCandProgress.setJobCandUpdatedAt(LocalDateTime.now());
            jobCandProgressRepository.save(jobCandProgress);
        }

        // 2. 찾은 JobCandProgress 레코드의 기본 키(job_candidate_id)를 가져옵니다.
        //    이것이 portfolios 테이블의 job_candidate_id에 들어가야 할 실제 값입니다.
        // JobCandProgress에서 가져온 ID 값을 Integer로 변환
        Integer jobCandProgressPk = jobCandProgress.getJobCandidateId().intValue();

        System.out.println("[PortfolioService] portfolioFilePath(S3 URL): " + portfolioFilePath);
        
        // 기존 포트폴리오가 있는지 확인
        Optional<Portfolio> existingPortfolio = portfolioRepository.findByJobCandidateId(jobCandProgressPk)
                .stream().findFirst();
        
        Portfolio portfolio;
        if (existingPortfolio.isPresent()) {
            // 기존 포트폴리오 업데이트
            System.out.println("[PortfolioService] 기존 포트폴리오 업데이트");
            portfolio = existingPortfolio.get();
            portfolio.setPortfolioFilePath(portfolioFilePath);
            portfolio.setPortfolioUpdatedAt(new Date());
        } else {
            // 새 포트폴리오 생성
            System.out.println("[PortfolioService] 새 포트폴리오 생성");
            portfolio = Portfolio.builder()
                    .jobCandidateId(jobCandProgressPk)
                    .portfolioFilePath(portfolioFilePath)
                    .portfolioAnalysisStatus("PENDING")
                    .build();
        }
        
        System.out.println("[PortfolioService] DB 저장 시작");
        Portfolio savedPortfolio = portfolioRepository.save(portfolio);
        System.out.println("[PortfolioService] DB 저장 완료 - 저장된 Portfolio의 portfolioFilePath: " + savedPortfolio.getPortfolioFilePath());
        System.out.println("[PortfolioService] 저장된 Portfolio 전체 정보: " + savedPortfolio.toString());

        // (기존) 개인대시보드에서 포트폴리오 제출 시 stage를 2y로 업데이트
        // (기존) 채용페이지에서 지원했을 때는 0으로 유지, 개인대시보드에서 포트폴리오 제출 시 2y로 변경
        // 아래 코드는 더 이상 필요 없음. source 분기에서 이미 처리됨.
        // String currentStage = jobCandProgress.getJobCandCurrStage();
        // if ("0".equals(currentStage) || "1n".equals(currentStage) || "2n".equals(currentStage)) {
        //     System.out.println("[PortfolioService] Stage 업데이트: " + currentStage + " → 2y");
        //     // 알림 생성과 함께 stage 업데이트
        //     jobCandProgressService.updateStageWithNotification(jobCandProgress.getJobCandidateId(), "2y");
        // } else {
        //     System.out.println("[PortfolioService] Stage 업데이트 스킵: 현재 stage = " + currentStage);
        // }
        jobCandProgress.setJobCandPortfolioSubDate(LocalDateTime.now()); // 포트폴리오 제출 시각 기록
        jobCandProgressRepository.save(jobCandProgress); // 업데이트된 JobCandProgress 저장
        
        // --- 후보자 경력구분/총경력기간 저장 ---
        Candidate candidate = candidateRepository.findById(Long.valueOf(candidateId))
            .orElseThrow(() -> new RuntimeException("해당 후보자를 찾을 수 없습니다."));
        System.out.println("[PortfolioService] careerData (full object): " + careerData);
        if (careerData != null) {
            System.out.println("[PortfolioService] careerData fields: isExperienced=" + careerData.getIsExperienced() + ", totalYearsOfExperience=" + careerData.getTotalYearsOfExperience() + ", workExperiences=" + careerData.getWorkExperiences());
        }
        // Robustly handle isExperienced as String (from CareerDataDto)
        boolean isExperienced = "true".equalsIgnoreCase(careerData.getIsExperienced());
        System.out.println("[PortfolioService] isExperienced (parsed): " + isExperienced + " (raw: " + careerData.getIsExperienced() + ")");
        if (careerData != null) {
            candidate.setCareerType(isExperienced ? "경력" : "신입");
            candidate.setTotalCareerPeriod(isExperienced ? String.valueOf(careerData.getTotalYearsOfExperience()) : "0");
            candidateRepository.save(candidate);
        }

        // --- 업무경험 저장 (기존 데이터 삭제 후 재저장) ---
        // 임시로 주석 처리 - candidate_job_experiences 테이블이 존재하지 않음
        /*
        List<CandidateJobExperience> oldExps = candidateJobExperienceRepository.findByCandidate(candidate);
        candidateJobExperienceRepository.deleteAll(oldExps);
        if (careerData != null && isExperienced && careerData.getWorkExperiences() != null) {
            System.out.println("[PortfolioService] workExperiences size: " + careerData.getWorkExperiences().size());
            for (var exp : careerData.getWorkExperiences()) {
                System.out.println("[PortfolioService] workExperience item: companyName=" + exp.getCompanyName() + ", jobTitle=" + exp.getJobTitle() + ", startDate=" + exp.getStartDate() + ", endDate=" + exp.getEndDate());
                if (exp.getCompanyName() != null && !exp.getCompanyName().isEmpty()
                    && exp.getJobTitle() != null && !exp.getJobTitle().isEmpty()
                    && exp.getStartDate() != null && !exp.getStartDate().isEmpty()) {
                    CandidateJobExperience entity = CandidateJobExperience.builder()
                        .candidate(candidate)
                        .companyName(exp.getCompanyName())
                        .jobTitle(exp.getJobTitle())
                        .startDate(LocalDate.parse(exp.getStartDate()))
                        .endDate(exp.getEndDate() != null && !exp.getEndDate().isEmpty() ? LocalDate.parse(exp.getEndDate()) : null)
                        .build();
                    candidateJobExperienceRepository.save(entity);
                } else {
                    System.out.println("[PortfolioService] 업무경험 저장 SKIP: 필수값 누락");
                }
            }
        }
        */
        System.out.println("[PortfolioService] 업무경험 저장 SKIP: candidate_job_experiences 테이블 없음");
        
        PortfolioSubmissionResponseDto response = new PortfolioSubmissionResponseDto();
        response.setPortfolioId(savedPortfolio.getPortfolioId());
        response.setMessage("포트폴리오가 성공적으로 제출되었습니다.");
        response.setSuccess(true);
        System.out.println("[PortfolioService] 응답 DTO 설정 전 - savedPortfolio.getPortfolioFilePath(): " + savedPortfolio.getPortfolioFilePath());
        response.setPortfolioFilePath(savedPortfolio.getPortfolioFilePath()); // S3 URL 응답에 포함
        response.setRedirectUrl("/candidate/dashboard");
        System.out.println("[PortfolioService] 응답 DTO 설정 후 - response.getPortfolioFilePath(): " + response.getPortfolioFilePath());
        System.out.println("[PortfolioService] 최종 응답: " + response.toString());
        
        // ====== 포트폴리오 제출 후 자동 분석 및 결과 저장 ======
        try {
            // FastAPI 엔드포인트로 JSON 데이터 전송
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // 지원자 정보 조회 (희망 직무, 자기소개 등)
            Candidate candidateInfo = candidateRepository.findById(Long.valueOf(candidateId))
                .orElseThrow(() -> new RuntimeException("해당 후보자를 찾을 수 없습니다."));
            
            // JSON 요청 바디 구성
            java.util.Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("file_url", savedPortfolio.getPortfolioFilePath());
            
            java.util.Map<String, Object> extraInfo = new java.util.HashMap<>();
            extraInfo.put("portfolio_id", savedPortfolio.getPortfolioId());
            extraInfo.put("candidate_id", candidateId);
            extraInfo.put("portfolio_content", goalStatement != null ? goalStatement : "");
            extraInfo.put("desired_job", candidateInfo.getPreferredJob() != null ? candidateInfo.getPreferredJob() : "");
            extraInfo.put("self_introduction", ""); // Candidate 엔티티에 selfIntro 필드가 없으므로 빈 문자열로 설정
            requestBody.put("extra_info", extraInfo);
            
            HttpEntity<java.util.Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<java.util.Map> resp = restTemplate.postForEntity(pythonApiUrl, entity, java.util.Map.class);
            String result = resp.getBody() != null ? (String) resp.getBody().get("result") : null;
            if (result != null && !result.isBlank()) {
                AiAnalysisResultDto dto = AiAnalysisResultDto.builder()
                    .analysisType("portfolio")
                    .jobCandidateId(Long.valueOf(savedPortfolio.getJobCandidateId()))
                    .analysisData(result)
                    .analysisScore(extractScore(result))
                    .build();
                aiAnalysisResultService.saveAiAnalysisResult(dto);
                // 상태 COMPLETED로 변경
                savedPortfolio.setPortfolioAnalysisStatus("COMPLETED");
                portfolioRepository.save(savedPortfolio);
            }
        } catch (Exception e) {
            System.err.println("[PortfolioService] 포트폴리오 자동 분석 실패: " + e.getMessage());
        }
        // ====== END 자동 분석 ======

        return response;
    }
    
    public List<Portfolio> getPortfoliosByCandidate(Integer candidateId, Integer postId) {
        if (postId == null) {
            // postId가 없으면 지원자의 모든 포트폴리오 반환
            return portfolioRepository.findByJobCandidateId(candidateId);
        } else {
            // postId가 있으면 해당 공고에 대한 포트폴리오만 반환
            return getPortfoliosByPost(candidateId, postId);
        }
    }
    
    private List<Portfolio> getPortfoliosByPost(Integer candidateId, Integer postId) {
        // JobCandProgress를 찾아서 해당 job_candidate_id로 포트폴리오 조회
        Optional<JobCandProgress> progress = jobCandProgressRepository
            .findByPost_PostIdAndCandidate_CandidateId(postId.longValue(), candidateId.longValue());
        
        if (progress.isPresent()) {
            Integer jobCandProgressPk = progress.get().getJobCandidateId().intValue();
            return portfolioRepository.findByJobCandidateId(jobCandProgressPk);
        } else {
            return List.of(); // 해당 공고에 지원하지 않았으면 빈 리스트 반환
        }
    }
    
    public Optional<Portfolio> getPortfolio(Integer portfolioId) {
        return portfolioRepository.findById(portfolioId);
    }

    // 내 버전의 유용한 메서드들
    public Map<String, Object> getRecentPortfolioByCandidate(Integer candidateId) {
        System.out.println("[PortfolioService] getRecentPortfolioByCandidate 호출 - candidateId: " + candidateId);
        
        // 해당 지원자의 모든 JobCandProgress를 조회
        List<JobCandProgress> progressList = jobCandProgressRepository.findByCandidate_CandidateId(candidateId.intValue());
        System.out.println("[PortfolioService] progressList.size(): " + progressList.size());
        
        if (progressList.isEmpty()) {
            System.out.println("[PortfolioService] progressList가 비어있음");
            return Map.of("hasPortfolio", false);
        }
        
        // 모든 JobCandProgress의 job_candidate_id로 포트폴리오 조회
        List<Portfolio> allPortfolios = new ArrayList<>();
        for (JobCandProgress progress : progressList) {
            System.out.println("[PortfolioService] progress.jobCandidateId: " + progress.getJobCandidateId());
            List<Portfolio> portfolios = portfolioRepository.findByJobCandidateId(progress.getJobCandidateId().intValue());
            System.out.println("[PortfolioService] portfolios.size() for jobCandidateId " + progress.getJobCandidateId() + ": " + portfolios.size());
            allPortfolios.addAll(portfolios);
        }
        
        System.out.println("[PortfolioService] allPortfolios.size(): " + allPortfolios.size());
        
        if (allPortfolios.isEmpty()) {
            System.out.println("[PortfolioService] allPortfolios가 비어있음");
            return Map.of("hasPortfolio", false);
        }
        
        // 가장 최근에 생성된 포트폴리오 찾기 (null 체크 추가)
        Portfolio recentPortfolio = allPortfolios.stream()
            .filter(p -> p.getPortfolioCreatedAt() != null)
            .max((p1, p2) -> p1.getPortfolioCreatedAt().compareTo(p2.getPortfolioCreatedAt()))
            .orElse(null);
            
        if (recentPortfolio == null) {
            return Map.of("hasPortfolio", false);
        }
        
        // JobCandProgress 정보도 함께 조회하여 어떤 공고에 대한 포트폴리오인지 확인
        Optional<JobCandProgress> progress = jobCandProgressRepository.findByJobCandidateId(Long.valueOf(recentPortfolio.getJobCandidateId()));
        
        Map<String, Object> result = new HashMap<>();
        result.put("hasPortfolio", true);
        result.put("portfolioId", recentPortfolio.getPortfolioId());
        result.put("portfolioFilePath", recentPortfolio.getPortfolioFilePath());
        result.put("portfolioAnalysisStatus", recentPortfolio.getPortfolioAnalysisStatus());
        result.put("portfolioSubmissionDate", recentPortfolio.getPortfolioSubmissionDate());
        result.put("portfolioCreatedAt", recentPortfolio.getPortfolioCreatedAt());
        
        // 파일명 추출 (S3 URL에서)
        if (recentPortfolio.getPortfolioFilePath() != null) {
            String fileName = recentPortfolio.getPortfolioFilePath().substring(
                recentPortfolio.getPortfolioFilePath().lastIndexOf("/") + 1
            );
            // UUID 부분 제거하여 원본 파일명 복원
            if (fileName.contains("_")) {
                fileName = fileName.substring(fileName.indexOf("_") + 1);
            }
            result.put("originalFileName", fileName);
        }
        
        if (progress.isPresent()) {
            result.put("postId", progress.get().getPost().getPostId());
            result.put("postTitle", progress.get().getPost().getPostTitle());
        }
        
        return result;
    }

    public List<Map<String, Object>> getDirectApplicantsByPost(Integer postId) {
        // 해당 공고에서 stage가 "0"인 JobCandProgress만 조회
        List<JobCandProgress> progressList = jobCandProgressRepository.findByPost_PostIdAndJobCandCurrStage(Long.valueOf(postId), "0");
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (JobCandProgress progress : progressList) {
            
            // JobCandProgress의 job_candidate_id로 포트폴리오 조회
            List<Portfolio> portfolios = portfolioRepository.findByJobCandidateId(progress.getJobCandidateId().intValue());
            
            if (!portfolios.isEmpty()) {
                // 포트폴리오가 있고 stage가 "0"인 경우만 직접 지원자로 간주
                Portfolio portfolio = portfolios.get(0); // 첫 번째 포트폴리오 사용
                Candidate candidate = progress.getCandidate();
                
                Map<String, Object> applicant = new HashMap<>();
                applicant.put("candidateId", candidate.getCandidateId());
                applicant.put("candidateName", candidate.getCandidateName());
                applicant.put("candidateEmail", candidate.getCandidateEmail());
                applicant.put("candidatePhoneNumber", candidate.getCandidatePhoneNumber());
                applicant.put("githubLogin", candidate.getGithubLogin());
                applicant.put("careerType", candidate.getCareerType());
                applicant.put("totalCareerPeriod", candidate.getTotalCareerPeriod());
                applicant.put("portfolioId", portfolio.getPortfolioId());
                applicant.put("portfolioFilePath", portfolio.getPortfolioFilePath());
                applicant.put("portfolioSubmissionDate", portfolio.getPortfolioSubmissionDate());
                applicant.put("jobCandCurrStage", progress.getJobCandCurrStage());
                applicant.put("postId", progress.getPost().getPostId());
                applicant.put("postTitle", progress.getPost().getPostTitle());
                applicant.put("jobCandPortfolioSubDate", progress.getJobCandPortfolioSubDate());
                applicant.put("jobCandidateId", progress.getJobCandidateId()); // AI 분석 결과 조회를 위해 추가
                
                result.add(applicant);
            }
        }
        
        return result;
    }

    public List<Portfolio> getPendingPortfolios() {
        return portfolioRepository.findByPortfolioAnalysisStatus("PENDING");
    }

    // PENDING 포트폴리오 자동 분석 및 저장
    public void analyzePendingPortfolios() {
        List<Portfolio> pendingList = getPendingPortfolios();
        for (Portfolio pf : pendingList) {
            try {
                // 분석 요청
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                String fileUrl = pf.getPortfolioFilePath();
                // 부가정보(지원자명 등) 필요시 추가
                var extraInfo = new java.util.HashMap<String, Object>();
                extraInfo.put("jobCandidateId", pf.getJobCandidateId());
                // 요청 바디
                var body = new java.util.HashMap<String, Object>();
                body.put("file_url", fileUrl);
                body.put("extra_info", extraInfo);
                HttpEntity<java.util.Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<java.util.Map> resp = restTemplate.postForEntity(pythonApiUrl, entity, java.util.Map.class);
                String result = resp.getBody() != null ? (String) resp.getBody().get("result") : null;
                if (result != null && !result.isBlank()) {
                    // 분석 결과 저장 전 jobCandidateId 체크
                    Long jobCandidateId = pf.getJobCandidateId() != null ? Long.valueOf(pf.getJobCandidateId()) : null;
                    if (jobCandidateId == null || jobCandidateId == 0) {
                        System.err.println("[PortfolioService] 분석 결과 저장 SKIP: jobCandidateId가 null 또는 0입니다. portfolioId=" + pf.getPortfolioId());
                        continue;
                    }
                    AiAnalysisResultDto dto = AiAnalysisResultDto.builder()
                        .analysisType("portfolio")
                        .jobCandidateId(jobCandidateId)
                        .analysisData(result)
                        .analysisScore(extractScore(result))
                        .build();
                    aiAnalysisResultService.saveAiAnalysisResult(dto);
                    // 상태 COMPLETED로 변경
                    pf.setPortfolioAnalysisStatus("COMPLETED");
                    portfolioRepository.save(pf);
                }
            } catch (Exception e) {
                System.err.println("[PortfolioService] 분석 실패: " + e.getMessage());
            }
        }
    }

    // 분석 결과에서 점수 추출 (예: (점수: 87점))
    private Double extractScore(String result) {
        try {
            // 여러 패턴으로 점수 추출 시도
            java.util.regex.Pattern[] patterns = {
                java.util.regex.Pattern.compile("\\(점수: (\\d+)점\\)"),
                java.util.regex.Pattern.compile("점수: (\\d+)점"),
                java.util.regex.Pattern.compile("종합 점수: (\\d+)점"),
                java.util.regex.Pattern.compile("총점: (\\d+)점")
            };
            
            for (java.util.regex.Pattern pattern : patterns) {
                java.util.regex.Matcher m = pattern.matcher(result);
                if (m.find()) {
                    Double score = Double.valueOf(m.group(1));
                    System.out.println("[PortfolioService] 점수 추출 성공: " + score + "점 (패턴: " + pattern.pattern() + ")");
                    return score;
                }
            }
            
            System.out.println("[PortfolioService] 점수 추출 실패: 패턴을 찾을 수 없음");
            System.out.println("[PortfolioService] 분석 결과 일부: " + (result != null ? result.substring(0, Math.min(200, result.length())) : "null"));
        } catch (Exception e) {
            System.err.println("[PortfolioService] 점수 추출 중 오류: " + e.getMessage());
        }
        return null;
    }

    // 포트폴리오 분석 상태 업데이트
    public void updatePortfolioAnalysisStatus(Integer portfolioId, String status) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("포트폴리오를 찾을 수 없습니다: " + portfolioId));
        
        portfolio.setPortfolioAnalysisStatus(status);
        portfolioRepository.save(portfolio);
        System.out.println("[PortfolioService] 포트폴리오 분석 상태 업데이트: portfolioId=" + portfolioId + ", status=" + status);
    }

    // 팀 버전의 유용한 메서드들
    public String getFilePathByJobCandId(Long jobCandidateId) {
        return portfolioRepository.findByJobCandidateId(jobCandidateId.intValue()).stream()
                .findFirst()
                .map(Portfolio::getPortfolioFilePath)
                .orElse(null);
    }

    public Optional<PortfolioSubmissionDateResponse> getSubmissionDate(Long jobCandidateId) {
        return portfolioRepository.findByJobCandidateId(jobCandidateId.intValue()).stream()
                .findFirst()
                .map(p -> new PortfolioSubmissionDateResponse(p.getPortfolioSubmissionDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime()));
    }

    public Optional<Portfolio> getPortfolioByJobCandidateId(Long jobCandidateId) {
        return portfolioRepository.findByJobCandidateId(jobCandidateId.intValue()).stream()
                .findFirst();
    }
}

package com.zoop.backend.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.Company;
import com.zoop.backend.domain.entity.CompanyAdmin;
import com.zoop.backend.domain.entity.GithubSearchResult;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.domain.entity.Post;
import com.zoop.backend.repository.AiAnalysisResultRepository;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.CompanyAdminRepository;
import com.zoop.backend.repository.CompanyRepository;
import com.zoop.backend.repository.GithubSearchResultRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PostRepository;

/** Seeds a fresh local Oracle database with an idempotent, local-only demo workspace. */
@Component
@ConditionalOnProperty(name = "zoop.demo.seed", havingValue = "true")
public class LocalDemoDataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(LocalDemoDataSeeder.class);
    private static final String BUSINESS_NUMBER = "HK-DEMO-2026-0124";
    private static final String COMPANY_LOGIN = "minchan.admin";
    private static final String CANDIDATE_LOGIN = "minchan-kim";

    private final CompanyRepository companyRepository;
    private final CompanyAdminRepository companyAdminRepository;
    private final CandidateRepository candidateRepository;
    private final PostRepository postRepository;
    private final JobCandProgressRepository progressRepository;
    private final GithubSearchResultRepository githubSearchResultRepository;
    private final AiAnalysisResultRepository analysisResultRepository;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;

    public LocalDemoDataSeeder(
            CompanyRepository companyRepository,
            CompanyAdminRepository companyAdminRepository,
            CandidateRepository candidateRepository,
            PostRepository postRepository,
            JobCandProgressRepository progressRepository,
            GithubSearchResultRepository githubSearchResultRepository,
            AiAnalysisResultRepository analysisResultRepository,
            PasswordEncoder passwordEncoder,
            @Value("${ZOOP_DEMO_PASSWORD:ZoopDemo2026!}") String demoPassword) {
        this.companyRepository = companyRepository;
        this.companyAdminRepository = companyAdminRepository;
        this.candidateRepository = candidateRepository;
        this.postRepository = postRepository;
        this.progressRepository = progressRepository;
        this.githubSearchResultRepository = githubSearchResultRepository;
        this.analysisResultRepository = analysisResultRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Company company = companyRepository.findByBusinessNumber(BUSINESS_NUMBER)
                .orElseGet(this::createCompany);
        CompanyAdmin admin = companyAdminRepository.findByCompanyAdminLogin(COMPANY_LOGIN)
                .orElseGet(() -> createCompanyAdmin(company));

        Map<String, Candidate> candidates = seedCandidates();
        Map<String, Post> posts = seedPosts(company, admin);
        seedCandidatePipeline(candidates, posts);

        log.info("Local demo data is ready for {}: {} candidates, {} job postings.",
                admin.getEmail(), candidates.size(), posts.size());
    }

    private Company createCompany() {
        Company company = new Company();
        company.setBusinessNumber(BUSINESS_NUMBER);
        company.setCompanyName("Minchan Labs");
        company.setCompanyAddress("Central, Hong Kong");
        company.setCeoName("Minchan Kim");
        return companyRepository.save(company);
    }

    private CompanyAdmin createCompanyAdmin(Company company) {
        CompanyAdmin admin = new CompanyAdmin();
        admin.setCompany(company);
        admin.setLoginId(COMPANY_LOGIN);
        admin.setName("Minchan Kim");
        admin.setEmail("minchan0124@gmail.com");
        admin.setPassword(passwordEncoder.encode(demoPassword));
        return companyAdminRepository.save(admin);
    }

    private Map<String, Candidate> seedCandidates() {
        List<CandidateSeed> seeds = List.of(
                new CandidateSeed(CANDIDATE_LOGIN, "minchan.candidate@zoop.demo", "Minchan Kim", "Hong Kong", "Frontend Engineer", "Senior", "5 years"),
                new CandidateSeed("avery-chen-demo", "avery.chen@zoop.demo", "Avery Chen", "Hong Kong", "Frontend Engineer", "Mid-level", "4 years"),
                new CandidateSeed("jordan-patel-demo", "jordan.patel@zoop.demo", "Jordan Patel", "Singapore", "Full-stack Engineer", "Senior", "6 years"),
                new CandidateSeed("maya-lee-demo", "maya.lee@zoop.demo", "Maya Lee", "Seoul", "Product Designer", "Mid-level", "4 years"),
                new CandidateSeed("daniel-wong-demo", "daniel.wong@zoop.demo", "Daniel Wong", "Hong Kong", "Backend Engineer", "Senior", "7 years"),
                new CandidateSeed("sofia-martin-demo", "sofia.martin@zoop.demo", "Sofia Martin", "Remote", "Product Manager", "Mid-level", "5 years"),
                new CandidateSeed("ethan-park-demo", "ethan.park@zoop.demo", "Ethan Park", "Tokyo", "Machine Learning Engineer", "Mid-level", "3 years"));

        return seeds.stream().map(seed -> candidateRepository.findByGithubLogin(seed.githubLogin())
                        .orElseGet(() -> candidateRepository.save(Candidate.builder()
                                .githubLogin(seed.githubLogin())
                                .candidateEmail(seed.email())
                                .candidateName(seed.name())
                                .candidatePassword(passwordEncoder.encode(demoPassword))
                                .candidatePhoneNumber("+852 5555 0124")
                                .candidateRegistrationDate(LocalDateTime.now().minusDays(45))
                                .candidateCreatedAt(LocalDateTime.now().minusDays(45))
                                .candidateUpdatedAt(LocalDateTime.now().minusDays(2))
                                .preferredRegion(seed.region())
                                .preferredJob(seed.role())
                                .preferredSalary("HK$480,000 – HK$720,000")
                                .preferredCompanySize("Growth-stage")
                                .careerType(seed.careerType())
                                .totalCareerPeriod(seed.careerPeriod())
                                .build())))
                .collect(Collectors.toMap(Candidate::getGithubLogin, Function.identity()));
    }

    private Map<String, Post> seedPosts(Company company, CompanyAdmin admin) {
        List<PostSeed> seeds = List.of(
                new PostSeed("Frontend Engineer — Trust Platform", "Hong Kong / Hybrid", "TypeScript, React, Next.js", "HK$540,000", "HK$720,000", 2, "ACTIVE"),
                new PostSeed("Backend Engineer — Data Systems", "Hong Kong / Hybrid", "Java, Spring Boot, Oracle, AWS", "HK$600,000", "HK$820,000", 1, "ACTIVE"),
                new PostSeed("Product Designer — Candidate Experience", "Remote / Hong Kong", "Figma, Design Systems, Research", "HK$480,000", "HK$650,000", 1, "ACTIVE"),
                new PostSeed("Product Manager — AI Hiring", "Hong Kong / Hybrid", "Product Strategy, AI, B2B SaaS", "HK$620,000", "HK$850,000", 1, "ACTIVE"),
                new PostSeed("Machine Learning Engineer", "Remote / APAC", "Python, LLMs, Evaluation, MLOps", "HK$650,000", "HK$900,000", 1, "DRAFT"));

        Map<String, Post> existing = postRepository.findByCompanyId(company.getCompanyId()).stream()
                .collect(Collectors.toMap(Post::getPostTitle, Function.identity(), (first, ignored) -> first));
        for (PostSeed seed : seeds) {
            existing.computeIfAbsent(seed.title(), ignored -> postRepository.save(Post.builder()
                    .companyId(company.getCompanyId())
                    .companyAdminId(admin.getCompanyAdminId())
                    .postTitle(seed.title())
                    .postDescription("Join Minchan Labs to build transparent, evidence-led hiring experiences for growing teams across APAC.")
                    .postProgrammingLanguage(seed.skills())
                    .postLocation(seed.location())
                    .postHeadcount(seed.headcount())
                    .postSalaryStart(seed.salaryStart())
                    .postSalaryEnd(seed.salaryEnd())
                    .postPostedDate(LocalDate.now().minusDays(12))
                    .postExpiryDate(LocalDate.now().plusDays(28))
                    .postStatus(seed.status())
                    .postIdealCandidate("A thoughtful collaborator who ships high-quality work, communicates clearly, and uses evidence to make decisions.")
                    .build()));
        }
        return existing;
    }

    private void seedCandidatePipeline(Map<String, Candidate> candidates, Map<String, Post> posts) {
        Post frontend = posts.get("Frontend Engineer — Trust Platform");
        if (frontend == null) {
            return;
        }
        List<PipelineSeed> seeds = List.of(
                new PipelineSeed(CANDIDATE_LOGIN, "3n", 94, "JavaScript, TypeScript, React"),
                new PipelineSeed("avery-chen-demo", "2y", 89, "TypeScript, React, GraphQL"),
                new PipelineSeed("jordan-patel-demo", "2y", 87, "TypeScript, Node.js, PostgreSQL"),
                new PipelineSeed("daniel-wong-demo", "2n", 84, "Java, Spring Boot, AWS"),
                new PipelineSeed("ethan-park-demo", "1n", 81, "Python, PyTorch, MLOps"));

        for (PipelineSeed seed : seeds) {
            Candidate candidate = candidates.get(seed.githubLogin());
            if (candidate == null) {
                continue;
            }
            JobCandProgress progress = progressRepository.findByPost_PostIdAndGithubLogin(frontend.getPostId(), seed.githubLogin())
                    .orElseGet(() -> progressRepository.save(JobCandProgress.builder()
                            .post(frontend)
                            .candidate(candidate)
                            .githubLogin(seed.githubLogin())
                            .jobCandCurrStage(seed.stage())
                            .jobCandPortfolioSubDate(LocalDateTime.now().minusDays(7))
                            .jobCandCreatedAt(LocalDateTime.now().minusDays(10))
                            .jobCandUpdatedAt(LocalDateTime.now().minusDays(1))
                            .build()));
            seedGithubAnalysis(frontend, candidate, progress, seed);
        }
    }

    private void seedGithubAnalysis(Post post, Candidate candidate, JobCandProgress progress, PipelineSeed seed) {
        GithubSearchResult searchResult = githubSearchResultRepository
                .findByPostIdAndGithubLogin(post.getPostId(), seed.githubLogin())
                .orElseGet(() -> githubSearchResultRepository.save(GithubSearchResult.builder()
                        .postId(post.getPostId())
                        .githubLogin(seed.githubLogin())
                        .githubProfileUrl("https://github.com/" + seed.githubLogin())
                        .candidateEmail(candidate.getCandidateEmail())
                        .analysisScore((double) seed.score())
                        .githubSearchDate(LocalDateTime.now().minusDays(1))
                        .githubCreatedAt(LocalDateTime.now().minusDays(1))
                        .build()));

        if (analysisResultRepository.findByGithubSearchResultId(searchResult.getGithubSearchResultId()).isEmpty()) {
            AiAnalysisResult analysis = analysisResultRepository.save(AiAnalysisResult.builder()
                    .analysisType("github")
                    .githubSearchResultId(searchResult.getGithubSearchResultId())
                    .jobCandidateId(progress.getJobCandidateId())
                    .analysisScore((double) seed.score())
                    .analysisDate(LocalDateTime.now().minusDays(1))
                    .analysisCreatedAt(LocalDateTime.now().minusDays(1))
                    .analysisData("{\"source\":\"local-demo-seed\",\"summary\":\"Evidence-led demo profile with strong " + seed.skills() + " experience.\",\"strengths\":[\"Clear delivery history\",\"Collaboration\",\"Technical depth\"],\"reviewNote\":\"Use interview discussion to validate ownership and impact.\"}")
                    .build());
            searchResult.setAiGithubAnalysisId(analysis.getAnalysisId());
            githubSearchResultRepository.save(searchResult);
        }
    }

    private record CandidateSeed(String githubLogin, String email, String name, String region, String role,
                                 String careerType, String careerPeriod) { }

    private record PostSeed(String title, String location, String skills, String salaryStart, String salaryEnd,
                            int headcount, String status) { }

    private record PipelineSeed(String githubLogin, String stage, int score, String skills) { }
}

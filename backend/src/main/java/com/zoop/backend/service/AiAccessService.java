package com.zoop.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.zoop.backend.domain.entity.AiAnalysisResult;
import com.zoop.backend.domain.entity.JobCandProgress;
import com.zoop.backend.repository.CompanyAdminRepository;
import com.zoop.backend.repository.GithubSearchResultRepository;
import com.zoop.backend.repository.JobCandProgressRepository;
import com.zoop.backend.repository.PostRepository;

import lombok.RequiredArgsConstructor;

/**
 * AI 결과는 민감한 후보자 자료를 포함하므로, 로그인만으로 ID를 열거해
 * 조회할 수 없도록 후보자 본인 또는 해당 공고의 기업 관리자만 허용한다.
 */
@Service
@RequiredArgsConstructor
public class AiAccessService {

    private final JobCandProgressRepository jobCandProgressRepository;
    private final CompanyAdminRepository companyAdminRepository;
    private final PostRepository postRepository;
    private final GithubSearchResultRepository githubSearchResultRepository;

    public boolean canAccessJobCandidate(Long jobCandidateId) {
        if (jobCandidateId == null || !isAuthenticated()) {
            return false;
        }
        if (isInternalWorker()) {
            return true;
        }
        return jobCandProgressRepository.findByJobCandidateId(jobCandidateId)
                .map(this::canAccessProgress)
                .orElse(false);
    }

    public boolean canAccessAnalysis(AiAnalysisResult analysis) {
        if (analysis == null || !isAuthenticated()) {
            return false;
        }
        if (isInternalWorker()) {
            return true;
        }
        if (analysis.getJobCandidateId() != null && canAccessJobCandidate(analysis.getJobCandidateId())) {
            return true;
        }
        if (analysis.getGithubSearchResultId() == null) {
            return false;
        }
        return githubSearchResultRepository.findById(analysis.getGithubSearchResultId())
                .map(result -> canAccessPost(result.getPostId()))
                .orElse(false);
    }

    public boolean canAccessPost(Long postId) {
        if (postId == null || !isAuthenticated()) {
            return false;
        }
        if (isInternalWorker()) {
            return true;
        }
        String subject = subject();
        return postRepository.findById(postId)
                .map(post -> post.getCompanyAdminId() != null && companyAdminRepository.findById(post.getCompanyAdminId())
                        .map(admin -> admin.getLoginId().equals(subject))
                        .orElse(false))
                .orElse(false);
    }

    public boolean isInternalWorker() {
        return "zoop-ai-worker".equals(subject());
    }

    public boolean isCompanyAdmin() {
        if (!isAuthenticated() || isInternalWorker()) {
            return false;
        }
        return companyAdminRepository.findByCompanyAdminLogin(subject()).isPresent();
    }

    private boolean canAccessProgress(JobCandProgress progress) {
        String subject = subject();
        if (progress.getPost() != null && progress.getPost().getCompanyAdminId() != null && companyAdminRepository.findById(progress.getPost().getCompanyAdminId())
                .map(admin -> admin.getLoginId().equals(subject))
                .orElse(false)) {
            return true;
        }
        if (progress.getCandidate() != null && subject.equals(progress.getCandidate().getGithubLogin())) {
            return true;
        }
        return subject.equals(progress.getGithubLogin());
    }

    private boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && subject() != null;
    }

    private String subject() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication == null ? null : authentication.getName();
    }
}

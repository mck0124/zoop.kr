package com.zoop.backend.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import com.zoop.backend.domain.dto.CandidatePreferencesDto;
import com.zoop.backend.domain.dto.finding.FindGithubLoginRequest;
import com.zoop.backend.domain.dto.finding.FindGithubLoginResponse;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.InvitationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private static final Logger logger = LoggerFactory.getLogger(CandidateService.class);

    // 비밀번호 암호화객체
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Autowired
    private final CandidateRepository candidateRepository;
    private final InvitationRepository invitationRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    public List<Candidate> findAll() {
        return candidateRepository.findAll();
    }

    public Optional<Candidate> findById(Long candidateId) {
        return candidateRepository.findById(candidateId);
    }

    @Transactional 
    public Candidate save(Candidate candidate) {
        try {
            // GitHub 로그인 중복 체크
            if (candidate.getGithubLogin() != null) {
                Optional<Candidate> existingCandidate = candidateRepository.findByGithubLogin(candidate.getGithubLogin());
                if (existingCandidate.isPresent()) {
                    logger.warn("이미 존재하는 GitHub 로그인: {}", candidate.getGithubLogin());
                    throw new RuntimeException("이미 가입된 GitHub 계정입니다: " + candidate.getGithubLogin());
                }
            }
            
            // 이메일 중복 체크
            if (candidate.getCandidateEmail() != null) {
                Optional<Candidate> existingEmail = candidateRepository.findByCandidateEmail(candidate.getCandidateEmail());
                if (existingEmail.isPresent()) {
                    logger.warn("이미 존재하는 이메일: {}", candidate.getCandidateEmail());
                    throw new RuntimeException("이미 가입된 이메일 주소입니다: " + candidate.getCandidateEmail());
                }
            }
            
            // 비밀번호 암호화
            String encrypted = passwordEncoder.encode(candidate.getCandidatePassword());
            
            candidate.setCandidatePassword(encrypted);
            
            // 후보자 저장
            Candidate savedCandidate = candidateRepository.save(candidate);
            logger.info("저장된 후보자 ID: {}", savedCandidate.getCandidateId());
            
            // invitations 테이블 업데이트는 별도 트랜잭션에서 처리
            updateInvitationAsync(savedCandidate.getGithubLogin(), savedCandidate.getCandidateId());
            
            return savedCandidate;
        } catch (Exception e) {
            logger.error("회원 저장 중 오류 발생: {}", e.getMessage(), e);
            throw e;
        }
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateInvitationAsync(String githubLogin, Long candidateId) {
        try {
            invitationRepository.updateCandidateIdByGithubLogin(githubLogin, candidateId);
            logger.info("✅ invitations 테이블 업데이트 성공: githubLogin={}, candidateId={}", githubLogin, candidateId);
        } catch (Exception invitationError) {
            logger.warn("⚠️ invitations 테이블 업데이트 실패 (회원가입은 성공): {}", invitationError.getMessage());
            // invitations 업데이트 실패해도 회원가입은 성공으로 처리
        }
    }

    @Transactional
    public Candidate updatePreferences(CandidatePreferencesDto preferencesDto) {
        try {
            Candidate candidate = candidateRepository.findById(preferencesDto.getCandidateId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + preferencesDto.getCandidateId()));
            
            // 설정 정보 업데이트
            if (preferencesDto.getPreferredJob() != null) {
                candidate.setPreferredJob(preferencesDto.getPreferredJob());
            }
            if (preferencesDto.getPreferredRegion() != null) {
                candidate.setPreferredRegion(preferencesDto.getPreferredRegion());
            }
            if (preferencesDto.getPreferredSalary() != null) {
                candidate.setPreferredSalary(preferencesDto.getPreferredSalary());
            }
            if (preferencesDto.getPreferredCompanySize() != null) {
                candidate.setPreferredCompanySize(preferencesDto.getPreferredCompanySize());
            }
            if (preferencesDto.getPreferredCommuteTime() != null) {
                candidate.setPreferredCommuteTime(preferencesDto.getPreferredCommuteTime());
            }
            if (preferencesDto.getPreferredBenefit() != null) {
                candidate.setPreferredBenefit(preferencesDto.getPreferredBenefit());
            }
            
            // 업데이트 시간 설정
            candidate.setCandidateUpdatedAt(java.time.LocalDateTime.now());
            
            Candidate updatedCandidate = candidateRepository.save(candidate);
            logger.info("사용자 설정 업데이트 성공, 회원 ID: {}", updatedCandidate.getCandidateId());
            
            return updatedCandidate;
        } catch (Exception e) {
            logger.error("사용자 설정 업데이트 중 오류 발생: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Candidate updateProfile(Long candidateId, String candidateName, String candidateEmail) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (candidateEmail == null || !candidateEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("유효한 이메일을 입력해 주세요.");
        }
        Optional<Candidate> emailOwner = candidateRepository.findByCandidateEmail(candidateEmail);
        if (emailOwner.isPresent() && !candidateId.equals(emailOwner.get().getCandidateId())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        candidate.setCandidateName(candidateName == null ? "" : candidateName.trim());
        candidate.setCandidateEmail(candidateEmail.trim());
        candidate.setCandidateUpdatedAt(java.time.LocalDateTime.now());
        return candidateRepository.save(candidate);
    }

    @Transactional
    public void changePassword(Long candidateId, String currentPassword, String newPassword) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, candidate.getCandidatePassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        candidate.setCandidatePassword(passwordEncoder.encode(newPassword));
        candidate.setCandidateUpdatedAt(java.time.LocalDateTime.now());
        candidateRepository.save(candidate);
    }

    @Transactional(readOnly = true)
    public CandidatePreferencesDto getPreferences(Long candidateId) {
        try {
            Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + candidateId));
            
            return CandidatePreferencesDto.builder()
                .candidateId(candidate.getCandidateId())
                .preferredJob(candidate.getPreferredJob())
                .preferredRegion(candidate.getPreferredRegion())
                .preferredSalary(candidate.getPreferredSalary())
                .preferredCompanySize(candidate.getPreferredCompanySize())
                .preferredCommuteTime(candidate.getPreferredCommuteTime())
                .preferredBenefit(candidate.getPreferredBenefit())
                .build();
        } catch (Exception e) {
            logger.error("사용자 설정 조회 중 오류 발생: {}", e.getMessage(), e);
            throw e;
        }
    }

    // 회원가입시 아이디 중복확인을 위한 메서드
    public boolean isDuplicateGithubLogin(String githubLogin) {
        return candidateRepository.existsByGithubLogin(githubLogin);
    }

    /** 합친 이후 */
    public FindGithubLoginResponse findGithubLogin(FindGithubLoginRequest request) {
        try {
            logger.info("GitHub 로그인 찾기 요청: name={}, email={}", request.getName(), request.getEmail());
            
            Candidate candidate = candidateRepository
                    .findByCandidateNameAndCandidateEmail(request.getName(), request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

            logger.info("GitHub 로그인 찾기 성공: githubLogin={}", candidate.getGithubLogin());
            return new FindGithubLoginResponse(candidate.getGithubLogin());
        } catch (IllegalArgumentException e) {
            logger.warn("GitHub 로그인 찾기 실패: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("GitHub 로그인 찾기 중 예상치 못한 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("GitHub 로그인 찾기 중 오류가 발생했습니다.", e);
        }
    }
}

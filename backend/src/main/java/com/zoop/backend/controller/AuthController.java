package com.zoop.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping; // RequestBody 임포트
import org.springframework.web.bind.annotation.RestController;

import com.zoop.backend.domain.dto.LoginRequest;
import com.zoop.backend.domain.dto.SocialLoginCallbackRequest;
import com.zoop.backend.domain.entity.Candidate;
import com.zoop.backend.domain.entity.CompanyAdmin; // Candidate 엔티티 임포트
import com.zoop.backend.repository.CandidateRepository;
import com.zoop.backend.repository.CompanyAdminRepository; // CandidateRepository 임포트
import com.zoop.backend.service.SocialAuthService;
import com.zoop.backend.util.JwtUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name="AuthController", description="사용자 인증 관련 API(로그인 및 소셜 로그인)")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class); 
    private final CompanyAdminRepository adminRepo;
    private final CandidateRepository candidateRepo; // CandidateRepository 주입
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final SocialAuthService socialAuthService;

    // 생성자 주입
    public AuthController(CompanyAdminRepository adminRepo, CandidateRepository candidateRepo, 
        PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
        SocialAuthService socialAuthService) {
        this.adminRepo = adminRepo;
        this.candidateRepo = candidateRepo; // CandidateRepository 초기화
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.socialAuthService = socialAuthService;
    }
    // == 일반 로그인 API ==
    @Operation(summary="사용자 로그인", description="아이디와 비밀번호, 사용자 유형을 사용하여 로그인하고 JWT 토큰을 발급받습니다.")
    @ApiResponses(value= {
        @ApiResponse(responseCode="200", description="로그인 성공 및 JWT 토큰 발급",
            content=@Content(schema=@Schema(implementation=LoginResponse.class))),
        @ApiResponse(responseCode ="404", description="존재하지 않는 아이디"),
        @ApiResponse(responseCode="401", description="비밀번호 불일치"),
        @ApiResponse(responseCode="400", description="잘못된 사용자 유형") // 잘못된 userType에 대한 응답 추가
    })

    @PostMapping("/login")
    public ResponseEntity<?> login(
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "로그인을 위한 아이디, 비밀번호, 사용자 유형 (candidate 또는 company)",
            required=true,
            content=@Content(schema=@Schema(implementation=LoginRequest.class))
        )
        @org.springframework.web.bind.annotation.RequestBody LoginRequest request) {

        String userType = request.getUserType();
        String loginId = request.getLoginId();
        String password = request.getPassword();

        // 1. userType에 따라 사용자 조회
        if ("company".equals(userType)) {
            // 기업회원 로그인 처리
            CompanyAdmin admin = adminRepo.findByCompanyAdminLogin(loginId).orElse(null);

            if (admin == null) {
                // 로그 추가 (디버깅용)
                System.out.println("🔐 기업회원 - 아이디 찾기 실패: " + loginId);
                return ResponseEntity.status(404).body("존재하지 않는 아이디입니다.");
            }

            // 2. 비밀번호 검증
            boolean match = passwordEncoder.matches(password, admin.getPassword());


            if (!match) {
                return ResponseEntity.status(401).body("비밀번호가 일치하지 않습니다.");
            }

            // 3. JWT 발급 및 응답 반환
            // 토큰 페이로드에 loginId 사용 (기존 로직 유지)
            String jwtToken = jwtUtil.generateToken(admin.getLoginId());

            return ResponseEntity.ok(Map.of(
                    "token", jwtToken,
                    "userId", admin.getCompanyAdminId(),
                    "userType", "company",
                    "loginId", admin.getLoginId()
            ));

        } else if ("candidate".equals(userType)) {
            // 개인회원 로그인 처리
            // h님께서 github_login만 사용하겠다고 하셨으므로 githubLogin으로 조회
            Candidate candidate = candidateRepo.findByGithubLogin(loginId).orElse(null);

            // 만약 이메일로도 찾고 싶다면 아래 주석 해제 후 로직 추가
            // if (candidate == null && loginId.contains("@")) {
            //    candidate = candidateRepo.findByCandidateEmail(loginId).orElse(null);
            // }


            if (candidate == null) {
                // 로그 추가 (디버깅용)
                System.out.println("🔐 개인회원 - 아이디(githubLogin) 찾기 실패: " + loginId);
                return ResponseEntity.status(404).body("존재하지 않는 아이디입니다.");
            }

            // 2. 비밀번호 검증
            boolean match = passwordEncoder.matches(password, candidate.getCandidatePassword());


            if (!match) {
                return ResponseEntity.status(401).body("비밀번호가 일치하지 않습니다.");
            }

            // 3. JWT 발급 및 응답 반환
            // 토큰 페이로드에 githubLogin 사용 (기존 기업회원 로직과 유사하게 loginId 사용)
            String jwtToken = jwtUtil.generateToken(candidate.getGithubLogin());

            return ResponseEntity.ok(Map.of(
                    "token", jwtToken,
                    "userId", candidate.getCandidateId(), // 개인회원 ID 사용
                    "userType", "candidate",
                    "loginId", candidate.getGithubLogin() // 개인회원의 경우 githubLogin 반환
            ));

        } else {
            // 잘못된 userType이 요청으로 온 경우
            System.out.println("🔐 유효하지 않은 userType 요청: " + userType);
            return ResponseEntity.status(400).body("유효하지 않은 사용자 유형입니다.");
        }
    }

    // ✅ 소셜 로그인 콜백 요청을 처리하는 새로운 엔드포인트 추가
    // 프론트엔드에서 http://localhost:8081/api/auth/social/google/callback 으로 POST 요청을 보낼 때 이 메소드가 실행됩니다.
    // Swagger 문서에 설명된 SocialLoginCallbackRequest DTO를 요청 본문으로 받습니다.
    @Operation(summary="소셜 로그인 콜백 처리", description="프론트엔드로부터 인가 코드를 받아 소셜 로그인 처리 후 자체 JWT 토큰 발급")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "소셜 로그인 성공 및 자체 JWT 토큰 발급",
             content=@Content(schema=@Schema(implementation=LoginResponse.class))), // 응답 형태는 일반 로그인과 유사
        @ApiResponse(responseCode = "400", description = "잘못된 요청 또는 처리 오류"), // provider 불일치, 인가 코드 누락 등
        @ApiResponse(responseCode = "401", description = "소셜 서비스 인증/인가 실패"), // 소셜 서비스에서 토큰 발급/정보 가져오기 실패
        @ApiResponse(responseCode = "500", description = "서버 내부 오류") // 예상치 못한 서버 오류
    })
    // {provider} PathVariable을 사용하여 google, naver, github 등을 구분합니다.
    @PostMapping("/social/{provider}/callback")
    public ResponseEntity<?> handleSocialLoginCallback(
        @Parameter(description = "소셜 로그인 제공자(google 등", required = true)
        @PathVariable String provider, // URL 경로에서 provider 추출 (예: "google")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
             description = "소셜 서비스로부터 받은 인가 코드 및 필요시 상태 값",
             required = true,
             content = @Content(schema = @Schema(implementation = SocialLoginCallbackRequest.class))
        )
        @RequestBody SocialLoginCallbackRequest request) { // 프론트엔드에서 보낸 요청 본문을 SocialLoginCallbackRequest 객체로 받음

        // 요청 수신 로그
        logger.info("소셜 로그인 콜백 요청 수신: provider={}, code={}", provider, request.getCode() != null ? request.getCode().substring(0, Math.min(request.getCode().length(), 10)) + "..." : "null"); // 코드 전체 로깅 주의
        if (request.getState() != null) logger.info("소셜 로그인 콜백 요청 수신: state={}", request.getState());


        // 필수 파라미터 (인가 코드) 누락 확인
        if (request.getCode() == null || request.getCode().isEmpty()) {
            logger.warn("소셜 로그인 콜백 요청에 인가 코드(code)가 누락되었습니다.");
            return ResponseEntity.status(400).body("인가 코드가 누락되었습니다.");
        }

        try {
            // ✅ SocialAuthService를 호출하여 실제 소셜 로그인 처리 위임
            // SocialAuthService의 handleSocialLogin 메소드가 Google API 통신, 사용자 조회/저장, JWT 발급 등 모든 비즈니스 로직을 수행합니다.
            // 프론트엔드로부터 받은 provider 이름, code, state 등을 서비스 메소드로 전달합니다.
            Map<String, Object> authResult = socialAuthService.handleSocialLogin(
                    provider, request.getCode(), request.getState(), request.getPkceCodeVerifier());

            logger.info("{} 소셜 로그인 처리 성공. 자체 JWT 발급 완료.", provider);

            // SocialAuthService에서 반환된 결과 (JWT 토큰, userType, userId 등 포함)를 프론트엔드로 응답
            return ResponseEntity.ok(authResult);

        } catch (IllegalArgumentException e) {
            // SocialAuthService에서 발생시킨 예외 (예: 지원하지 않는 provider, state 불일치, 유효하지 않은 요청)
            logger.error("소셜 로그인 요청 오류 - {}", e.getMessage(), e);
            return ResponseEntity.status(400).body(e.getMessage()); // 예외 메시지를 응답 본문에 포함하여 프론트엔드에 전달
        } catch (RuntimeException e) {
             // SocialAuthService 내에서 발생한 소셜 서비스 통신 오류, 사용자 정보 누락, DB 오류 등
             logger.error("소셜 로그인 처리 중 서비스 오류 - {}", e.getMessage(), e);
             // 클라이언트에 상세 오류를 노출하는 것은 보안상 위험하므로 일반적인 메시지 반환
             return ResponseEntity.status(500).body("소셜 로그인 처리 중 서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } catch (Exception e) {
            // 예상치 못한 다른 오류 (NullPointerException 등)
            logger.error("소셜 로그인 처리 중 예상치 못한 오류 발생 - {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("소셜 로그인 처리 중 알 수 없는 오류가 발생했습니다.");
        }
    }



    // Swagger 문서화를 위한 더미 클래스 (실제 응답 구조와 일치하도록 조정 필요)
    private static class LoginResponse {
        public String token;
        public Long userId; // 또는 적절한 타입
        public String userType;
        public String loginId;
    }
}

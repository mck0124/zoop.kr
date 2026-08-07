package com.zoop.backend.service;

import java.time.LocalDateTime; // Candidate 엔티티 임포트
import java.util.HashMap; // CandidateRepository 임포트
import java.util.Map; // 자체 JWT 유틸리티 임포트
import java.util.Optional; // 설정 값 주입을 위한 Value 어노테이션 임포트
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value; // HTTP 헤더 관련 클래스 임포트
import org.springframework.http.HttpHeaders; // 미디어 타입 관련 클래스 임포트
import org.springframework.http.MediaType; // 서비스 컴포넌트로 선언하기 위한 Service 어노테이션 임포트
import org.springframework.stereotype.Service; // 트랜잭션 관리를 위한 Transactional 어노테이션 임포트
import org.springframework.transaction.annotation.Transactional; // 요청 본문 구성
import org.springframework.web.reactive.function.BodyInserters; // WebClient 클래스
import org.springframework.web.reactive.function.client.WebClient; // WebClient HTTP 응답 예외
import org.springframework.web.reactive.function.client.WebClientResponseException; // JSON 노드 표현
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.databind.JsonNode; // JSON 파서
import com.fasterxml.jackson.databind.ObjectMapper; // 시간 관리를 위해 추가 (Java 8+ 시간 API)
import com.zoop.backend.domain.entity.Candidate; // Map 구현체 임포트
import com.zoop.backend.repository.CandidateRepository; // Map 인터페이스 임포트
import com.zoop.backend.util.JwtUtil; // Optional 클래스 임포트 (null 가능성 있는 값 처리)


@Service // 이 클래스를 Spring 서비스 빈으로 등록합니다.
public class SocialAuthService {

    private final CandidateRepository candidateRepository; // Candidate 데이터 접근을 위한 Repository 주입
    private final JwtUtil jwtUtil; // 자체 JWT 발급 및 검증을 위한 유틸리티 주입
    private final WebClient webClient; // 외부 HTTP 통신을 위한 WebClient 주입
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper(); // JSON 데이터 파싱을 위한 ObjectMapper 인스턴스

    // ✅ application.yml 에서 Google 소셜 로그인 설정 값 주입
    // @Value 어노테이션을 사용하여 yml 파일의 social.google 하위 속성 값을 필드에 주입합니다.
    @Value("${social.google.client-id}") private String googleClientId;
    @Value("${social.google.client-secret}") private String googleClientSecret;
    @Value("${social.google.redirect-uri}") private String googleRedirectUri; // 백엔드 yml에 등록된 프론트엔드 콜백 URI
    @Value("${social.google.token-uri}") private String googleTokenUri; // Google 토큰 발급 엔드포인트
    @Value("${social.google.user-info-uri}") private String googleUserInfoUri; // Google 사용자 정보 엔드포인트
    // @Value("${social.google.scope}") private String googleScope; // 필요에 따라 사용


    // 생성자 주입: 필요한 의존성(Repository, JwtUtil, WebClient Builder)을 주입받습니다.
    // WebClient.Builder는 Spring Boot가 자동 구성해주는 빈입니다.
    public SocialAuthService(CandidateRepository candidateRepository, JwtUtil jwtUtil, WebClient.Builder webClientBuilder, PasswordEncoder passwordEncoder) {
        this.candidateRepository = candidateRepository;
        this.jwtUtil = jwtUtil;
        this.webClient = webClientBuilder.build(); // WebClient Builder로 WebClient 인스턴스 생성
        this.passwordEncoder = passwordEncoder;
    }

    // ✅ 소셜 로그인 요청 처리의 메인 메소드 (Google 전용)
    // AuthController로부터 provider 이름 ("google"), 인가 코드, 상태 값 등을 전달받아 처리합니다.
    @Transactional // 데이터베이스 변경 작업이 포함되므로 트랜잭션 관리 어노테이션 추가
    // provider 이름은 받지만, 이 서비스는 Google만 처리하도록 구현합니다.
    public Map<String, Object> handleSocialLogin(String provider, String code, String state, String pkceVerifier) {
        // Google provider만 처리하도록 명시적으로 확인
        if (!"google".equalsIgnoreCase(provider)) {
            throw new IllegalArgumentException("이 서비스는 Google 소셜 로그인만 지원합니다. 요청된 Provider: " + provider);
        }

        // 1. Google 설정 값을 가져옵니다. (필드에 주입된 값 사용)
        String clientId = googleClientId;
        String clientSecret = googleClientSecret;
        String redirectUri = googleRedirectUri; // application.yml에서 주입받은 Google 리다이렉트 URI 사용
        String tokenUri = googleTokenUri;
        String userInfoUri = googleUserInfoUri;

        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("OAuth state가 누락되었습니다.");
        }
        if (pkceVerifier == null || pkceVerifier.isBlank()) {
            throw new IllegalArgumentException("PKCE 검증 값이 누락되었습니다.");
        }


        try {
            // 2. 인가 코드(Authorization Code)를 사용하여 Access Token 교환 요청
            // getAccessToken 메소드를 호출하여 Google의 토큰 발급 API와 통신합니다.
            String accessToken = getAccessToken(provider, code, clientId, clientSecret, redirectUri, tokenUri, pkceVerifier);
             // Access Token 발급 실패 시 예외는 getAccessToken 내부에서 처리됩니다.
             if (accessToken == null || accessToken.isEmpty()) {
                 // getAccessToken 내부에서 이미 오류 로깅 및 예외 발생 가능
                 // 만약 null이 반환될 가능성이 있다면 여기서도 예외를 던져야 합니다.
                 throw new RuntimeException(provider + " Access Token 발급 실패: 응답에서 토큰 추출 불가");
             }


            // 3. 발급받은 Access Token을 사용하여 사용자 정보 조회 요청
            // getUserInfo 메소드를 호출하여 Google의 사용자 정보 API와 통신합니다.
            Map<String, Object> userInfo = getUserInfo(provider, accessToken, userInfoUri);
             // 사용자 정보 조회 실패 시 예외는 getUserInfo 내부에서 처리됩니다.
             if (userInfo == null || userInfo.isEmpty()) {
                 // getUserInfo 내부에서 이미 오류 로깅 및 예외 발생 가능
                 throw new RuntimeException(provider + " 사용자 정보 조회 실패: 응답 파싱 오류 또는 정보 누락");
             }

            // 4. 조회된 사용자 정보로 자체 회원 처리 (로그인 또는 회원가입)
            // processSocialUser 메소드를 호출하여 DB에서 사용자를 찾거나 새로 생성합니다.
            // Google 소셜 로그인 사용자는 개인회원(Candidate)으로 처리합니다.
            Candidate candidate = processSocialUser(provider, userInfo);

            // 5. 자체 JWT 토큰 발급
            // processSocialUser 메소드에서 반환된 Candidate 엔티티의 ID와 userType("candidate")을 사용하여 JWT 토큰 생성
            // JwtUtil의 generateToken(String userId, String userType) 메소드 사용
            String jwtToken = jwtUtil.generateToken(String.valueOf(candidate.getCandidateId()), "candidate"); // Candidate ID는 Long일 수 있으므로 String으로 변환하여 전달

            // 6. 프론트엔드로 전달할 응답 데이터 Map 생성
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwtToken); // 발급된 자체 JWT 토큰
            response.put("userId", candidate.getCandidateId()); // 사용자의 고유 ID (DB PK)
            response.put("userType", "candidate"); // 사용자의 유형 (개인회원)
             // 소셜 로그인 사용자의 식별자 (프론트엔드 표시 또는 로깅용)
            response.put("loginId", getSocialLoginIdentifier(provider, userInfo)); // 예: "google_12345"


            // 최종 응답 Map 반환
            return response;

        } catch (WebClientResponseException e) {
            // WebClient 통신 중 발생한 HTTP 오류 (4xx, 5xx 상태 코드)
            System.err.println(provider + " API 통신 오류 - 상태 코드: " + e.getStatusCode() + ", 응답 본문: " + e.getResponseBodyAsString());
             // 오류 상세 정보를 포함하여 RuntimeException 발생시켜 Controller에서 처리하도록 합니다.
             throw new RuntimeException(provider + " API 통신 오류: " + e.getStatusCode() + " - " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            // 기타 처리 중 발생한 오류 (JSON 파싱 오류, DB 오류, NullPointerException 등)
            System.err.println(provider + " 소셜 로그인 처리 중 오류 발생: " + e.getMessage());
            e.printStackTrace(); // 상세 스택 트레이스 출력 (디버깅용)
            throw new RuntimeException(provider + " 소셜 로그인 처리 중 예상치 못한 오류 발생: " + e.getMessage(), e); // 상위로 예외 전파
        }
    }

    // ✅ 인가 코드(Authorization Code)로 Access Token 교환 요청 메소드 (Google 전용)
    // Google의 토큰 발급 API (googleTokenUri)에 POST 요청을 보냅니다.
    private String getAccessToken(String provider, String code, String clientId, String clientSecret, String redirectUri, String tokenUri, String pkceVerifier) {
        // Google 토큰 요청 API 명세에 맞춰 요청 본문 구성 (application/x-www-form-urlencoded)
        WebClient.RequestHeadersSpec<?> requestSpec = webClient.post()
                .uri(tokenUri) // Google 토큰 발급 API 주소
                .contentType(MediaType.APPLICATION_FORM_URLENCODED) // 요청 본문 타입 설정
                .body(BodyInserters.fromFormData("grant_type", "authorization_code") // grant_type=authorization_code
                        .with("client_id", clientId) // Google Client ID
                        .with("client_secret", clientSecret) // Google Client Secret
                        .with("redirect_uri", redirectUri) // 리다이렉트 URI (인가 코드 요청 시 사용했던 것과 동일해야 함)
                        .with("code", code) // 받은 인가 코드
                        .with("code_verifier", pkceVerifier)
                );

        // API 호출 및 응답 본문(String) 받기
        // .retrieve()는 4xx, 5xx 응답 시 WebClientResponseException 발생시킵니다.
        String responseBody = requestSpec.retrieve()
                                        .bodyToMono(String.class) // 응답 본문을 String으로 받음
                                        .block(); // 비동기 결과를 블록킹하여 동기식으로 대기 (프로덕션에서는 비동기 권장)

        // 응답 본문이 null인 경우 오류 처리
        if (responseBody == null) {
             throw new RuntimeException(provider + " 토큰 요청 응답 본문이 null입니다.");
        }

        try {
             // 응답 본문 (JSON) 파싱하여 access_token 값 추출
            JsonNode jsonNode = objectMapper.readTree(responseBody);
             // Google 응답 JSON에는 "access_token" 필드가 포함됩니다.
             if (jsonNode.has("access_token") && !jsonNode.get("access_token").isNull()) {
                 return jsonNode.get("access_token").asText(); // access_token 값을 String으로 반환
             } else {
                 // 응답에 access_token 필드가 없거나 null인 경우 (토큰 발급 실패 등)
                 System.err.println(provider + " 토큰 응답 JSON에 access_token 필드가 없거나 null입니다: " + responseBody);
                 // 응답에 오류 메시지가 포함되어 있다면 오류 상세 내용을 출력
                 if (jsonNode.has("error_description") && !jsonNode.get("error_description").isNull()) {
                      System.err.println("오류 상세: " + jsonNode.get("error_description").asText());
                 } else if (jsonNode.has("error") && !jsonNode.get("error").isNull()) {
                     System.err.println("오류 코드: " + jsonNode.get("error").asText());
                 }
                 throw new RuntimeException(provider + " 토큰 응답 파싱 실패: access_token 필드 누락 또는 오류 응답");
             }
        } catch (Exception e) {
             // JSON 파싱 중 오류 발생
             System.err.println(provider + " 토큰 응답 JSON 파싱 오류: " + e.getMessage());
             throw new RuntimeException(provider + " 토큰 응답 JSON 파싱 오류", e);
        }
    }

    // ✅ Access Token을 사용하여 사용자 정보 조회 요청 메소드 (Google 전용)
    // Google의 사용자 정보 API (googleUserInfoUri)에 GET 요청을 보냅니다.
    private Map<String, Object> getUserInfo(String provider, String accessToken, String userInfoUri) {
        // Google 사용자 정보 API 명세에 맞춰 요청 헤더 및 파라미터 구성
        // Authorization: Bearer <access_token> 헤더를 사용합니다.
        WebClient.RequestHeadersSpec<?> requestSpec = webClient.get()
                .uri(userInfoUri) // Google 사용자 정보 조회 API 주소
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken); // Authorization 헤더에 Access Token 포함

        // API 호출 및 응답 본문(String) 받기
         String responseBody = requestSpec.retrieve()
                                        .bodyToMono(String.class)
                                        .block();

        // 응답 본문이 null인 경우 오류 처리
        if (responseBody == null) {
             throw new RuntimeException(provider + " 사용자 정보 요청 응답 본문이 null입니다.");
        }

        try {
             // 응답 본문 (JSON) 파싱 및 사용자 정보 추출
            JsonNode jsonNode = objectMapper.readTree(responseBody);
             Map<String, Object> userInfo = new HashMap<>();

            // ✅ Google 응답 구조에 맞춰 필요한 사용자 정보(ID, 이메일, 이름 등)를 추출합니다.
            // Google 응답 예시: {"id":"...","email":"...","verified_email":true,"name":"...","given_name":"...", ...}
            userInfo.put("id", jsonNode.has("id") && !jsonNode.get("id").isNull() ? jsonNode.get("id").asText() : null); // 필수 Google 고유 ID (String)
            userInfo.put("email", jsonNode.has("email") && !jsonNode.get("email").isNull() ? jsonNode.get("email").asText() : null); // 이메일
            userInfo.put("name", jsonNode.has("name") && !jsonNode.get("name").isNull() ? jsonNode.get("name").asText() : null); // 이름
            // 필요한 다른 정보 (예: picture(프로필 이미지 URL), locale 등) 추출 및 userInfo 맵에 추가
            // userInfo.put("picture", jsonNode.has("picture") && !jsonNode.get("picture").isNull() ? jsonNode.get("picture").asText() : null);


             // 최소한의 필수 정보 (Google 고유 ID)가 제대로 추출되었는지 확인
             if (!userInfo.containsKey("id") || userInfo.get("id") == null || ((String) userInfo.get("id")).isEmpty()) {
                 System.err.println(provider + " 사용자 정보 응답에서 필수 ID 필드 추출 실패 또는 ID 값 누락: " + responseBody);
                 throw new RuntimeException(provider + " 사용자 정보 파싱 실패: 필수 ID 누락");
             }

             return userInfo; // 추출된 사용자 정보 Map 반환
        } catch (Exception e) {
             // JSON 파싱 중 오류 발생
             System.err.println(provider + " 사용자 정보 JSON 파싱 오류: " + e.getMessage());
             throw new RuntimeException(provider + " 사용자 정보 JSON 파싱 오류", e);
        }
    }

    // ✅ 소셜 서비스 사용자 정보로 자체 회원 처리 (로그인 또는 회원가입) 메소드 (Google 전용)
    // 조회된 Google ID를 기반으로 DB에서 Candidate 사용자를 찾고, 없으면 새로 생성합니다.
    private Candidate processSocialUser(String provider, Map<String, Object> userInfo) {
        String socialId = (String) userInfo.get("id"); // Google에서 받은 고유 ID (String)
        String email = (String) userInfo.get("email"); // Google에서 받은 이메일 (없을 수도 있음)
        String name = (String) userInfo.get("name"); // Google에서 받은 이름 (없을 수도 있음)
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google 계정의 이메일을 확인할 수 없어 가입을 진행할 수 없습니다.");
        }

        // 1. 데이터베이스에서 해당 Google ID로 기존 Candidate 사용자를 찾습니다.
        // CandidateRepository에 findByGoogleId 메소드가 필요합니다.
        Optional<Candidate> existingCandidate = candidateRepository.findByGoogleId(socialId);

        Candidate candidate;
        if (existingCandidate.isPresent()) {
            // 2. 이미 우리 서비스에 해당 Google 계정으로 가입된 사용자입니다. -> 로그인 처리
            candidate = existingCandidate.get();
            if (name != null && !name.isBlank() && !name.equals(candidate.getCandidateName())) {
                candidate.setCandidateName(name);
            }
            if (!email.equals(candidate.getCandidateEmail())) {
                Optional<Candidate> emailOwner = candidateRepository.findByCandidateEmail(email);
                if (emailOwner.isPresent() && !emailOwner.get().getCandidateId().equals(candidate.getCandidateId())) {
                    throw new IllegalArgumentException("Google 이메일이 다른 계정에 이미 연결되어 있습니다.");
                }
                candidate.setCandidateEmail(email);
            }
            candidate.setCandidateUpdatedAt(LocalDateTime.now()); // 최종 업데이트 시간 기록
            // candidateRepository.save(candidate); // @Transactional 어노테이션이 있으면 자동 저장될 수 있습니다.

            System.out.println(provider + " 기존 사용자 로그인: Social ID = " + socialId + ", Candidate ID = " + candidate.getCandidateId());

        } else {
            Optional<Candidate> concurrentCheck = candidateRepository.findByGoogleId(socialId);
            if (concurrentCheck.isPresent()) {
            // 다른 스레드에서 거의 동시에 삽입한 경우를 감지
                System.out.println(provider + " 사용자 동시 삽입 감지: Social ID = " + socialId + ". 기존 사용자 반환.");
                return concurrentCheck.get(); // 이미 삽입된 사용자 반환
            }
            // 3. 새로운 사용자입니다. -> 회원가입 처리 (개인회원 Candidate으로 가입)
            candidate = new Candidate();
            // Google ID를 Candidate 엔티티의 google_id 컬럼에 설정합니다.
            // Candidate 엔티티에 googleId 필드와 setGoogleId() 메소드가 필요합니다.
            candidate.setGoogleId(socialId);

            // 이메일 설정 (Google에서 제공된 경우)
             // ✅ 중요: 이메일이 이미 다른 계정(일반 회원, 다른 소셜 계정)에 사용 중인지 확인하는 로직 추가 고려
            if (email != null && !email.isEmpty()) {
                 Optional<Candidate> existingEmailUser = candidateRepository.findByCandidateEmail(email);
                 if (existingEmailUser.isPresent()) {
                     // 이미 해당 이메일로 가입된 다른 계정이 있는 경우
                     // TODO: 이 경우 어떻게 처리할 것인지 결정해야 합니다.
                     // 현재는 일단 에러 발생시키는 것으로 가정
                     throw new RuntimeException("이미 가입된 이메일 주소입니다: " + email);
                 }
                candidate.setCandidateEmail(email); // 이메일 설정
            }

            // 이름 설정 (Google에서 제공된 경우)
            candidate.setCandidateName(name != null && !name.isEmpty() ? name : null);

            // github_login 필드 설정 (Google 소셜 로그인 시에는 조합된 ID 사용)
             // ✅ 중요: github_login 필드는 UNIQUE 제약 조건이 있으므로, 이미 존재하는 값인 경우 처리 로직 필요 (예: 뒤에 숫자 추가)
             // Google 소셜 사용자의 github_login 값을 어떻게 설정할지 결정합니다.
             // 예: google_ + socialId
             String socialLogin = provider.toLowerCase() + "_" + socialId;
             if (candidateRepository.existsByGithubLogin(socialLogin)) {
                 throw new IllegalArgumentException("소셜 계정 식별자가 이미 사용 중입니다. 고객센터에 문의해 주세요.");
             }
             candidate.setGithubLogin(socialLogin);


            // 소셜 계정은 비밀번호 로그인을 사용하지 않지만 DB의 NOT NULL 제약을
            // 만족하기 위해 추측 불가능한 해시만 저장합니다.
            candidate.setCandidatePassword(passwordEncoder.encode(UUID.randomUUID().toString()));


            candidate.setCandidateRegistrationDate(LocalDateTime.now());
            candidate.setCandidateCreatedAt(LocalDateTime.now());
            candidate.setCandidateUpdatedAt(LocalDateTime.now());

            // TODO: 추가적인 필수 필드 설정 (예: 전화번호 등 - 소셜 서비스에서 제공하지 않으면 가입 후 정보 입력 페이지로 리다이렉트 고려)

            candidate = candidateRepository.save(candidate); // 데이터베이스에 새로운 Candidate 레코드 저장

            System.out.println(provider + " 신규 사용자 가입 및 로그인: Social ID = " + socialId + " -> Candidate ID = " + candidate.getCandidateId());
        }

        // 4. 처리된 Candidate 엔티티 반환
        return candidate;
    }

    // ✅ Google ID로 Candidate 엔티티를 데이터베이스에서 찾는 메소드
    // CandidateRepository에 Optional<Candidate> findByGoogleId(String googleId); 메소드가 정의되어 있어야 합니다.
    private Optional<Candidate> findCandidateBySocialId(String provider, String socialId) {
         // 이 메소드는 Google 전용 서비스이므로 provider가 "google"일 때만 동작하도록 합니다.
         if ("google".equalsIgnoreCase(provider) && socialId != null && !socialId.isEmpty()) {
              return candidateRepository.findByGoogleId(socialId);
         }
         // provider가 "google"이 아니거나 socialId가 유효하지 않으면 빈 Optional 반환
         return Optional.empty();
    }

     // ✅ 프론트엔드 응답에 포함할 Google 소셜 로그인 사용자의 식별자 생성 메소드
     // 사용자에게 보여주거나 로깅에 사용할 목적으로 provider와 socialId를 조합하여 문자열 생성 (예: google_12345)
     private String getSocialLoginIdentifier(String provider, Map<String, Object> userInfo) {
         // 이 메소드는 Google 전용 서비스이므로 provider가 "google"일 때만 의미 있습니다.
         String socialId = (String) userInfo.get("id");
         if (socialId == null) return provider.toLowerCase() + "_user"; // ID가 없는 경우 기본값

         return provider.toLowerCase() + "_" + socialId; // 예: "google_12345"
     }

    // TODO: State 검증 메소드 validateState(String state) 구현 (필요시)
    // TODO: PKCE 관련 메소드 구현 및 검증 로직 보강
    // TODO: 사용자 정보 업데이트 로직 구현 (processSocialUser 메소드 내)
}

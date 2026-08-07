package com.zoop.backend.domain.entity;


/**
  *
  * @author hwangseojin
  */

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue; // java.sql.Timestamp 클래스 임포트
import jakarta.persistence.GenerationType; // java.util.Date 클래스 임포트 (CANDIDATE_REGISTRATION_DATE 컬럼이 DATE 타입이므로 사용)
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity // 이 클래스가 JPA 엔티티임을 나타냅니다.
@Table(name = "CANDIDATES") // 이 엔티티가 매핑될 실제 데이터베이스 테이블 이름을 지정합니다.
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor @Data // Lombok 어노테이션
public class Candidate {
 
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "candidates_seq_gen") // Oracle Sequence 사용 설정
    @SequenceGenerator(name = "candidates_seq_gen", sequenceName = "candidates_seq", allocationSize = 1) // 사용할 Sequence 이름 명시
    @Column(name = "CANDIDATE_ID") // 실제 DB 컬럼 이름 매핑
    private Long candidateId; // Oracle NUMBER(10) 타입에 대응
 
    @Column(name = "GITHUB_LOGIN", unique = true, nullable = false) // VARCHAR2(255), UNIQUE, NOT NULL
    private String githubLogin;
 
    @Column(name = "CANDIDATE_EMAIL", unique = true, nullable = false) // VARCHAR2(255), UNIQUE, NOT NULL
    private String candidateEmail;
 
    @Column(name = "CANDIDATE_PASSWORD", nullable = false) // VARCHAR2(255), NOT NULL (해시된 비밀번호 저장용)
    @JsonIgnore
    private String candidatePassword;
 
    @Column(name = "CANDIDATE_NAME") // VARCHAR2(255), nullable=true (기본값)
    private String candidateName;
 
    @Column(name = "CANDIDATE_PHONE_NUMBER") // VARCHAR2(20), nullable=true (기본값)
    private String candidatePhoneNumber;
 
    @Column(name = "CANDIDATE_REGISTRATION_DATE", nullable = false) // DATE, NOT NULL
    private LocalDateTime candidateRegistrationDate; // 데이터베이스 DATE 타입에 대응합니다. java.util.Date 또는 java.sql.Date 사용
 
    @Column(name = "CANDIDATE_CREATED_AT", nullable = false) // TIMESTAMP, NOT NULL
    private LocalDateTime candidateCreatedAt;
 
    @Column(name = "CANDIDATE_UPDATED_AT", nullable = false) // TIMESTAMP, NOT NULL
    private LocalDateTime candidateUpdatedAt;
 
     // @PrePersist, @PreUpdate 등의 JPA 콜백 메소드를 사용하여 생성/수정 시각 자동 업데이트 로직을 구현할 수 있습니다.

    @Column(name="google_id", unique=true)
    private String googleId;

    // @Column(name = "github_id", unique = true) 
    // private String githubId;

    // @Column(name = "naver_id", unique = true)
    // private String naverId;

    // 사용자 설정 정보 필드들
    @Column(name="preferred_job", length=100)
    private String preferredJob;
    
    @Column(name="preferred_region", length=100)
    private String preferredRegion;
    
    @Column(name="preferred_salary", length=100)
    private String preferredSalary;
    
    @Column(name="preferred_company_size", length=100)
    private String preferredCompanySize;
    
    @Column(name="preferred_commute_time", length=100)
    private String preferredCommuteTime;
    
    @Column(name="preferred_benefit", length=100)
    private String preferredBenefit;

    @Column(name = "CAREER_TYPE", length = 10)
    private String careerType; // '신입' 또는 '경력'

    @Column(name = "TOTAL_CAREER_PERIOD", length = 20)
    private String totalCareerPeriod; // 예: '2년 3개월' 또는 '0', '신입'
}

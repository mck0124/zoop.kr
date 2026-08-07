import os
import requests
import json
import asyncio
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
from typing import List, Optional, Dict, Any
import threading
import time
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../github_search')))
from github_search_logic import analyze_portfolio_file

# .env에서 API 키 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPRING_API_URL = os.getenv("SPRING_API_URL", "http://localhost:8081")

client = openai.OpenAI(api_key=OPENAI_API_KEY)

def call_openai_chat(messages, max_tokens=800, temperature=0.3):
    """OpenAI API 호출 함수"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API 호출 오류: {e}")
        return f"API 호출 중 오류가 발생했습니다: {e}"

app = FastAPI(
    title="Portfolio Matching API",
    description="AI 기반 포트폴리오 분석 및 채용공고 매칭 API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic 모델들
class PortfolioAnalysisRequest(BaseModel):
    portfolio_id: int
    candidate_id: int
    portfolio_content: str
    desired_job: Optional[str] = None
    self_introduction: Optional[str] = None

class PortfolioAnalysisResponse(BaseModel):
    success: bool
    analysis_id: Optional[int] = None
    analysis_data: Optional[str] = None
    error: Optional[str] = None

class JobMatchingRequest(BaseModel):
    portfolio_id: int
    analysis_id: int

class JobMatchingResponse(BaseModel):
    success: bool
    matches: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

def analyze_portfolio_content(portfolio_content: str, desired_job: Optional[str] = None, self_introduction: Optional[str] = None) -> dict:
    """OpenAI를 사용하여 포트폴리오 내용 분석"""
    
    # 분석할 텍스트 구성
    analysis_text = portfolio_content
    
    # desired_job이 있으면 추가, 없으면 self_introduction 사용
    if desired_job:
        analysis_text += f"\n\n희망 직무: {desired_job}"
    elif self_introduction:
        analysis_text += f"\n\n자기소개: {self_introduction}"
    
    prompt = f"""
다음은 지원자의 포트폴리오 내용입니다. 이를 종합적으로 분석해주세요.

{analysis_text}

다음 기준으로 분석해주세요:

1. **기술 스택**: 사용 가능한 프로그래밍 언어, 프레임워크, 도구들
2. **프로젝트 경험**: 주요 프로젝트와 그 역할, 성과
3. **문제해결 능력**: 기술적 문제 해결 사례와 접근 방법
4. **협업 능력**: 팀 프로젝트 경험과 협업 스타일
5. **학습 의지**: 새로운 기술 학습과 자기계발 의지
6. **전문 분야**: 가장 강점을 가진 기술 분야
7. **경력 수준**: 주니어/미드레벨/시니어 수준 판단

각 항목별로 구체적인 내용을 분석하고, 종합적인 평가를 제공해주세요.

반드시 아래 형식으로 출력해주세요:
기술 스택: [분석 내용]
프로젝트 경험: [분석 내용]
문제해결 능력: [분석 내용]
협업 능력: [분석 내용]
학습 의지: [분석 내용]
전문 분야: [분석 내용]
경력 수준: [분석 내용]
종합평가: [3-4줄 종합 평가]
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 IT 채용 전문가입니다. 객관적이고 정확하게 포트폴리오를 분석해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        analysis_text = response.choices[0].message.content
        
        return {
            "analysis": analysis_text,
            "portfolio_content": portfolio_content,
            "desired_job": desired_job,
            "self_introduction": self_introduction
        }
        
    except Exception as e:
        print(f"OpenAI analysis error: {e}")
        return {
            "analysis": f"분석 중 오류가 발생했습니다: {e}",
            "portfolio_content": portfolio_content,
            "desired_job": desired_job,
            "self_introduction": self_introduction
        }

def match_portfolio_to_jobs(analysis_data: str) -> Dict[str, Any]:
    """지원자 증거를 모든 활성 공고와 비교해 실제 공고 ID가 포함된 결과를 반환한다."""
    active_jobs = get_active_jobs_from_spring()
    matches = []
    for job in active_jobs:
        job_id = job.get("postId")
        if not job_id:
            continue
        result = match_portfolio_to_specific_job(analysis_data, job)
        result["jobPostingId"] = job_id
        result["jobTitle"] = job.get("postTitle", "제목 없음")
        matches.append(result)
    matches.sort(key=lambda item: item.get("matching_score", 0), reverse=True)
    return {"matches": matches[:10], "matching_count": len(matches)}

def save_portfolio_analysis_to_spring(portfolio_id: int, analysis_data: str, analysis_type: str = "standalone_portfolio") -> Optional[int]:
    """Spring 백엔드에 포트폴리오 분석 결과 저장"""
    try:
        # 먼저 job_candidate_id 없이 저장 (나중에 업데이트할 예정)
        payload = {
            "analysisType": analysis_type,
            "jobCandidateId": None,  # 나중에 업데이트할 예정
            "analysisData": analysis_data,
            "analysisScore": 0.0,  # 포트폴리오 분석은 점수 없음
            "candPortfolioId": portfolio_id  # cand_portfolio_id도 함께 저장
        }
        
        response = requests.post(
            f"{SPRING_API_URL}/api/ai-analysis-results",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 201:
            result = response.json()
            return result.get("analysisId")
        else:
            print(f"Spring API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Spring API save error: {e}")
        return None

def get_job_candidate_id_by_candidate_and_post(candidate_id: int, post_id: int) -> Optional[int]:
    """candidate_id와 post_id로 job_candidate_id 조회"""
    try:
        response = requests.get(
            f"{SPRING_API_URL}/api/progress/{post_id}/{candidate_id}/job-candidate-id",
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("jobCandidateId")
        else:
            print(f"Failed to get job_candidate_id: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error getting job_candidate_id: {e}")
        return None

def update_ai_analysis_job_candidate_id(analysis_id: int, job_candidate_id: int) -> bool:
    """ai_analysis_results의 job_candidate_id 업데이트"""
    try:
        payload = {
            "jobCandidateId": job_candidate_id
        }
        
        response = requests.put(
            f"{SPRING_API_URL}/api/ai-analysis-results/{analysis_id}/job-candidate-id",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"[INFO] AI analysis job_candidate_id updated successfully: analysis_id={analysis_id}, job_candidate_id={job_candidate_id}")
            return True
        else:
            print(f"[WARN] Failed to update AI analysis job_candidate_id: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] AI analysis job_candidate_id update error: {e}")
        return False

def get_job_candidate_id_by_portfolio(portfolio_id: int) -> Optional[int]:
    """portfolio_id로 job_candidate_id 조회"""
    try:
        response = requests.get(
            f"{SPRING_API_URL}/api/portfolio-job-matches/portfolio/{portfolio_id}/job-candidate-id",
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get("jobCandidateId")
        else:
            print(f"Failed to get job_candidate_id: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error getting job_candidate_id: {e}")
        return None

def save_portfolio_job_matches_to_spring(portfolio_id: int, matches: List[Dict[str, Any]]) -> bool:
    """Spring 백엔드에 포트폴리오-채용공고 매칭 결과 저장"""
    try:
        for match in matches:
            readable_reason = match.get("matching_analysis", "")
            evidence = match.get("matching_evidence")
            if evidence:
                readable_reason = json.dumps(
                    {"summary": readable_reason, "evidence": evidence},
                    ensure_ascii=False
                )
            payload = {
                "candPortfolioId": portfolio_id,  # portfolioId -> candPortfolioId로 변경
                "jobPostingId": match.get("jobPostingId", 0),
                "matchingScore": match.get("matching_score", 0.0),
                "matchingReason": readable_reason
            }
            
            print(f"[DEBUG] 매칭 저장 시도: candPortfolioId={portfolio_id}, jobPostingId={match.get('jobPostingId')}, score={match.get('matching_score')}")
            
            response = requests.post(
                f"{SPRING_API_URL}/api/portfolio-job-matches",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code != 201:
                print(f"Failed to save match: {response.status_code} - {response.text}")
                return False
            else:
                print(f"[DEBUG] 매칭 저장 성공: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"Spring API save matches error: {e}")
        return False

def update_job_cand_progress_to_2y(candidate_id: int, post_id: int) -> bool:
    """job_cand_progress에 새로운 행을 2y 상태로 생성"""
    try:
        # 새로운 job_cand_progress 행을 2y 상태로 생성
        payload = {
            "postId": post_id,
            "candidateId": candidate_id,
            "jobCandCurrStage": "2y"
        }
        
        response = requests.post(
            f"{SPRING_API_URL}/api/progress/create",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 201:
            print(f"[INFO] New JobCandProgress created with 2y stage: candidate_id={candidate_id}, post_id={post_id}")
            return True
        else:
            print(f"[WARN] Failed to create JobCandProgress: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] JobCandProgress creation error: {e}")
        return False

def update_portfolio_analysis_status(portfolio_id: int, status: str):
    """포트폴리오 분석 상태 업데이트"""
    try:
        response = requests.put(
            f"{SPRING_API_URL}/api/portfolios/{portfolio_id}/analysis-status",
            params={"status": status},
            timeout=10
        )
        if response.status_code == 200:
            print(f"[INFO] Updated portfolio analysis status to {status} for portfolio {portfolio_id}")
        else:
            print(f"[WARN] Failed to update portfolio analysis status: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception updating portfolio analysis status: {e}")

def update_candidate_portfolio_analysis_status(cand_portfolio_id: int, status: str):
    """candidate_portfolios 상태 업데이트 (Spring 전용 API)"""
    try:
        response = requests.put(
            f"{SPRING_API_URL}/api/portfolios/candidate-portfolio/{cand_portfolio_id}/analysis-status",
            params={"status": status},
            timeout=10
        )
        print(f"[DEBUG] CandidatePortfolio status update response: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception updating candidate_portfolio analysis status: {e}")

async def process_portfolio_analysis_async(portfolio_id: int, candidate_id: int, portfolio_content: str, 
                                         desired_job: Optional[str] = None, self_introduction: Optional[str] = None):
    """비동기로 포트폴리오 분석 처리"""
    try:
        print(f"[INFO] Starting async portfolio analysis for portfolio_id: {portfolio_id}")
        
        # 1. 포트폴리오 내용 분석
        analysis_result = analyze_portfolio_content(portfolio_content, desired_job, self_introduction)
        
        # 2. Spring 백엔드에 분석 결과 저장 (job_candidate_id 없이)
        analysis_id = save_portfolio_analysis_to_spring(portfolio_id, analysis_result["analysis"])
        
        if analysis_id:
            print(f"[INFO] Portfolio analysis saved with ID: {analysis_id}")
            
            # candidate_portfolios 상태를 COMPLETED로 명시적으로 업데이트
            update_candidate_portfolio_analysis_status(portfolio_id, "COMPLETED")
            
            # 3. Spring 백엔드에서 활성 채용공고 목록 조회
            active_jobs = get_active_jobs_from_spring()
            print(f"[DEBUG] 활성 공고 개수: {len(active_jobs)}")
            if not active_jobs:
                print("[DEBUG] 활성 공고가 없습니다. 매칭을 건너뜁니다.")
            else:
                print("[DEBUG] 매칭 루프 진입")
            # 4. 각 채용공고와 매칭 분석
            matches = []
            for job in active_jobs:
                job_matching_result = match_portfolio_to_specific_job(analysis_result["analysis"], job)
                score = job_matching_result["matching_score"]
                job_title = job.get("postTitle", "제목없음")
                job_id = job.get("postId")
                print(f"[MATCH] 공고 '{job_title}' (ID: {job_id}) 점수: {score}")
                if score >= 50:
                    print(f"[MATCH] 매칭 성공: {job_title} (점수: {score})")
                    job_matching_result["jobPostingId"] = job_id
                    matches.append(job_matching_result)
                else:
                    print(f"[MATCH] 매칭 실패: {job_title} (점수: {score})")
            
            # 5. 매칭 결과를 Spring 백엔드에 저장
            if matches:
                save_success = save_portfolio_job_matches_to_spring(portfolio_id, matches)
                if save_success:
                    print(f"[INFO] Portfolio-job matches saved successfully: {len(matches)} matches")
                else:
                    print(f"[WARN] Failed to save portfolio-job matches")
            else:
                print(f"[INFO] No matches found with score >= 50")
            
            # 6. 포트폴리오 분석 상태를 COMPLETED로 업데이트 (기존 portfolios 테이블용, candidate_portfolios는 위에서 처리)
            update_portfolio_analysis_status(portfolio_id, "COMPLETED")
            print(f"[INFO] Portfolio analysis completed: portfolio_id={portfolio_id}")
        else:
            print(f"[ERROR] Failed to save portfolio analysis")
            # 분석 실패 시 상태를 FAILED로 업데이트
            update_portfolio_analysis_status(portfolio_id, "FAILED")
            update_candidate_portfolio_analysis_status(portfolio_id, "FAILED")
        
    except Exception as e:
        print(f"[ERROR] Async portfolio analysis error: {e}")
        # 오류 발생 시 상태를 FAILED로 업데이트
        try:
            update_portfolio_analysis_status(portfolio_id, "FAILED")
            update_candidate_portfolio_analysis_status(portfolio_id, "FAILED")
        except Exception as update_error:
            print(f"[ERROR] Failed to update portfolio status: {update_error}")

def get_active_jobs_from_spring() -> List[Dict[str, Any]]:
    """Spring 백엔드에서 활성 채용공고 목록 조회"""
    try:
        response = requests.get(
            f"{SPRING_API_URL}/api/posts/active",
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get active jobs: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"Error getting active jobs: {e}")
        return []

def match_portfolio_to_specific_job(analysis_data: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """특정 채용공고와 포트폴리오 매칭 분석"""
    
    job_title = job_data.get("postTitle", "")
    job_description = job_data.get("postDescription", "")
    job_language = job_data.get("postProgrammingLanguage", "")
    job_ideal_candidate = job_data.get("postIdealCandidate", "")
    job_location = job_data.get("postLocation", "")
    job_salary_min = job_data.get("postSalaryStart", 0)
    job_salary_max = job_data.get("postSalaryEnd", 0)
    
    prompt = f"""
다음은 지원자의 포트폴리오 분석 결과와 채용공고 정보입니다.

[포트폴리오 분석 결과]
{analysis_data}

[채용공고 정보]
제목: {job_title}
설명: {job_description}
요구 기술: {job_language}
인재상: {job_ideal_candidate}
근무 지역: {job_location}
연봉 범위: {job_salary_min}~{job_salary_max}

이 분석 결과를 바탕으로, 이 지원자와 채용공고의 매칭 점수를 계산해주세요.

중요한 원칙:
- 이름, 성별, 나이, 사진, 출신 학교처럼 직무와 무관한 정보는 절대 평가에 사용하지 마세요.
- 포트폴리오에 실제로 나타난 내용만 근거로 사용하고, 추측은 '확인 필요'로 표시하세요.
- 채용공고의 요구사항과 지원자의 증거를 1:1로 대조하여 설명 가능한 판단을 만드세요.

다음 기준으로 매칭 점수를 계산해주세요:

1. **기술 스택 일치도 (30점)**: 요구 기술과 보유 기술의 일치 정도
2. **경력 수준 적합성 (25점)**: 요구 경력과 현재 경력 수준의 적합성
3. **프로젝트 경험 관련성 (25점)**: 과거 프로젝트와 업무 내용의 관련성
4. **성장 가능성 (20점)**: 회사에서의 성장 가능성과 학습 의지

각 항목별 점수와 근거를 제시하고, 최종 매칭 점수를 계산해주세요.

반드시 JSON 하나만 출력해주세요. Markdown이나 코드 펜스는 사용하지 마세요.
스키마:
{{
  "score": 0,
  "decision": "strong_match|review|not_enough_evidence",
  "dimensions": [
    {{"name":"기술 스택 일치도","score":0,"max":30,"evidence":[{{"source":"portfolio|job|missing","claim":"구체적인 근거","confidence":0.0}}]}},
    {{"name":"경력 수준 적합성","score":0,"max":25,"evidence":[]}},
    {{"name":"프로젝트 경험 관련성","score":0,"max":25,"evidence":[]}},
    {{"name":"성장 가능성","score":0,"max":20,"evidence":[]}}
  ],
  "recommended_role": "추천 직무 분야",
  "summary": "3~4문장 요약",
  "gaps": ["추가 확인이 필요한 사항"],
  "interview_focus": ["면접에서 검증할 질문 주제"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 IT 채용 매칭 전문가입니다. 정확하고 객관적으로 매칭 분석을 해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1200,
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        
        matching_analysis = response.choices[0].message.content or "{}"
        structured = json.loads(matching_analysis)
        score = float(structured.get("score", 0) or 0)
        score = max(0.0, min(100.0, score))
        dimensions = structured.get("dimensions", [])
        evidence_lines = []
        for dimension in dimensions:
            name = dimension.get("name", "평가 항목")
            dimension_score = dimension.get("score", 0)
            maximum = dimension.get("max", 100)
            evidence = dimension.get("evidence", [])
            evidence_text = " / ".join(item.get("claim", "확인 필요") for item in evidence[:2])
            evidence_lines.append(f"{name}: {dimension_score}/{maximum} — {evidence_text or '확인 필요'}")
        readable_analysis = "\n".join([
            f"종합 매칭 점수: {score:.0f}점 ({structured.get('decision', 'review')})",
            f"추천 직무: {structured.get('recommended_role', job_title)}",
            f"요약: {structured.get('summary', '')}",
            *evidence_lines,
            f"추가 확인: {', '.join(structured.get('gaps', [])) or '없음'}",
            f"면접 검증 포인트: {', '.join(structured.get('interview_focus', [])) or '직무 핵심 경험'}"
        ])
        
        return {
            "matching_analysis": readable_analysis,
            "matching_score": score,
            "recommended_job": structured.get("recommended_role", job_title),
            "matching_evidence": structured
        }
        
    except Exception as e:
        print(f"OpenAI matching error: {e}")
        return {
            "matching_analysis": "매칭 분석을 완료하지 못했습니다. 지원자의 증거를 확인한 뒤 다시 시도해 주세요.",
            "matching_score": 0.0,
            "recommended_job": job_title,
            "matching_evidence": {"decision": "not_enough_evidence", "error": "AI 분석 결과를 검증하지 못함"}
        }

def auto_analyze_pending_portfolios():
    """PENDING 상태의 포트폴리오를 자동으로 분석하는 스케줄러"""
    while True:
        try:
            print("[AUTO] PENDING 포트폴리오 확인 중...")
            
            # 1. Spring 백엔드에서 PENDING 상태의 candidate_portfolios 조회
            response = requests.get(f"{SPRING_API_URL}/api/portfolios/candidate-pending", timeout=10)
            
            if response.status_code == 200:
                pending_portfolios = response.json()
                print(f"[AUTO] PENDING candidate_portfolios 발견: {len(pending_portfolios)}개")
                
                for portfolio in pending_portfolios:
                    try:
                        portfolio_id = portfolio.get('candPortfolioId')
                        candidate_id = portfolio.get('candidateId')
                        portfolio_file_path = portfolio.get('portfolioFilePath')
                        
                        if portfolio_id and candidate_id:
                            print(f"[AUTO] 포트폴리오 분석 시작: portfolio_id={portfolio_id}, candidate_id={candidate_id}")
                            
                            # 포트폴리오 내용 추출 (파일 경로가 있는 경우)
                            portfolio_content = ""
                            if portfolio_file_path and not portfolio_file_path.startswith("local://"):
                                try:
                                    if portfolio_file_path.endswith('.pdf'):
                                        # PDF 파일은 텍스트 추출 함수 사용
                                        portfolio_content = extract_text_from_file_direct(portfolio_file_path)
                                    else:
                                        # 텍스트 파일은 바로 읽기
                                        file_response = requests.get(portfolio_file_path, timeout=30)
                                        if file_response.status_code == 200:
                                            portfolio_content = file_response.text[:2000]  # 최대 2000자
                                        else:
                                            portfolio_content = "포트폴리오 파일을 읽을 수 없습니다."
                                except Exception as e:
                                    print(f"[AUTO] 파일 읽기 오류: {e}")
                                    portfolio_content = "포트폴리오 파일 분석 중 오류가 발생했습니다."
                            
                            # 기본 포트폴리오 내용 설정
                            if not portfolio_content:
                                portfolio_content = "포트폴리오 내용이 제공되지 않았습니다."
                            
                            # 동기적으로 분석 실행 (asyncio.create_task 대신)
                            try:
                                # 동기적으로 process_portfolio_analysis_async 호출
                                import asyncio
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                result = loop.run_until_complete(
                                    process_portfolio_analysis_async(
                                        portfolio_id, candidate_id, portfolio_content, 
                                        "", ""  # desired_job, self_introduction
                                    )
                                )
                                loop.close()
                                print(f"[AUTO] 신규 포트폴리오 분석 완료: portfolio_id={portfolio_id}")
                            except Exception as e:
                                print(f"[AUTO] 신규 포트폴리오 분석 중 오류: portfolio_id={portfolio_id}, error={e}")
                            
                            print(f"[AUTO] 포트폴리오 분석 작업 시작됨: portfolio_id={portfolio_id}")
                            
                    except Exception as e:
                        print(f"[AUTO] 포트폴리오 분석 중 오류: portfolio_id={portfolio_id}, error={e}")
            
            # 2. Spring 백엔드에서 PENDING 상태의 기존 portfolios 조회
            response2 = requests.get(f"{SPRING_API_URL}/api/portfolios/pending", timeout=10)
            
            if response2.status_code == 200:
                pending_old_portfolios = response2.json()
                print(f"[AUTO] PENDING 기존 portfolios 발견: {len(pending_old_portfolios)}개")
                
                for portfolio in pending_old_portfolios:
                    try:
                        portfolio_id = portfolio.get('portfolioId')
                        job_candidate_id = portfolio.get('jobCandidateId')
                        portfolio_file_path = portfolio.get('portfolioFilePath')
                        
                        if portfolio_id and job_candidate_id and portfolio_file_path:
                            print(f"[AUTO] 기존 포트폴리오 분석 시작: portfolio_id={portfolio_id}, job_candidate_id={job_candidate_id}")
                            
                            # github_search_logic의 analyze_portfolio_file 함수를 직접 구현
                            try:
                                # github_search_logic의 analyze_portfolio_file 함수를 직접 구현
                                analysis_result = analyze_portfolio_file_direct(portfolio_file_path)
                                
                                if analysis_result:
                                    # 분석 결과를 Spring 백엔드에 저장
                                    analysis_id = save_portfolio_analysis_to_spring(
                                        portfolio_id, 
                                        analysis_result, 
                                        "portfolio"  # 기존 포트폴리오는 "portfolio" 타입
                                    )
                                    
                                    if analysis_id:
                                        print(f"[AUTO] 기존 포트폴리오 분석 완료: portfolio_id={portfolio_id}, analysis_id={analysis_id}")
                                        
                                        # 포트폴리오 상태를 COMPLETED로 변경 (Spring API 호출)
                                        try:
                                            update_url = f"{SPRING_API_URL}/api/portfolios/{portfolio_id}/status"
                                            update_data = {"portfolioAnalysisStatus": "COMPLETED"}
                                            update_response = requests.put(update_url, json=update_data, timeout=10)
                                            if update_response.status_code == 200:
                                                print(f"[AUTO] 기존 포트폴리오 상태 업데이트 완료: portfolio_id={portfolio_id}")
                                            else:
                                                print(f"[AUTO] 기존 포트폴리오 상태 업데이트 실패: {update_response.status_code}")
                                        except Exception as e:
                                            print(f"[AUTO] 기존 포트폴리오 상태 업데이트 오류: {e}")
                                    else:
                                        print(f"[AUTO] 기존 포트폴리오 분석 결과 저장 실패: portfolio_id={portfolio_id}")
                                else:
                                    print(f"[AUTO] 기존 포트폴리오 분석 결과 없음: portfolio_id={portfolio_id}")
                                    
                            except Exception as e:
                                print(f"[AUTO] 기존 포트폴리오 분석 중 오류: portfolio_id={portfolio_id}, error={e}")
                        
                    except Exception as e:
                        print(f"[AUTO] 기존 포트폴리오 분석 중 오류: portfolio_id={portfolio_id}, error={e}")
                        
            else:
                print(f"[AUTO] PENDING 기존 portfolios 조회 실패: {response2.status_code}")
                
        except Exception as e:
            print(f"[AUTO] Auto portfolio analysis error: {e}")
            
        time.sleep(60)  # 1분마다 반복

def analyze_portfolio_file_direct(file_path_or_url):
    """
    github_search_logic의 analyze_portfolio_file 함수를 직접 구현
    포트폴리오 파일을 읽어 GPT-4o-mini로 분석한다.
    """
    print(f"[분석 시작] 포트폴리오 분석 시작: {file_path_or_url}")
    
    # 파일에서 텍스트 추출
    text = extract_text_from_file_direct(file_path_or_url)
    
    if not text or len(text.strip()) < 10:
        print(f"[분석] 텍스트가 너무 짧거나 비어있음: {len(text)} 문자")
        return "지원자의 포트폴리오 내용이 제공되지 않아 구체적인 평가를 진행할 수 없습니다."
    
    print(f"[분석] 추출된 텍스트 길이: {len(text)} 문자")
    print(f"[분석] 텍스트 샘플: {text[:300]}...")
    
    prompt = f"""
아래는 한 지원자의 포트폴리오(이력서/자기소개서 등) 내용입니다. 실제 텍스트 일부 또는 전체가 포함되어 있습니다.

{text[:3000]}

이 지원자의 강점, 약점, 기술스택, 경력, 성장 가능성, 기업 적합성 등을 5~10줄로 요약해 주세요.
그리고 100점 만점 기준으로 종합 점수와 근거를 아래 형식으로 출력해 주세요.

이유: [구체적인 평가 근거와 각 항목별 점수] (점수: [총점]점)
종합요약: [3-4줄 요약]
"""
    
    print(f"[분석] OpenAI API 호출 시작")
    messages = [
        {"role": "system", "content": "너는 이력서/포트폴리오를 정확하게 평가하는 AI 전문가야. 각 지원자의 실제 데이터를 바탕으로 객관적으로 점수를 매겨줘."},
        {"role": "user", "content": prompt}
    ]
    result = call_openai_chat(messages, max_tokens=900, temperature=0.5)
    print(f"[분석 완료] 분석 결과 길이: {len(result) if result else 0} 문자")
    return result

def extract_text_from_file_direct(file_path_or_url):
    """
    파일 경로 또는 URL에서 텍스트를 추출한다. (PDF/텍스트 파일 지원)
    """
    import tempfile
    import os
    import mimetypes
    from PyPDF2 import PdfReader
    
    print(f"[분석 시작] 파일 경로/URL: {file_path_or_url}")
    
    # URL이면 다운로드, 아니면 로컬 파일로 처리
    if file_path_or_url.startswith('http://') or file_path_or_url.startswith('https://'):
        print(f"[분석] URL에서 파일 다운로드 시작: {file_path_or_url}")
        resp = requests.get(file_path_or_url)
        print(f"[분석] 다운로드 응답 상태: {resp.status_code}")
        if resp.status_code != 200:
            print(f"[분석] 다운로드 실패: {resp.status_code} - {resp.text[:200]}")
            raise Exception(f"파일 다운로드 실패: {file_path_or_url}")
        
        print(f"[분석] 다운로드된 파일 크기: {len(resp.content)} bytes")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(resp.content)
            tmp_path = tmp.name
            print(f"[분석] 임시 파일 생성: {tmp_path}")
    else:
        tmp_path = file_path_or_url
        print(f"[분석] 로컬 파일 사용: {tmp_path}")
    
    # 파일 타입 판별
    mime, _ = mimetypes.guess_type(tmp_path)
    print(f"[분석] 파일 타입: {mime}")
    text = ""
    try:
        if mime == 'application/pdf' or tmp_path.lower().endswith('.pdf'):
            print(f"[분석] PDF 파일 처리 시작")
            reader = PdfReader(tmp_path)
            print(f"[분석] PDF 페이지 수: {len(reader.pages)}")
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text += page_text
                print(f"[분석] 페이지 {i+1} 텍스트 길이: {len(page_text)}")
        else:
            print(f"[분석] 텍스트 파일 처리 시작")
            with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
                print(f"[분석] 텍스트 파일 길이: {len(text)}")
    except Exception as e:
        print(f"[분석] 텍스트 추출 오류: {e}")
        text = f"[텍스트 추출 실패: {e}]"
    finally:
        if file_path_or_url.startswith('http') and os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"[분석] 임시 파일 삭제: {tmp_path}")
    
    print(f"[분석] 최종 추출된 텍스트 길이: {len(text)}")
    print(f"[분석] 텍스트 미리보기: {text[:200]}...")
    return text

@app.post("/analyze-portfolio", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(
    portfolio_id: int = Form(...),
    candidate_id: int = Form(...),
    portfolio_content: str = Form(...),
    desired_job: str = Form(""),
    self_introduction: str = Form("")
):
    """포트폴리오 분석 API"""
    try:
        print(f"Starting portfolio analysis for portfolio_id: {portfolio_id}, candidate_id: {candidate_id}")
        
        # 즉시 응답 (비동기 처리)
        response = PortfolioAnalysisResponse(
            success=True,
            analysis_id=None,
            analysis_data="포트폴리오 분석이 시작되었습니다. 잠시 후 결과를 확인해주세요.",
            error=None
        )
        
        # 비동기로 분석 처리 시작
        asyncio.create_task(
            process_portfolio_analysis_async(
                portfolio_id, candidate_id, portfolio_content, 
                desired_job, self_introduction
            )
        )
        
        return response
        
    except Exception as e:
        print(f"Portfolio analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"포트폴리오 분석 중 오류가 발생했습니다: {e}")

@app.post("/analyze-candidate-portfolio")
async def analyze_candidate_portfolio(
    file_url: str = Form(...),
    candidate_id: int = Form(...)
):
    try:
        print(f"[DEBUG] analyze_portfolio_file 호출 직전: file_url={file_url}")
        analysis_result = analyze_portfolio_file(file_url)
        print(f"[DEBUG] analyze_portfolio_file 호출 완료: 결과 길이={len(analysis_result) if analysis_result else 0}")
        if not analysis_result or len(analysis_result.strip()) < 10:
            raise Exception("분석 실패: 결과 없음")
        complete_upload_res = requests.post(
            f"{SPRING_API_URL}/api/portfolios/complete-upload",
            data={"candidateId": candidate_id, "portfolioFilePath": file_url, "analysisData": analysis_result},
            timeout=30
        )
        if complete_upload_res.status_code != 200:
            raise Exception(f"complete-upload API 실패: {complete_upload_res.text}")
        cand_portfolio_id = complete_upload_res.json().get("portfolioId")
        if not cand_portfolio_id:
            raise Exception("complete-upload 응답에 portfolioId가 없습니다.")
        analysis_id = save_portfolio_analysis_to_spring(
            int(cand_portfolio_id),
            analysis_result,
            "standalone_portfolio"
        )
        return {
            "success": True,
            "analysis_data": analysis_result,
            "cand_portfolio_id": cand_portfolio_id,
            "analysis_id": analysis_id
        }
    except Exception as e:
        print(f"Candidate portfolio analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"candidate_portfolio 분석 중 오류가 발생했습니다: {e}")

@app.post("/match-portfolio-jobs", response_model=JobMatchingResponse)
async def match_portfolio_jobs(
    portfolio_id: int = Form(...),
    analysis_id: int = Form(...)
):
    """포트폴리오-채용공고 매칭 API"""
    try:
        print(f"Starting portfolio-job matching for portfolio_id: {portfolio_id}, analysis_id: {analysis_id}")
        
        # Spring API에서 분석 결과 조회
        analysis_response = requests.get(
            f"{SPRING_API_URL}/api/ai-analysis-results/{analysis_id}",
            timeout=30
        )
        
        if analysis_response.status_code != 200:
            raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
        
        analysis_data = analysis_response.json().get("analysisData", "")
        
        # 활성 공고별 매칭 분석 수행. 공고 ID가 없는 결과는 저장하지 않는다.
        matching_result = match_portfolio_to_jobs(analysis_data)
        matches = matching_result.get("matches", [])
        save_success = save_portfolio_job_matches_to_spring(portfolio_id, matches) if matches else True
        
        if not save_success:
            print(f"[WARN] Failed to save matching results")
        
        return JobMatchingResponse(
            success=True,
            matches=matches,
            error=None
        )
        
    except Exception as e:
        print(f"Portfolio-job matching error: {e}")
        raise HTTPException(status_code=500, detail=f"매칭 분석 중 오류가 발생했습니다: {e}")

@app.get("/health")
async def health_check():
    """헬스 체크 API"""
    return {"status": "healthy", "service": "portfolio-matching-api"}

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Portfolio Matching API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.on_event("startup")
def start_auto_analyze():
    """앱 시작 시 자동 분석 스케줄러 시작"""
    threading.Thread(target=auto_analyze_pending_portfolios, daemon=True).start()
    print("[STARTUP] Portfolio auto-analysis scheduler started")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

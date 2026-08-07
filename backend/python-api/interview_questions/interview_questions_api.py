import os
import requests
import json
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
from typing import List

# .env에서 API 키 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

client = None

def get_openai_client():
    global client
    if client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
    return client

app = FastAPI()
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterviewQuestionsRequest(BaseModel):
    post_title: str
    post_description: str
    programming_language: str
    ideal_candidate: str
    location: str
    salary_range: str = ""
    headcount: int = 1
    portfolio_analysis: str = ""

class InterviewQuestionsResponse(BaseModel):
    success: bool
    questions: List[str] = []
    error: str = None

def call_openai_chat(messages, max_tokens=800, temperature=0.3):
    """OpenAI API 호출 함수"""
    try:
        response = get_openai_client().chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return (
            response.choices[0].message.content
            if response.choices and hasattr(response.choices[0], "message")
            else "AI가 응답하지 않았습니다."
        )
    except Exception as e:
        print(f"[OpenAI API Error] {e}")
        raise RuntimeError("AI 서버 연결에 문제가 발생했습니다.") from e

def generate_interview_questions(post_title: str, post_description: str, 
                               programming_language: str, ideal_candidate: str, 
                               location: str, salary_range: str, headcount: int, 
                               portfolio_analysis: str = "") -> List[str]:
    """OpenAI를 사용하여 면접 질문 생성"""
    
    # 포트폴리오 분석 결과가 있는 경우 프롬프트에 포함
    portfolio_section = ""
    if portfolio_analysis and portfolio_analysis.strip():
        portfolio_section = f"""
=== 지원자 포트폴리오 분석 결과 ===
{portfolio_analysis}

이 분석 결과를 참고하여 지원자의 강점과 약점을 파악하고, 그에 맞는 맞춤형 질문을 생성해주세요.
"""

    prompt = f"""
당신은 전문적인 AI 면접관입니다. 아래 채용 공고 정보와 지원자의 포트폴리오 분석 결과를 종합하여 해당 직무에 적합한 면접 질문 3개를 생성해주세요.

=== 채용 공고 정보 ===
공고 제목: {post_title}
직무 설명: {post_description}
요구 기술: {programming_language}
인재상: {ideal_candidate}
근무 지역: {location}
연봉 범위: {salary_range}
모집 인원: {headcount}명{portfolio_section}

=== 질문 생성 지침 ===
1. **기술적 역량 질문**: 요구 기술과 관련된 구체적인 경험이나 지식을 파악할 수 있는 질문
2. **직무 적합성 질문**: 직무 설명과 인재상에 맞는 역량이나 경험을 확인할 수 있는 질문  
3. **개인적 역량 질문**: 소프트 스킬, 문제해결 능력, 팀워크, 리더십 등을 평가할 수 있는 질문

=== 질문 생성 기준 ===
- 각 질문은 구체적이고 답변하기 쉬우면서도 지원자의 역량을 정확히 파악할 수 있어야 함
- 공고의 요구사항과 인재상에 맞는 맞춤형 질문이어야 함
- 포트폴리오 분석 결과가 있다면, 그 내용을 참고하여 지원자의 강점을 살리거나 약점을 보완할 수 있는 질문을 포함해야 함
- 기술적 질문과 인성/역량 질문의 균형을 맞춰야 함
- 질문은 자연스럽고 대화하기 편한 톤으로 작성해야 함

=== 출력 형식 ===
질문 3개만 번호 없이 줄바꿈으로 구분해서 출력해주세요.
예시:
자기소개를 해주세요.
{programming_language} 기술에 대한 경험과 이해도를 설명해주세요.
팀 프로젝트에서의 협업 경험과 갈등 해결 사례를 설명해주세요.
"""

    try:
        response = get_openai_client().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "당신은 전문적인 AI 면접관입니다. 채용 공고 정보를 분석하여 적합한 면접 질문을 생성해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.3
        )
        
        questions_text = response.choices[0].message.content.strip()
        
        # 질문을 줄바꿈으로 분리하고 빈 줄 제거
        questions = [q.strip() for q in questions_text.split('\n') if q.strip()]
        
        if len(questions) < 3:
            raise RuntimeError("AI가 충분한 맞춤 질문을 생성하지 못했습니다.")
        
        # 최대 3개까지만 반환
        return questions[:3]
        
    except Exception as e:
        print(f"OpenAI 질문 생성 오류: {e}")
        raise RuntimeError("맞춤 면접 질문 생성에 실패했습니다.") from e


# ==========================================
# 면접예상질문 - 면접 준비용 예상질문 생성 API
# ==========================================

def generate_preparation_questions(post_title: str, post_description: str, 
                                  programming_language: str, ideal_candidate: str, 
                                  location: str, salary_range: str, headcount: int, 
                                  portfolio_analysis: str = "") -> List[str]:
    """면접 준비를 위한 예상질문 생성 (실제 면접질문과는 다른 일반적인 질문들)"""
    
    # 포트폴리오 분석 결과가 있는 경우 프롬프트에 포함
    portfolio_section = ""
    if portfolio_analysis and portfolio_analysis.strip():
        portfolio_section = f"""
=== 지원자 포트폴리오 분석 결과 ===
{portfolio_analysis}

이 분석 결과를 참고하여 지원자가 준비할 수 있는 일반적인 예상질문을 생성해주세요.
"""

    prompt = f"""
당신은 '근거 추적형 면접 코치'입니다. 지원자가 면접을 준비할 수 있도록 예상 질문 10개를 생성해주세요.

⭐ 목적: 면접 준비 도움 (실제 면접에서 나올 법한 유형의 일반적인 질문들)
⭐ 특징: 포트폴리오 분석의 확인된 근거와 아직 확인되지 않은 가설을 구분하는 질문
⭐ 다양성: 각 질문이 서로 다른 관점에서 지원자를 평가할 수 있도록 구성

=== 채용 공고 정보 ===
공고 제목: {post_title}
직무 설명: {post_description}
요구 기술: {programming_language}
인재상: {ideal_candidate}
근무 지역: {location}
연봉 범위: {salary_range}
모집 인원: {headcount}명{portfolio_section}

=== 예상질문 생성 기준 ===
1. **근거 검증 질문**: 분석 결과의 evidence, gaps, verification_plan, counterfactuals가 있다면 그 항목을 직접 확인하는 질문
2. **기술 깊이 질문**: 해당 기술 분야에서 실제 설계·트레이드오프를 확인하는 질문
3. **직무 적합성 질문**: 해당 직무에 대한 기본적인 이해와 동기를 확인하는 질문
4. **문제해결 능력**: 어려움을 극복한 경험이나 도전 사례 관련 질문
5. **협업 및 소통**: 팀워크나 의사소통 능력을 확인하는 질문
6. **성장 의지**: 학습 능력이나 자기계발에 대한 질문

=== 질문 생성 지침 ===
- 해당 직무/기술 분야에서 흔히 나오는 일반적인 질문
- 지원자가 미리 준비할 수 있는 예측 가능한 질문
- 너무 구체적이거나 특별하지 않은 범용적인 질문
- 포트폴리오 분석이 있다면 그를 바탕으로 한 일반적인 예상질문
- 실제 면접의 변별력을 훼손하지 않는 준비용 질문
- 분석 결과에 없는 사실을 후보자에게 이미 사실인 것처럼 전제하지 말 것
- 개인정보·출신·나이·성별·지역 등 직무와 무관한 속성을 묻지 말 것
- 질문 앞에 다음 목적 태그 중 하나를 붙일 것: [근거검증], [기술깊이], [문제해결], [협업], [성장]

⚠️ 주의사항: 실제 면접에서 나올 수 있는 깊이 있는 질문보다는 준비 단계에서 도움이 되는 기본적인 질문들로 구성

=== 출력 형식 ===
질문 10개를 번호 없이 줄바꿈으로 구분해서 출력해주세요.
각 질문은 서로 다른 영역(기술, 경험, 인성, 동기 등)을 다루도록 다양하게 구성해주세요. 단, 기술 질문과 직무 적합성에 대한 질문이 총 5문제로 구성되어야 합니다.
예시:
자기소개와 함께 이 직무에 관심을 갖게 된 계기를 말씀해주세요.
{programming_language} 기술을 사용한 프로젝트 경험이 있다면 간단히 소개해주세요.
우리 회사/직무에 대해 어떤 점이 가장 매력적으로 느껴지나요?
"""

    try:
        response = get_openai_client().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "당신은 면접 준비를 도와주는 AI 코치입니다. 지원자가 면접을 준비할 수 있도록 일반적이고 예상 가능한 질문을 생성해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        questions_text = response.choices[0].message.content.strip()
        
        # 질문을 줄바꿈으로 분리하고 빈 줄 제거
        questions = [q.strip() for q in questions_text.split('\n') if q.strip()]
        
        if len(questions) < 10:
            raise RuntimeError("AI가 충분한 맞춤 예상질문을 생성하지 못했습니다.")
        
        # 최대 10개까지만 반환
        return questions[:10]
        
    except Exception as e:
        print(f"예상질문 생성 오류: {e}")
        raise RuntimeError("맞춤 예상질문 생성에 실패했습니다.") from e

@app.post("/generate-questions", response_model=InterviewQuestionsResponse)
async def generate_questions_endpoint(
    post_title: str = Form(...),
    post_description: str = Form(...),
    programming_language: str = Form(...),
    ideal_candidate: str = Form(...),
    location: str = Form(...),
    salary_range: str = Form(""),
    headcount: int = Form(1),
    portfolio_analysis: str = Form("")
):
    """면접 질문 생성 API"""
    try:
        print(f"면접 질문 생성 요청: 기술={'있음' if programming_language else '없음'}, 분석={'있음' if portfolio_analysis else '없음'}")
        
        questions = generate_interview_questions(
            post_title, post_description, programming_language,
            ideal_candidate, location, salary_range, headcount, portfolio_analysis
        )
        
        print(f"생성된 질문: {len(questions)}개")
        
        return InterviewQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except Exception as e:
        print("면접 질문 생성 실패")
        return InterviewQuestionsResponse(
            success=False,
            error="맞춤 질문 생성에 실패했습니다. 입력 정보와 AI 서비스 상태를 확인한 뒤 다시 시도해주세요."
        )

@app.post("/generate-preparation-questions", response_model=InterviewQuestionsResponse)
async def generate_preparation_questions_endpoint(
    post_title: str = Form(...),
    post_description: str = Form(...),
    programming_language: str = Form(...),
    ideal_candidate: str = Form(...),
    location: str = Form(...),
    salary_range: str = Form(""),
    headcount: int = Form(1),
    portfolio_analysis: str = Form("")
):
    """면접 예상질문 생성 API (면접 준비용)"""
    try:
        print("면접 예상질문 생성 요청 수신")
        print(f"입력 상태: 공고={'있음' if post_title else '없음'}, 기술={'있음' if programming_language else '없음'}, 분석={'있음' if portfolio_analysis else '없음'}")
        
        # 필수 필드 검증
        if not post_title or not post_title.strip():
            return InterviewQuestionsResponse(
                success=False,
                error="post_title이 필요합니다"
            )
        
        if not programming_language or not programming_language.strip():
            return InterviewQuestionsResponse(
                success=False,
                error="programming_language가 필요합니다"
            )
        
        questions = generate_preparation_questions(
            post_title, post_description, programming_language,
            ideal_candidate, location, salary_range, headcount, portfolio_analysis
        )
        
        print(f"예상질문 생성 완료: {len(questions)}개")
        
        return InterviewQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except Exception as e:
        print("면접 예상질문 생성 실패")
        return InterviewQuestionsResponse(
            success=False,
            error="예상 질문 생성에 실패했습니다. 입력 정보와 AI 서비스 상태를 확인한 뒤 다시 시도해주세요."
        )

@app.get("/health")
async def health_check():
    """서비스 상태 확인"""
    return {
        "status": "healthy",
        "service": "interview-questions",
        "model": OPENAI_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

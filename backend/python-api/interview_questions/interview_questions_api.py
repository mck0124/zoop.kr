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

client = openai.OpenAI(api_key=OPENAI_API_KEY)

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
        response = client.chat.completions.create(
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
        return "AI 서버 연결에 문제가 발생했습니다."

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
        response = client.chat.completions.create(
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
        
        # 질문이 3개가 아니면 기본 질문으로 보완
        if len(questions) < 3:
            default_questions = [
                "자기소개를 해주세요.",
                "이 직무에 지원한 이유는 무엇인가요?",
                "가장 기억에 남는 프로젝트에 대해 설명해주세요."
            ]
            questions.extend(default_questions[len(questions):])
        
        # 최대 3개까지만 반환
        return questions[:3]
        
    except Exception as e:
        print(f"OpenAI 질문 생성 오류: {e}")
        # 오류 발생 시 기본 질문 반환
        return [
            "자기소개를 해주세요.",
            "이 직무에 지원한 이유는 무엇인가요?",
            "가장 기억에 남는 프로젝트에 대해 설명해주세요."
        ]


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
당신은 면접 준비를 도와주는 AI 코치입니다. 지원자가 면접을 준비할 수 있도록 예상 가능한 질문 10개를 생성해주세요.

⭐ 목적: 면접 준비 도움 (실제 면접에서 나올 법한 유형의 일반적인 질문들)
⭐ 특징: 어느 정도 유용하면서도 준비 가능한 기본 질문들
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
1. **기술 기초 질문**: 해당 기술 분야에서 자주 나오는 기본적인 기술 질문
2. **경험 관련 질문**: 포트폴리오나 경력을 바탕으로 한 경험 질문  
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
        response = client.chat.completions.create(
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
        
        # 질문이 10개가 아니면 기본 예상질문으로 보완
        if len(questions) < 10:
            default_preparation_questions = [
                "자기소개와 함께 이 직무에 지원한 동기를 말씀해주세요.",
                "본인의 기술적 강점과 경험에 대해 설명해주세요.",
                "우리 회사와 이 직무에 대해 어떻게 이해하고 계신가요?",
                "해당 기술 스택을 선택한 이유와 경험에 대해 말씀해주세요.",
                "가장 어려웠던 기술적 문제와 해결 과정을 설명해주세요.",
                "팀워크나 협업 경험 중 기억에 남는 사례가 있나요?",
                "개발자로서 본인의 성장 목표는 무엇인가요?",
                "최근에 관심 있게 학습하고 있는 기술이나 분야가 있나요?",
                "프로젝트에서 겪은 실패 경험과 배운 점이 있다면 말씀해주세요.",
                "우리 회사에서 어떤 기여를 하고 싶으신가요?"
            ]
            questions.extend(default_preparation_questions[len(questions):])
        
        # 최대 10개까지만 반환
        return questions[:10]
        
    except Exception as e:
        print(f"예상질문 생성 오류: {e}")
        # 오류 발생 시 기본 예상질문 반환
        return [
            "자기소개와 함께 이 직무에 지원한 동기를 말씀해주세요.",
            "본인의 기술적 강점과 경험에 대해 설명해주세요.",
            "우리 회사와 이 직무에 대해 어떻게 이해하고 계신가요?",
            "해당 기술 스택을 선택한 이유와 경험에 대해 말씀해주세요.",
            "가장 어려웠던 기술적 문제와 해결 과정을 설명해주세요.",
            "팀워크나 협업 경험 중 기억에 남는 사례가 있나요?",
            "개발자로서 본인의 성장 목표는 무엇인가요?",
            "최근에 관심 있게 학습하고 있는 기술이나 분야가 있나요?",
            "프로젝트에서 겪은 실패 경험과 배운 점이 있다면 말씀해주세요.",
            "우리 회사에서 어떤 기여를 하고 싶으신가요?"
        ]

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
        print(f"면접 질문 생성 요청:")
        print(f"- 공고 제목: {post_title}")
        print(f"- 요구 기술: {programming_language}")
        print(f"- 인재상: {ideal_candidate}")
        print(f"- 포트폴리오 분석 결과: {'있음' if portfolio_analysis else '없음'}")
        
        questions = generate_interview_questions(
            post_title, post_description, programming_language,
            ideal_candidate, location, salary_range, headcount, portfolio_analysis
        )
        
        print(f"생성된 질문: {questions}")
        
        return InterviewQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except Exception as e:
        print(f"면접 질문 생성 오류: {e}")
        return InterviewQuestionsResponse(
            success=False,
            error=f"질문 생성 중 오류가 발생했습니다: {e}"
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
        print("🔍 Python API: 면접 예상질문 생성 요청 받음")
        print("=== 받은 요청 데이터 상세 ===")
        print(f"post_title: '{post_title}' (type: {type(post_title)}, length: {len(post_title) if post_title else 'None'})")
        print(f"post_description: '{post_description}' (type: {type(post_description)}, length: {len(post_description) if post_description else 'None'})")
        print(f"programming_language: '{programming_language}' (type: {type(programming_language)}, length: {len(programming_language) if programming_language else 'None'})")
        print(f"ideal_candidate: '{ideal_candidate}' (type: {type(ideal_candidate)}, length: {len(ideal_candidate) if ideal_candidate else 'None'})")
        print(f"location: '{location}' (type: {type(location)}, length: {len(location) if location else 'None'})")
        print(f"salary_range: '{salary_range}' (type: {type(salary_range)}, length: {len(salary_range) if salary_range else 'None'})")
        print(f"headcount: {headcount} (type: {type(headcount)})")
        print(f"portfolio_analysis: '{portfolio_analysis}' (type: {type(portfolio_analysis)}, length: {len(portfolio_analysis) if portfolio_analysis else 'None'})")
        print("================================")
        
        # 필수 필드 검증
        if not post_title or not post_title.strip():
            print("❌ post_title이 비어있음")
            return InterviewQuestionsResponse(
                success=False,
                error="post_title이 필요합니다"
            )
        
        if not programming_language or not programming_language.strip():
            print("❌ programming_language가 비어있음")
            return InterviewQuestionsResponse(
                success=False,
                error="programming_language가 필요합니다"
            )
        
        if not ideal_candidate or not ideal_candidate.strip():
            print("⚠️  ideal_candidate가 비어있음 - 기본값으로 처리")
        
        if not location or not location.strip():
            print("⚠️  location이 비어있음 - 기본값으로 처리")
        
        print(f"면접 예상질문 생성 요청:")
        print(f"- 공고 제목: {post_title}")
        print(f"- 요구 기술: {programming_language}")
        print(f"- 인재상: {'있음' if ideal_candidate and ideal_candidate.strip() else '없음 (빈 값)'}")
        print(f"- 위치: {'있음' if location and location.strip() else '없음 (빈 값)'}")
        print(f"- 포트폴리오 분석 결과: {'있음' if portfolio_analysis and portfolio_analysis.strip() else '없음'}")
        
        questions = generate_preparation_questions(
            post_title, post_description, programming_language,
            ideal_candidate, location, salary_range, headcount, portfolio_analysis
        )
        
        print(f"✅ 생성된 예상질문 개수: {len(questions)}")
        print(f"✅ 생성된 예상질문: {questions}")
        
        return InterviewQuestionsResponse(
            success=True,
            questions=questions
        )
        
    except Exception as e:
        print(f"❌ 면접 예상질문 생성 오류: {e}")
        print(f"❌ 오류 타입: {type(e)}")
        import traceback
        print(f"❌ 스택 트레이스: {traceback.format_exc()}")
        return InterviewQuestionsResponse(
            success=False,
            error=f"예상질문 생성 중 오류가 발생했습니다: {e}"
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

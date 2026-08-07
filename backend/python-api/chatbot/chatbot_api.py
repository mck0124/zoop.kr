import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import PyPDF2
import openai

# .env에서 API 키와 PDF 경로, 모델명 등 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PDF_PATH = os.getenv("PDF_PATH", "채용_관리자_가이드.pdf")
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

def load_pdf_text(pdf_path):
    try:
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"
        return text
    except Exception as e:
        print(f"[PDF Load Error] {e}")
        return "[PDF 파일을 불러오지 못했습니다]"

PDF_TEXT = load_pdf_text(PDF_PATH)

# --------- 중복 제거용 함수 ----------
def call_openai_chat(messages, max_tokens=800, temperature=0.3):
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
        return {"answer": "AI 서버 연결에 문제가 발생했습니다."}

def build_messages(system_prompt, history, user_input):
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})
    return messages

# -------------------------------------

class ChatRequest(BaseModel):
    history: list  # [{"role": "user"|"assistant", "content": "..."}]
    user_input: str
    lang: str = "ko"

class IdealCandidateRequest(BaseModel):
    history: list
    user_input: str
    recruit_filters: dict | None = None

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    lang = req.lang if req.lang in ["en", "ko"] else "ko"
    # 언어별 프롬프트
    if lang == "en":
        system_prompt = (
            "You are 'ZOOP', an AI chatbot for a global recruitment platform. "
            "Below is the main content of the company introduction PDF. "
            "Always answer based on the PDF content below, kindly and confidently. "
            "Also, suggest 3-6 example follow-up questions in English between <EXAMPLES> and <END> tags."
            "\n\n----- PDF Guide -----\n"
            + PDF_TEXT[:8000]
            + "\n----------------------"
        )
    else:
        system_prompt = (
            "너는 'ZOOP'라는 AI 채용플랫폼 챗봇이야. "
            "아래는 회사 안내 PDF의 주요 내용이야. "
            "모든 답변은 PDF(아래 텍스트)에서 최대한 근거를 들어 요약해서 친절하고 신뢰감 있게 답변해. "
            "추가로 사용자가 질문할 만한 버튼 예시도 3~6개 정도 <EXAMPLES>~<END> 사이에 한글로 출력해줘."
            "\n\n----- PDF 안내 -----\n"
            + PDF_TEXT[:8000]
            + "\n----------------------"
        )
    messages = build_messages(system_prompt, req.history, req.user_input)
    answer = call_openai_chat(messages, max_tokens=600, temperature=0.18)
    return {"answer": answer}

@app.post("/ideal-candidate-chat")
async def ideal_candidate_chat_endpoint(req: IdealCandidateRequest):
    try:
        filters_str = ""
        if req.recruit_filters:
            for k, v in req.recruit_filters.items():
                filters_str += f"{k}: {v}\n"
        
        system_prompt = (
            "너는 전문적인 인재상 작성 AI 어시스턴트야. "
            "아래 지침을 꼭 지켜:\n"
            "1. 사용자가 한 문장 또는 단어만 입력해도, 그 내용이 인재상에 들어갈 만한 특성, 역량, 성향, 직무, 경험, 키워드 등과 조금이라도 관련이 있으면 반드시 인재상 요약(<SUMMARY>)과 예시(<EXAMPLES>)를 작성해.\n"
            "2. 예시: '리더십 경험', '팀워크', '책임감', '데이터 기반 의사결정', '창의성', '성실함', '주도적', '배려심' 등 키워드, 문장, 특성, 경험 등 전부 인재상 작성에 포함될 수 있다면 무조건 작성해.\n"
            "3. 단, 사용자의 입력이 명확히 인재상과 무관한 일상 잡담(예: '안녕', 'ㅎㅇ', '오늘 날씨 좋다', '밥 먹었어?', 'ㅋㅋ' 등)이면 아래 안내문구만 출력해:\n"
            "'인재상에 대한 요청만 입력해 주세요. 예: 팀워크를 중시하는 인재를 원합니다, 데이터 분석 경험자를 찾고 싶어요 등'\n"
            "4. 이때는 <SUMMARY>나 <EXAMPLES>는 절대 포함하지 마!\n"
            "5. 입력이 애매하거나, 인재상 주제와 약간이라도 관련 있다면 반드시 인재상 요약(<SUMMARY>)을 작성하는 쪽으로 답변해.\n"
            "\n--- 실제 답변 작성 형식 ---\n"
            "1. 간단한 대화형 안내문구(예: '요청을 반영한 인재상을 작성해드리겠습니다. 추가 요청이나 변경 사항이 있으면 말씀해 주세요.')\n"
            "2. <SUMMARY> 태그 안에만 실제 인재상 요약을 자세히 작성 (항목별로 보기 좋게 정리)\n"
            "3. <EXAMPLES> 태그 안에는 회사가 원하는 인재상 예시 문구(특성, 가치관, 역량 등)를 3~6개 한글로 '||'로 구분해 넣어(<END>으로 닫음). 반드시 문장/키워드/특성 형태로만, 질문 형태는 절대 넣지 마라.\n"
            "\n절대 주의: <SUMMARY> 태그 밖에는 인재상 본문, 예시, 항목, 요약 등 인재상 관련 내용을 절대 넣지 마라. 안내문구 외에는 인재상 관련 내용이 태그 밖에 있으면 안 된다.\n"
            "\n인재상 요약은 다음 항목으로 정리해:\n"
            "- 직무 및 역할\n"
            "- 필수 기술 스택\n"
            "- 경력 및 경험\n"
            "- 성격 및 소프트 스킬\n"
            "- 업무 스타일\n"
            "- 회사 문화 적합성\n"
            "\n----- 채용 정보 -----\n"
            + (filters_str or "(채용정보 없음)") +
            "\n--------------------"
        )

        
        messages = build_messages(system_prompt, req.history, req.user_input)
        answer = call_openai_chat(messages, max_tokens=800, temperature=0.3)
        return {"answer": answer}
        
    except Exception as e:
        print(f"[Error in ideal-candidate-chat] {e}")
        return {"answer": "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요."}

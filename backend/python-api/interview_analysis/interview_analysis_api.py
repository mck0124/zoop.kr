import os
import requests
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import whisper
import re
from typing import List, Optional
import threading
import time
from fastapi.concurrency import run_in_threadpool
import yt_dlp

# .env에서 API 키 로드
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SPRING_API_URL = os.getenv("SPRING_API_URL", "http://localhost:8081")

client = None

app = FastAPI()
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

whisper_model = None
whisper_model_lock = threading.Lock()

def get_openai_client():
    global client
    if client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
    return client

def get_whisper_model():
    """Load Whisper on first analysis so startup and health checks stay fast."""
    global whisper_model
    if whisper_model is None:
        with whisper_model_lock:
            if whisper_model is None:
                print("Loading Whisper model...")
                whisper_model = whisper.load_model("base")
                print("Whisper model loaded successfully!")
    return whisper_model

class InterviewAnalysisRequest(BaseModel):
    schedule_id: int
    job_candidate_id: int

class InterviewAnalysisResponse(BaseModel):
    success: bool
    analysis_id: Optional[int] = None
    score: Optional[float] = None
    analysis_data: Optional[str] = None
    error: Optional[str] = None

def _quote_is_in_transcripts(quote: str, transcripts: List[str]) -> bool:
    """Keep evidence honest: an AI-generated quote must be found in source answers."""
    normalized_quote = re.sub(r"\s+", " ", quote).strip().casefold()
    if not normalized_quote:
        return False
    return any(normalized_quote in re.sub(r"\s+", " ", transcript or "").strip().casefold() for transcript in transcripts)

def extract_audio_from_video(video_path: str) -> str:
    """비디오에서 오디오 추출"""
    try:
        # YouTube 링크인지 확인
        if video_path.startswith(('http://', 'https://')):
            print(f"Downloading video from: {video_path}")
            
            # 임시 디렉토리에 비디오 다운로드
            with tempfile.TemporaryDirectory() as temp_dir:
                ydl_opts = {
                    'format': 'best[ext=mp4]/best',
                    'outtmpl': os.path.join(temp_dir, '%(id)s.%(ext)s'),
                    'quiet': True,
                }
                
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(video_path, download=True)
                    video_file = ydl.prepare_filename(info)
                
                # 다운로드된 비디오 파일로 Whisper 실행
                result = get_whisper_model().transcribe(video_file, language="ko")
                return result["text"]
        else:
            # 로컬 파일인 경우 - FFmpeg 없이 직접 Whisper 사용
            print(f"Direct Whisper processing for: {video_path}")
            result = get_whisper_model().transcribe(video_path, language="ko")
            return result["text"]
    except Exception as e:
        print(f"Audio extraction error: {e}")
        # FFmpeg 오류인 경우 대체 방법 시도
        try:
            print("FFmpeg 오류 발생, 대체 방법으로 시도...")
            # 직접 Whisper로 비디오 파일 처리 (오디오 추출 없이)
            result = get_whisper_model().transcribe(video_path, language="ko")
            return result["text"]
        except Exception as e2:
            print(f"대체 방법도 실패: {e2}")
            return ""

def analyze_interview_responses(transcripts: List[str], questions: List[str], post_title: str = "", post_description: str = "", ideal_candidate: str = "") -> dict:
    """OpenAI를 사용하여 면접 답변 분석 (공고/인재상 정보 포함, 구조화된 JSON 반환)"""
    combined_transcript = "\n\n".join([
        f"질문 {i+1}: {questions[i]}\n답변: {transcript}"
        for i, transcript in enumerate(transcripts)
    ])
    
    prompt = f"""
이 지원자의 공고 정보와 인재상은 다음과 같습니다:
공고 제목: {post_title}
공고 설명: {post_description}
인재상: {ideal_candidate}

아래는 AI 면접에서 나온 질문과 답변입니다. 각 답변을 종합적으로 분석해주세요.

{combined_transcript}

다음 기준으로 분석해주세요:

1. **전문성 (25점)**: 기술적 지식과 경험의 깊이
2. **의사소통 능력 (20점)**: 명확하고 논리적인 설명 능력
3. **문제해결 능력 (20점)**: 구체적이고 실용적인 해결책 제시
4. **자신감과 태도 (15점)**: 자신감 있는 답변과 긍정적 태도
5. **경험의 구체성 (20점)**: 구체적인 사례와 경험 제시

각 항목별로 아래 JSON 포맷에 맞춰서, 점수, 실제 답변에서 확인한 근거, 좋은 예시, 아쉬운 예시, 개선점, 확신도를 작성해주세요. 근거가 없는 내용은 추정하지 말고 '확인되지 않음'으로 표시하세요. 다른 지원자와의 비교나 모집단 평균은 제공된 데이터가 없으므로 생성하지 마세요.

반드시 아래 JSON 포맷으로만 출력하세요:
{{
  "categories": [
    {{
      "name": "전문성",
      "score": ..., "max_score": 25,
      "reason": "...",
      "good_example": "...",
      "bad_example": "...",
      "improvement": "...",
      "evidence": [{"source":"answer|question|missing", "answer_index":1, "quote":"답변에서 그대로 확인되는 짧은 구절", "claim":"실제 답변에서 확인한 내용", "confidence":0.0}],
      "confidence": 0.0,
      "tags": ["...", "..."]
    }},
    ...
  ],
  "total_feedback": {{
    "summary": "...",
    "headhunting_point": "...",
    "recommendation": "...",
    "limitations": ["이 분석만으로 확인할 수 없는 사항"],
    "tags": ["...", "..."]
  }},
  "visualization": {{
    "category_scores": [...],
    "category_labels": ["전문성", "의사소통", "문제해결", "자신감", "경험의 구체성"],
    "score_distribution": {{
      "current": ...
    }}
  }}
}}
"""

    try:
        response = get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 헤드헌터이자 면접 전문가입니다. 반드시 위 JSON 포맷만 출력하세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        analysis_json = response.choices[0].message.content
        try:
            analysis_data = json.loads(analysis_json)
            max_scores = {"전문성": 25, "의사소통": 20, "의사소통 능력": 20, "문제해결": 20, "문제해결 능력": 20, "자신감": 15, "자신감과 태도": 15, "경험의 구체성": 20}
            categories = analysis_data.get("categories", [])
            if not isinstance(categories, list):
                categories = []
            normalized_categories = []
            for category in categories:
                if not isinstance(category, dict):
                    continue
                name = str(category.get("name", "평가 항목"))
                maximum = int(category.get("max_score") or max_scores.get(name, 20))
                raw_score = category.get("score", 0)
                try:
                    normalized_score = max(0, min(maximum, float(raw_score)))
                except (TypeError, ValueError):
                    normalized_score = 0
                category["name"] = name
                category["max_score"] = maximum
                category["score"] = normalized_score
                category.setdefault("reason", "확인된 답변 근거가 부족합니다.")
                raw_evidence = category.get("evidence", [])
                normalized_evidence = []
                for item in raw_evidence if isinstance(raw_evidence, list) else []:
                    if not isinstance(item, dict):
                        continue
                    quote = str(item.get("quote", "")).strip()
                    claim = str(item.get("claim", "확인된 근거 없음")).strip()
                    source = str(item.get("source", "missing")).strip()
                    answer_index = item.get("answer_index")
                    try:
                        answer_index = int(answer_index) if answer_index is not None else None
                    except (TypeError, ValueError):
                        answer_index = None
                    try:
                        confidence = float(item.get("confidence", 0) or 0)
                    except (TypeError, ValueError):
                        confidence = 0.0
                    if quote and not _quote_is_in_transcripts(quote, transcripts):
                        source = "unverified"
                        confidence *= 0.5
                    normalized_evidence.append({
                        "source": source,
                        "answer_index": answer_index,
                        "quote": quote,
                        "claim": claim,
                        "confidence": max(0.0, min(1.0, confidence)),
                    })
                category["evidence"] = normalized_evidence or [{"source": "missing", "answer_index": None, "quote": "", "claim": "확인된 근거 없음", "confidence": 0.0}]
                try:
                    category["confidence"] = max(0.0, min(1.0, float(category.get("confidence", 0) or 0)))
                except (TypeError, ValueError):
                    category["confidence"] = 0.0
                normalized_categories.append(category)
            analysis_data["categories"] = normalized_categories
            score = sum(category["score"] for category in normalized_categories)
            analysis_data.setdefault("total_feedback", {})
            analysis_data["total_feedback"].setdefault("limitations", ["영상의 표정·목소리만으로 성격이나 잠재력을 단정하지 않습니다.", "AI 분석만으로 최종 채용 결정을 내릴 수 없습니다."])
            labels = [category["name"] for category in normalized_categories]
            analysis_data["visualization"] = {
                "category_scores": [category["score"] for category in normalized_categories],
                "category_labels": labels,
                "score_distribution": {"current": score}
            }
        except Exception as e:
            analysis_data = {"error": f"JSON 파싱 오류: {e}", "raw": analysis_json}
            score = 0.0
        return {
            "analysis": analysis_data,
            "score": score,
            "transcripts": transcripts
        }
    except Exception as e:
        print(f"OpenAI analysis error: {e}")
        return {
            "analysis": {"error": f"분석 중 오류가 발생했습니다: {e}"},
            "score": 0.0,
            "transcripts": transcripts
        }

def save_analysis_to_spring(job_candidate_id: int, analysis_data: str, score: float, analysis_type: str = "interview", video_id: Optional[int] = None) -> Optional[int]:
    """Spring 백엔드에 분석 결과 저장"""
    try:
        payload = {
            "analysisType": analysis_type,
            "jobCandidateId": job_candidate_id,
            "analysisData": analysis_data,
            "analysisScore": score
        }
        
        if video_id:
            payload["videoId"] = video_id
        
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

def update_analysis_status(schedule_id: int, status: str):
    """분석 상태 업데이트"""
    try:
        response = requests.put(
            f"{SPRING_API_URL}/api/interview-schedules/{schedule_id}/analysis-status",
            params={"status": status},
            timeout=10
        )
        if response.status_code == 200:
            print(f"[INFO] Updated analysis status to {status} for schedule {schedule_id}")
        else:
            print(f"[WARN] Failed to update analysis status: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception updating analysis status: {e}")

@app.post("/analyze-interview", response_model=InterviewAnalysisResponse)
async def analyze_interview(
    schedule_id: int = Form(...),
    job_candidate_id: int = Form(...),
    post_title: str = Form("") ,
    post_description: str = Form("") ,
    ideal_candidate: str = Form("")
):
    """면접 영상 분석 API"""
    try:
        print(f"Starting interview analysis for schedule_id: {schedule_id}, job_candidate_id: {job_candidate_id}")
        print(f"공고 정보: title={post_title}, description={post_description}, ideal_candidate={ideal_candidate}")
        
        # 1. Spring API에서 해당 면접의 영상 정보 조회
        videos_response = requests.get(
            f"{SPRING_API_URL}/api/interview-videos/schedule/{schedule_id}",
            timeout=30
        )
        
        if videos_response.status_code != 200:
            return InterviewAnalysisResponse(
                success=False,
                error=f"영상 정보 조회 실패: {videos_response.status_code}"
            )
        
        videos = videos_response.json()
        if not videos:
            print(f"[WARN] 분석할 영상이 없습니다. schedule_id: {schedule_id}")
            return InterviewAnalysisResponse(
                success=False,
                error="분석할 영상이 없습니다. 면접이 완료되고 영상이 업로드된 후 다시 시도해주세요."
            )
        
        print(f"Found {len(videos)} videos to analyze")
        
        # 2. 각 영상에서 텍스트 추출
        transcripts = []
        questions = []
        
        for video in sorted(videos, key=lambda x: x.get("questionNumber", 0)):
            video_url = video.get("videoFilePath")
            question_content = video.get("questionContent", f"질문 {video.get('questionNumber', 0)}")
            
            if not video_url:
                continue
                
            print(f"Processing video: {video_url}")
            
            try:
                transcript = extract_audio_from_video(video_url)
                transcripts.append(transcript)
                questions.append(question_content)
                print(f"Extracted transcript: {transcript[:100]}...")
                
            except Exception as e:
                print(f"Error processing video {video_url}: {e}")
                transcripts.append("")
                questions.append(question_content)
        
        if not transcripts:
            return InterviewAnalysisResponse(
                success=False,
                error="텍스트 추출에 실패했습니다."
            )
        
        # 3. OpenAI로 분석
        print("Starting OpenAI analysis...")
        analysis_result = analyze_interview_responses(transcripts, questions, post_title, post_description, ideal_candidate)
        
        # 4. Spring 백엔드에 결과 저장
        print("Saving analysis result to Spring...")
        # 분석 결과를 Spring 백엔드에 저장
        analysis_id = save_analysis_to_spring(job_candidate_id, json.dumps(analysis_result), analysis_result["score"])
        
        if analysis_id:
            # job_cand_progress 테이블 업데이트
            update_response = requests.put(
                f"{SPRING_API_URL}/api/job-cand-progress/{job_candidate_id}/interview-analysis",
                json={"aiInterviewAnalysisId": analysis_id},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if update_response.status_code != 200:
                print(f"Warning: Failed to update job_cand_progress: {update_response.status_code}")
            
            # 분석 상태를 'done'으로 업데이트
            update_analysis_status(schedule_id, "done")
        
        return InterviewAnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            score=analysis_result["score"],
            analysis_data=json.dumps(analysis_result)  # dict를 JSON 문자열로 변환
        )
        
    except Exception as e:
        print(f"Interview analysis error: {e}")
        return InterviewAnalysisResponse(
            success=False,
            error=f"분석 중 오류가 발생했습니다: {str(e)}"
        )

@app.post("/analyze-video", response_model=InterviewAnalysisResponse)
async def analyze_single_video(video_id: int = Form(...)):
    """개별 영상 분석 API"""
    try:
        print(f"Starting single video analysis for video_id: {video_id}")
        
        # 1. Spring API에서 해당 영상 정보 조회
        video_response = requests.get(
            f"{SPRING_API_URL}/api/interview-videos/{video_id}",
            timeout=30
        )
        
        if video_response.status_code != 200:
            return InterviewAnalysisResponse(
                success=False,
                error=f"영상 정보 조회 실패: {video_response.status_code}"
            )
        
        video = video_response.json()
        video_url = video.get("videoFilePath")
        question_content = video.get("questionContent", f"질문 {video.get('questionNumber', 0)}")
        schedule_id = video.get("scheduleId")
        
        if not video_url:
            return InterviewAnalysisResponse(
                success=False,
                error="영상 URL이 없습니다."
            )
        
        print(f"Processing video: {video_url}")
        
        # 2. 영상에서 텍스트 추출
        try:
            # YouTube 링크를 직접 처리
            transcript = extract_audio_from_video(video_url)
            print(f"Extracted transcript: {transcript[:100]}...")
            
        except Exception as e:
            print(f"Error processing video {video_url}: {e}")
            transcript = ""
        
        if not transcript:
            return InterviewAnalysisResponse(
                success=False,
                error="텍스트 추출에 실패했습니다."
            )
        
        # 3. OpenAI로 개별 영상 분석
        print("Starting OpenAI analysis for single video...")
        analysis_result = analyze_single_video_response(transcript, question_content)
        
        # 4. Spring 백엔드에 결과 저장 (video_id 포함)
        print("Saving video analysis result to Spring...")
        analysis_id = save_analysis_to_spring(
            video.get("jobCandidateId", 0),  # job_candidate_id가 없으면 0
            json.dumps(analysis_result),
            analysis_result["score"],
            "interview_video",
            video_id
        )
        
        return InterviewAnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            score=analysis_result["score"],
            analysis_data=json.dumps(analysis_result)  # dict를 JSON 문자열로 변환
        )
        
    except Exception as e:
        print(f"Single video analysis error: {e}")
        return InterviewAnalysisResponse(
            success=False,
            error=f"분석 중 오류가 발생했습니다: {str(e)}"
        )

def analyze_single_video_response(transcript: str, question: str) -> dict:
    """개별 영상 답변 분석 (구조화된 JSON 반환)"""
    prompt = f"""
다음은 AI 면접에서 나온 질문과 답변입니다. 이 답변을 분석해주세요.

질문: {question}
답변: {transcript}

다음 기준으로 분석해주세요:

1. **전문성 (25점)**: 기술적 지식과 경험의 깊이
2. **의사소통 능력 (20점)**: 명확하고 논리적인 설명 능력
3. **문제해결 능력 (20점)**: 구체적이고 실용적인 해결책 제시
4. **자신감과 태도 (15점)**: 자신감 있는 답변과 긍정적 태도
5. **경험의 구체성 (20점)**: 구체적인 사례와 경험 제시

각 항목별로 아래 JSON 포맷에 맞춰서, 점수, 근거, 좋은 예시, 아쉬운 예시, 개선점, 다른 지원자와의 비교, 카테고리별 태그를 반드시 포함해서 작성해주세요. 전체 요약, 헤드헌팅 추천 포인트, 태그, 시각화용 점수 배열, 평균/상위10% 비교도 포함해주세요.

반드시 아래 JSON 포맷으로만 출력하세요:
{{
  "categories": [
    {{
      "name": "전문성",
      "score": ..., "max_score": 25,
      "reason": "...",
      "good_example": "...",
      "bad_example": "...",
      "improvement": "...",
      "compare_to_others": "...",
      "tags": ["...", "..."]
    }},
    ...
  ],
  "total_feedback": {{
    "summary": "...",
    "headhunting_point": "...",
    "recommendation": "...",
    "tags": ["...", "..."]
  }},
  "visualization": {{
    "category_scores": [...],
    "category_labels": ["전문성", "의사소통", "문제해결", "자신감", "경험의 구체성"],
    "score_distribution": {{
      "current": ..., "average": ..., "top_10_percent": ...
    }}
  }}
}}
"""
    try:
        response = get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 헤드헌터이자 면접 전문가입니다. 반드시 위 JSON 포맷만 출력하세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        analysis_json = response.choices[0].message.content
        try:
            analysis_data = json.loads(analysis_json)
            score = sum([cat.get("score", 0) for cat in analysis_data.get("categories", [])])
        except Exception as e:
            analysis_data = {"error": f"JSON 파싱 오류: {e}", "raw": analysis_json}
            score = 0.0
        return {
            "analysis": analysis_data,
            "score": score,
            "transcript": transcript,
            "question": question
        }
    except Exception as e:
        print(f"OpenAI analysis error: {e}")
        return {
            "analysis": {"error": f"분석 중 오류가 발생했습니다: {e}"},
            "score": 0.0,
            "transcript": transcript,
            "question": question
        }

def auto_analyze_pending():
    while True:
        try:
            print(f"[AUTO] PENDING 면접 스케줄 확인 중... (URL: {SPRING_API_URL}/api/interview-schedules/pending)")
            response = requests.get(f"{SPRING_API_URL}/api/interview-schedules/pending")
            print(f"[AUTO] 응답 상태 코드: {response.status_code}")
            
            if response.status_code != 200:
                print(f"[AUTO] API 호출 실패: {response.text}")
                time.sleep(60)
                continue
                
            schedules = response.json()
            print(f"[AUTO] PENDING 면접 스케줄 발견: {len(schedules)}개")
            
            for schedule in schedules:
                print(f"[AUTO] 스케줄 데이터: {schedule}")
                schedule_id = schedule.get('aiInterviewScheduleId')
                job_candidate_id = schedule.get('jobCandidateId')
                
                print(f"[AUTO] 추출된 ID - schedule_id: {schedule_id}, job_candidate_id: {job_candidate_id}")
                
                if schedule_id and job_candidate_id:
                    # 이미 분석이 완료되었는지 확인
                    try:
                        progress_response = requests.get(
                            f"{SPRING_API_URL}/api/job-cand-progress/{job_candidate_id}",
                            timeout=10
                        )
                        if progress_response.status_code == 200:
                            progress = progress_response.json()
                            if progress.get('aiInterviewAnalysisId'):
                                print(f"[AUTO] 이미 분석 완료됨: schedule_id={schedule_id}, analysis_id={progress.get('aiInterviewAnalysisId')}")
                                continue
                    except Exception as e:
                        print(f"[AUTO] 진행상황 확인 오류: {e}")
                    
                    print(f"[AUTO] 분석 시작: schedule_id={schedule_id}, job_candidate_id={job_candidate_id}")
                    # 동기적으로 analyze_interview 함수 호출
                    try:
                        # analyze_interview는 async 함수이므로 직접 호출
                        import asyncio
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        result = loop.run_until_complete(analyze_interview(schedule_id, job_candidate_id))
                        loop.close()
                        print(f"[AUTO] 분석 완료: {result}")
                        
                        # 분석 실패 시 상태 업데이트 (영상이 없는 경우는 제외)
                        if not result.success:
                            error_msg = result.error or ""
                            if "분석할 영상이 없습니다" in error_msg:
                                print(f"[AUTO] 영상이 없어서 분석 대기 중: schedule_id={schedule_id}")
                                # 영상이 없을 때는 pending 상태 유지 (재시도 가능)
                            else:
                                update_analysis_status(schedule_id, "failed")
                                print(f"[AUTO] 분석 실패로 상태를 'failed'로 업데이트: schedule_id={schedule_id}")
                            
                    except Exception as e:
                        print(f"[AUTO] 분석 오류: {e}")
                        # 분석 중 오류 발생 시 상태를 'failed'로 업데이트
                        update_analysis_status(schedule_id, "failed")
                        print(f"[AUTO] 분석 오류로 상태를 'failed'로 업데이트: schedule_id={schedule_id}")
            time.sleep(60)  # 1분마다 반복
        except Exception as e:
            print(f"[AUTO] Auto analysis error: {e}")
            time.sleep(60)

@app.on_event("startup")
def start_auto_analyze():
    threading.Thread(target=auto_analyze_pending, daemon=True).start()

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "service": "interview-analysis",
        "openai_configured": bool(OPENAI_API_KEY),
        "whisper_loaded": whisper_model is not None,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

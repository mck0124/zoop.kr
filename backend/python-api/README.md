# ZOOP Python API Services

ZOOP 백엔드의 Python API 서비스들을 관리하는 디렉토리입니다.

## 🚀 FastAPI + Uvicorn 서비스

### Interview Analysis API (포트 8002)
- **기술**: FastAPI + Uvicorn
- **기능**: AI 면접 영상 분석 및 평가
- **실행**: `python -m uvicorn interview_analysis_api:app --host 0.0.0.0 --port 8002 --reload`
- **API 문서**: http://localhost:8002/docs

### Portfolio Matching API (포트 8003)
- **기술**: FastAPI + Uvicorn
- **기능**: 포트폴리오 분석 및 채용공고 매칭
- **실행**: `python -m uvicorn portfolio_matching_api:app --host 0.0.0.0 --port 8003 --reload`
- **API 문서**: http://localhost:8003/docs

## 🔧 Flask 서비스 (기존)

### Chatbot API (포트 5000)
- **기술**: Flask
- **기능**: AI 챗봇 서비스
- **실행**: `python chatbot_api.py`

### GitHub Search API (포트 5001)
- **기술**: Flask
- **기능**: GitHub 프로필 검색 및 분석
- **실행**: `python main.py`

### Interview Questions API (포트 5002)
- **기술**: Flask
- **기능**: AI 면접 질문 생성
- **실행**: `python interview_questions_api.py`

### OCR API (포트 5003)
- **기술**: Flask
- **기능**: 문서 OCR 처리
- **실행**: `python ocr_api.py`

## 📦 설치 및 실행

### 1. 의존성 설치

각 서비스 디렉토리에서 requirements.txt 설치:

```bash
# Interview Analysis API
cd interview_analysis
pip install -r requirements.txt

# Portfolio Matching API
cd ../portfolio_matching
pip install -r requirements.txt

# 기타 Flask 서비스들
cd ../chatbot
pip install -r requirements.txt
```

### 2. 환경 변수 설정

각 서비스 디렉토리에 `.env` 파일 생성:

```bash
# .env 파일 예시
OPENAI_API_KEY=your_openai_api_key_here
SPRING_API_URL=http://localhost:8081
```

### 3. 서비스 실행

#### 전체 서비스 한 번에 실행:
```bash
./start_services.sh
```

#### 개별 서비스 실행:

**FastAPI 서비스:**
```bash
# Interview Analysis API
cd interview_analysis
python -m uvicorn interview_analysis_api:app --host 0.0.0.0 --port 8002 --reload

# Portfolio Matching API
cd ../portfolio_matching
python -m uvicorn portfolio_matching_api:app --host 0.0.0.0 --port 8003 --reload
```

**Flask 서비스:**
```bash
# Chatbot API
cd chatbot
python chatbot_api.py

# GitHub Search API
cd ../github_search
python main.py

# Interview Questions API
cd ../interview_questions
python interview_questions_api.py

# OCR API
cd ../../ocr
python ocr_api.py
```

### 4. 서비스 중지

```bash
./stop_services.sh
```

## 🔍 API 문서

### FastAPI 서비스 (자동 생성)
- Interview Analysis API: http://localhost:8002/docs
- Portfolio Matching API: http://localhost:8003/docs

### Flask 서비스 (수동 문서)
각 서비스의 소스 코드에서 엔드포인트 확인

## 📊 서비스 상태 확인

```bash
# 헬스 체크
curl http://localhost:8002/health  # Interview Analysis API
curl http://localhost:8003/health  # Portfolio Matching API
curl http://localhost:5000/health  # Chatbot API
curl http://localhost:5001/health  # GitHub Search API
curl http://localhost:5002/health  # Interview Questions API
curl http://localhost:5003/health  # OCR API
```

## 🆕 FastAPI + Uvicorn 장점

### 성능 향상
- **비동기 처리**: asyncio 기반으로 동시 요청 처리 성능 향상
- **더 빠른 응답**: Flask 대비 더 빠른 요청 처리 속도
- **메모리 효율성**: 더 적은 메모리 사용량

### 개발 편의성
- **자동 API 문서**: Swagger UI 자동 생성 (/docs)
- **타입 검증**: Pydantic 모델로 자동 타입 검증
- **OpenAPI 표준**: 표준 API 문서 자동 생성

### 확장성
- **비동기 엔드포인트**: async/await 지원
- **미들웨어**: CORS, 인증 등 미들웨어 쉽게 추가
- **의존성 주입**: FastAPI의 의존성 주입 시스템 활용

## 🔄 마이그레이션 가이드

기존 Flask 서비스를 FastAPI로 마이그레이션하려면:

1. **의존성 변경**:
   ```bash
   # requirements.txt
   fastapi==0.104.1
   uvicorn==0.24.0
   pydantic==2.5.0
   ```

2. **코드 변경**:
   ```python
   # Flask → FastAPI
   from flask import Flask, request, jsonify
   app = Flask(__name__)
   
   @app.route('/api/endpoint', methods=['POST'])
   def endpoint():
       data = request.get_json()
       return jsonify({'result': data})
   ```

   ```python
   # FastAPI
   from fastapi import FastAPI, HTTPException
   from pydantic import BaseModel
   
   app = FastAPI()
   
   class RequestModel(BaseModel):
       field: str
   
   @app.post('/api/endpoint')
   async def endpoint(data: RequestModel):
       return {'result': data.field}
   ```

3. **실행 변경**:
   ```bash
   # Flask
   python app.py
   
   # FastAPI
   python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

## 🐛 문제 해결

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8002
lsof -i :8003

# 프로세스 강제 종료
kill -9 <PID>
```

### 의존성 문제
```bash
# 가상환경 재생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 로그 확인
```bash
# 서비스별 로그 확인
tail -f interview_analysis/logs.txt
tail -f portfolio_matching/logs.txt
```

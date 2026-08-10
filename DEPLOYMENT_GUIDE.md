# Zoop 프로젝트 CloudType 배포 가이드

## 📋 배포 순서

### 1. 프론트엔드 배포 (React)
1. CloudType에서 새 프로젝트 생성
2. GitHub 레포지토리 연결: `https://github.com/mck0124/zoop.kr.git`
3. **빌드 설정**:
   - 빌드 명령어: `cd frontend && npm install && npm run build`
   - 출력 디렉토리: `frontend/build`
4. **환경 변수 설정**:
   - `REACT_APP_API_URL`: 백엔드 URL

### 2. 백엔드 배포 (Spring Boot + Oracle 11)
1. CloudType에서 새 프로젝트 생성
2. GitHub 레포지토리 연결: `https://github.com/mck0124/zoop.kr.git`
3. **빌드 설정**:
   - 빌드 명령어: `cd backend && ./mvnw clean package -DskipTests`
   - 출력 파일: `backend/target/backend-0.0.1-SNAPSHOT.jar`
4. **실행 명령어**: `java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod`
5. **환경 변수 설정** (CloudType 대시보드에서):
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DATABASE_URL`: `jdbc:oracle:thin:@your-oracle-host:1521/your-service-name`
   - `DATABASE_USERNAME`: `your-oracle-username`
   - `DATABASE_PASSWORD`: `your-oracle-password`
   - `JWT_SECRET`: `your-jwt-secret-key`
   - `PYTHON_GITHUB_API_URL`: `https://your-github-api-url.cloudtype.app` (GitHub and direct portfolio extraction)
   - `PYTHON_CHATBOT_API_URL`: `https://your-chatbot-api-url.cloudtype.app`
   - `PYTHON_INTERVIEW_API_URL`: `https://your-interview-api-url.cloudtype.app`
   - `PYTHON_QUESTIONS_API_URL`: `https://your-questions-api-url.cloudtype.app`
   - `PYTHON_MATCHING_API_URL`: `https://your-matching-api-url.cloudtype.app`
   - `GOOGLE_REDIRECT_URI`: `https://your-frontend-url.cloudtype.app/google-auth`
   - `GITHUB_REDIRECT_URI`: `https://your-frontend-url.cloudtype.app/github-auth`

### 3. Python API 배포
1. CloudType에서 새 프로젝트 생성
2. GitHub 레포지토리 연결: `https://github.com/mck0124/zoop.kr.git`
3. **빌드 설정** (서비스별 프로젝트로 각각 배포):
   - GitHub: `cd backend/python-api/github_search && pip install -r requirements.txt`
   - Chatbot: `cd backend/python-api/chatbot && pip install -r requirements.txt`
   - Interview Analysis: `cd backend/python-api/interview_analysis && pip install -r requirements.txt`
   - Portfolio Matching: `cd backend/python-api/portfolio_matching && pip install -r requirements.txt`
   - Interview Questions: `cd backend/python-api/interview_questions && pip install -r requirements.txt`
4. **실행 명령어**:
   - GitHub: `cd backend/python-api/github_search && uvicorn main:app --host 0.0.0.0 --port 8000`
   - Chatbot: `cd backend/python-api/chatbot && uvicorn chatbot_api:app --host 0.0.0.0 --port 8001`
   - Interview Analysis: `cd backend/python-api/interview_analysis && uvicorn interview_analysis_api:app --host 0.0.0.0 --port 8002`
   - Portfolio Matching: `cd backend/python-api/portfolio_matching && uvicorn portfolio_matching_api:app --host 0.0.0.0 --port 8003`
   - Interview Questions: `cd backend/python-api/interview_questions && uvicorn interview_questions_api:app --host 0.0.0.0 --port 8004`
5. **환경 변수 설정**:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `GITHUB_TOKEN`: GitHub 토큰

각 Python 서비스는 서로 다른 포트로 배포해야 합니다: GitHub 8000, Chatbot 8001,
Interview Analysis 8002, Portfolio Matching 8003, Interview Questions 8004.
Spring의 `PYTHON_*_API_URL` 값은 해당 서비스의 실제 URL을 각각 가리켜야 합니다.

## 🔧 필요한 환경 변수

### 프론트엔드
- `REACT_APP_API_URL`: 백엔드 API URL

### 백엔드
- `SPRING_PROFILES_ACTIVE`: `prod`
- `DATABASE_URL`: 데이터베이스 URL
- `JWT_SECRET`: JWT 시크릿 키
- `GITHUB_CLIENT_ID`: GitHub OAuth 클라이언트 ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth 클라이언트 시크릿

### Python API
- `OPENAI_API_KEY`: OpenAI API 키
- `GITHUB_TOKEN`: GitHub 개인 액세스 토큰

## 📝 배포 후 확인사항

1. **프론트엔드**: 웹사이트 접속 확인
2. **백엔드**: API 엔드포인트 테스트
3. **Python API**: AI 기능 테스트
4. **데이터베이스**: 연결 및 데이터 확인

## 🚨 주의사항

- 환경 변수는 보안을 위해 CloudType 대시보드에서 설정
- 데이터베이스는 별도로 설정 필요 (CloudType DB 또는 외부 DB)
- API 키들은 절대 코드에 하드코딩하지 말 것

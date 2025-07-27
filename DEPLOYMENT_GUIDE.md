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
   - `PYTHON_API_URL`: `https://your-python-api-url.cloudtype.app`
   - `GOOGLE_REDIRECT_URI`: `https://your-frontend-url.cloudtype.app/google-auth`
   - `GITHUB_REDIRECT_URI`: `https://your-frontend-url.cloudtype.app/github-auth`

### 3. Python API 배포
1. CloudType에서 새 프로젝트 생성
2. GitHub 레포지토리 연결: `https://github.com/mck0124/zoop.kr.git`
3. **빌드 설정**:
   - 빌드 명령어: `cd backend/python-api && pip install -r requirements.txt`
4. **실행 명령어**: `python main.py`
5. **환경 변수 설정**:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `GITHUB_TOKEN`: GitHub 토큰

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
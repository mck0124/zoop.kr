#!/bin/bash

# ZOOP Backend Services Startup Script

echo "🚀 ZOOP Backend Services를 시작합니다..."

if [ ! -f ".env" ]; then
    echo "⚠️  공통 환경파일이 없습니다: backend/python-api/.env"
    echo "DeepSeek API 키와 OPENAI_BASE_URL을 먼저 설정해주세요."
fi

# GitHub Search Service (Port 8000)
echo "🔍 GitHub Search Service 시작 중... (Port 8000)"
cd github_search
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. github_search/.env 파일을 생성해주세요."
    echo "예시:"
    echo "OPENAI_API_KEY=your_api_key_here"
fi

# 백그라운드에서 github search 서비스 시작
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
GITHUB_PID=$!
echo "✅ GitHub Search Service 시작됨 (PID: $GITHUB_PID)"

# Chatbot Service (Port 8001)
echo "📱 Chatbot Service 시작 중... (Port 8001)"
cd ../chatbot
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. chatbot/.env 파일을 생성해주세요."
    echo "예시:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo "PDF_PATH=채용_관리자_가이드.pdf"
    echo "OPENAI_MODEL=gpt-4o-mini"
fi

# 백그라운드에서 chatbot 서비스 시작
uvicorn chatbot_api:app --host 0.0.0.0 --port 8001 --reload &
CHATBOT_PID=$!
echo "✅ Chatbot Service 시작됨 (PID: $CHATBOT_PID)"

# Interview Analysis Service (Port 8002)
echo "🎥 Interview Analysis Service 시작 중... (Port 8002)"
cd ../interview_analysis
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. interview_analysis/.env 파일을 생성해주세요."
    echo "예시:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo "SPRING_API_URL=http://localhost:8081"
fi

# 백그라운드에서 interview analysis 서비스 시작
uvicorn interview_analysis_api:app --host 0.0.0.0 --port 8002 --reload &
INTERVIEW_PID=$!
echo "✅ Interview Analysis Service 시작됨 (PID: $INTERVIEW_PID)"

# Portfolio Matching Service (Port 8003)
echo "📊 Portfolio Matching Service 시작 중... (Port 8003)"
cd ../portfolio_matching
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. portfolio_matching/.env 파일을 생성해주세요."
    echo "예시:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo "SPRING_API_URL=http://localhost:8081"
fi

# 백그라운드에서 portfolio matching 서비스 시작
uvicorn portfolio_matching_api:app --host 0.0.0.0 --port 8003 --reload &
PORTFOLIO_PID=$!
echo "✅ Portfolio Matching Service 시작됨 (PID: $PORTFOLIO_PID)"

# Interview Questions Service (Port 8004)
echo "❓ Interview Questions Service 시작 중... (Port 8004)"
cd ../interview_questions
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. interview_questions/.env 파일을 생성해주세요."
    echo "예시:"
    echo "OPENAI_API_KEY=your_api_key_here"
    echo "OPENAI_MODEL=gpt-4o-mini"
fi

# 백그라운드에서 interview questions 서비스 시작
uvicorn interview_questions_api:app --host 0.0.0.0 --port 8004 --reload &
QUESTIONS_PID=$!
echo "✅ Interview Questions Service 시작됨 (PID: $QUESTIONS_PID)"

# OCR Service (Port 5003)
echo "📄 OCR Service 시작 중... (Port 5003)"
cd ../../ocr
uvicorn ocr_api:app --host 0.0.0.0 --port 5003 --reload &
OCR_PID=$!
cd ../python-api/interview_questions
echo "✅ OCR Service 시작됨 (PID: $OCR_PID)"

echo ""
echo "🎉 모든 서비스가 시작되었습니다!"
echo "🔍 GitHub Search Service: http://localhost:8000"
echo "📱 Chatbot Service: http://localhost:8001"
echo "🎥 Interview Analysis Service: http://localhost:8002"
echo "📊 Portfolio Matching Service: http://localhost:8003"
echo "❓ Interview Questions Service: http://localhost:8004"
echo ""
echo "서비스를 중지하려면:"
echo "kill $GITHUB_PID $CHATBOT_PID $INTERVIEW_PID $PORTFOLIO_PID $QUESTIONS_PID $OCR_PID"
echo ""
echo "로그 확인:"
echo "tail -f github_search/logs.txt chatbot/logs.txt interview_analysis/logs.txt portfolio_matching/logs.txt interview_questions/logs.txt"

# 서비스 상태 모니터링
while true; do
    if ! kill -0 $GITHUB_PID 2>/dev/null; then
        echo "❌ GitHub Search Service가 중단되었습니다."
        break
    fi
    if ! kill -0 $CHATBOT_PID 2>/dev/null; then
        echo "❌ Chatbot Service가 중단되었습니다."
        break
    fi
    if ! kill -0 $INTERVIEW_PID 2>/dev/null; then
        echo "❌ Interview Analysis Service가 중단되었습니다."
        break
    fi
    if ! kill -0 $PORTFOLIO_PID 2>/dev/null; then
        echo "❌ Portfolio Matching Service가 중단되었습니다."
        break
    fi
    if ! kill -0 $QUESTIONS_PID 2>/dev/null; then
        echo "❌ Interview Questions Service가 중단되었습니다."
        break
    fi
    sleep 5
done

// InterviewPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import InterviewEnvironmentCheck from './InterviewEnvironmentCheck';
import './InterviewPage.css';
import { apiUrl } from '../../../api/config';

function InterviewPage() {
  const { id } = useParams(); // scheduleId
  const { authState } = useAuth(); // AuthContext에서 사용자 정보 가져오기
  const [interviewData, setInterviewData] = useState(null);
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnvironmentCheck, setShowEnvironmentCheck] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        // 1. 면접 일정 정보 조회
        const response = await fetch(apiUrl(`/api/interviews/${id}`));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInterviewData(data);

        // 2. AuthContext에서 실제 사용자의 candidateId 가져오기
        const candidateId = authState.userId;
        console.log('사용자 ID:', candidateId);

        if (!candidateId) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        // 3. 후보자의 공고 목록 조회
        const postingsResponse = await fetch(apiUrl(`/api/candidates/${candidateId}/job-postings`));
        if (!postingsResponse.ok) {
          throw new Error('공고 정보 조회 실패');
        }
        const postings = await postingsResponse.json();
        // 일정의 jobCandidateId로 진행 상태를 조회해 정확한 공고를 선택한다.
        const progressResponse = await fetch(apiUrl(`/api/progress/job-cand-progress/${data.jobCandidateId}`));
        const progress = progressResponse.ok ? await progressResponse.json() : null;
        const progressPostId = progress?.post?.postId || progress?.postId;
        setJobPosting(postings.find(post => String(post.postId) === String(progressPostId)) || null);

      } catch (e) {
        console.error("면접 정보를 가져오는 중 오류 발생:", e);
        setError("면접 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewDetails();
  }, [id, authState.userId]); // authState.userId를 의존성 배열에 추가

  const handleStartInterview = () => {
    setShowEnvironmentCheck(true);
  };

  const handleEnvironmentCheckComplete = () => {
    // 환경 점검 완료 후 면접 녹화 페이지로 이동
    if (interviewData?.scheduleId) {
      navigate(`/interview-session/${interviewData.scheduleId}`);
    }
  };

  const handleEnvironmentCheckBack = () => {
    setShowEnvironmentCheck(false);
  };

  if (loading) {
    return <div className="interview-page-loading">면접 정보를 불러오는 중입니다...</div>;
  }

  if (error) {
    return <div className="interview-page-error">{error}</div>;
  }

  // 환경 체크 페이지가 표시되어야 하는 경우
  if (showEnvironmentCheck) {
    return (
      <InterviewEnvironmentCheck
        interviewLink={interviewData?.interviewLink}
        onComplete={handleEnvironmentCheckComplete}
        onBack={handleEnvironmentCheckBack}
      />
    );
  }

  // 날짜 형식 변환
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="interview-page-container">
      <div className="interview-check-header">
        <h1>AI 면접 시작 전 확인</h1>
        <p className="interview-check-guide">
          아래 정보를 꼭 확인하고 AI 면접을 시작하세요!
        </p>
      </div>

      <div className="interview-check-card">
        <div className="job-info-section">
          <h2>지원 공고 정보</h2>
          <div className="job-info-grid">
            <div className="job-info-item">
              <span className="label">회사명:</span>
              <span className="value">{jobPosting?.companyName || '정보 없음'}</span>
            </div>
            <div className="job-info-item">
              <span className="label">공고명:</span>
              <span className="value">{jobPosting?.postTitle || '정보 없음'}</span>
            </div>
            <div className="job-info-item">
              <span className="label">근무지:</span>
              <span className="value">{jobPosting?.postLocation || '정보 없음'}</span>
            </div>
            <div className="job-info-item">
              <span className="label">기술 스택:</span>
              <span className="value">{jobPosting?.postProgrammingLanguage || '정보 없음'}</span>
            </div>
          </div>
        </div>

        <div className="interview-info-section">
          <h2>면접 일정 정보</h2>
          <div className="interview-info-grid">
            <div className="interview-info-item">
              <span className="label">면접 일시:</span>
              <span className="value">{formatDate(interviewData?.scheduledTime)}</span>
            </div>
            <div className="interview-info-item">
              <span className="label">면접 마감:</span>
              <span className="value">{formatDate(interviewData?.deadlineTime)}</span>
            </div>
          </div>
        </div>

        <div className="interview-actions-section">
          <div className="interview-notice">
            <h3>면접 시작 전 확인사항</h3>
            <ul>
              <li>위 공고 정보가 맞는지 확인해주세요</li>
              <li>면접 시간이 지나지 않았는지 확인해주세요</li>
              <li>안정적인 인터넷 환경에서 면접을 진행해주세요</li>
              <li>면접 중에는 다른 프로그램을 종료해주세요</li>
              <li>카메라와 마이크가 정상 작동하는지 확인해주세요</li>
            </ul>
          </div>
          
          <div className="interview-actions">
            <button
              onClick={handleStartInterview}
              className="go-to-interview-button"
              style={{
                borderRadius: '999px',
                padding: '16px 40px',
                fontSize: 18,
                fontWeight: 700,
                background: '#30C59B',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 16px #30c59b22',
                cursor: 'pointer',
                transition: 'background 0.18s, box-shadow 0.18s, transform 0.14s',
                marginTop: 8
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#22c55e';
                e.currentTarget.style.boxShadow = '0 8px 24px #22c55e33';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#30C59B';
                e.currentTarget.style.boxShadow = '0 4px 16px #30c59b22';
                e.currentTarget.style.transform = 'none';
              }}
            >
              AI 면접 시작하기
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;

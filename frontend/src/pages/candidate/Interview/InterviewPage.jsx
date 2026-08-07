// InterviewPage.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import InterviewEnvironmentCheck from './InterviewEnvironmentCheck';
import './InterviewPage.css';
import { apiUrl } from '../../../api/config';
import { useLanguage } from '../../../context/LanguageContext';

const INTERVIEW_COPY = {
  en: { loading: 'Loading interview details...', error: 'Could not load the interview details.', title: 'Review before your AI interview', guide: 'Please confirm the information below before you begin.', jobInfo: 'Job posting', company: 'Company', posting: 'Position', location: 'Location', stack: 'Tech stack', scheduleInfo: 'Schedule', startTime: 'Interview time', deadline: 'Interview deadline', noInfo: 'Not available', checklist: 'Before you start', items: ['Confirm that the job information is correct.', 'Make sure the interview window is still open.', 'Use a stable internet connection.', 'Close other programs during the interview.', 'Check that your camera and microphone work.'], start: 'Start AI interview' },
  ko: { loading: '면접 정보를 불러오는 중입니다...', error: '면접 정보를 불러오는데 실패했습니다.', title: 'AI 면접 시작 전 확인', guide: '아래 정보를 꼭 확인하고 AI 면접을 시작하세요!', jobInfo: '지원 공고 정보', company: '회사명', posting: '공고명', location: '근무지', stack: '기술 스택', scheduleInfo: '면접 일정 정보', startTime: '면접 일시', deadline: '면접 마감', noInfo: '정보 없음', checklist: '면접 시작 전 확인사항', items: ['위 공고 정보가 맞는지 확인해주세요', '면접 시간이 지나지 않았는지 확인해주세요', '안정적인 인터넷 환경에서 면접을 진행해주세요', '면접 중에는 다른 프로그램을 종료해주세요', '카메라와 마이크가 정상 작동하는지 확인해주세요'], start: 'AI 면접 시작하기' },
  zh: { loading: '正在加载面试信息……', error: '无法加载面试信息。', title: '开始 AI 面试前请确认', guide: '开始前请确认以下信息。', jobInfo: '职位信息', company: '公司', posting: '职位名称', location: '工作地点', stack: '技术栈', scheduleInfo: '面试安排', startTime: '面试时间', deadline: '面试截止时间', noInfo: '暂无信息', checklist: '开始前须知', items: ['请确认以上职位信息是否正确。', '请确认面试时间尚未结束。', '请使用稳定的网络环境。', '面试期间请关闭其他程序。', '请确认摄像头和麦克风正常工作。'], start: '开始 AI 面试' }
};

function InterviewPage() {
  const { id } = useParams(); // scheduleId
  const { authState } = useAuth(); // AuthContext에서 사용자 정보 가져오기
  const [interviewData, setInterviewData] = useState(null);
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnvironmentCheck, setShowEnvironmentCheck] = useState(false);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = useMemo(() => INTERVIEW_COPY[language] || INTERVIEW_COPY.en, [language]);

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
          throw new Error(copy.error);
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
  }, [id, authState.userId, copy]); // authState.userId를 의존성 배열에 추가

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
    return <div className="interview-page-loading">{copy.loading}</div>;
  }

  if (error) {
    return <div className="interview-page-error">{error || copy.error}</div>;
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
    return date.toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ko' ? 'ko-KR' : 'en-US');
  };

  return (
    <div className="interview-page-container">
      <div className="interview-check-header">
        <h1>{copy.title}</h1>
        <p className="interview-check-guide">
          {copy.guide}
        </p>
      </div>

      <div className="interview-check-card">
        <div className="job-info-section">
          <h2>{copy.jobInfo}</h2>
          <div className="job-info-grid">
            <div className="job-info-item">
              <span className="label">{copy.company}:</span>
              <span className="value">{jobPosting?.companyName || copy.noInfo}</span>
            </div>
            <div className="job-info-item">
              <span className="label">{copy.posting}:</span>
              <span className="value">{jobPosting?.postTitle || copy.noInfo}</span>
            </div>
            <div className="job-info-item">
              <span className="label">{copy.location}:</span>
              <span className="value">{jobPosting?.postLocation || copy.noInfo}</span>
            </div>
            <div className="job-info-item">
              <span className="label">{copy.stack}:</span>
              <span className="value">{jobPosting?.postProgrammingLanguage || copy.noInfo}</span>
            </div>
          </div>
        </div>

        <div className="interview-info-section">
          <h2>{copy.scheduleInfo}</h2>
          <div className="interview-info-grid">
            <div className="interview-info-item">
              <span className="label">{copy.startTime}:</span>
              <span className="value">{formatDate(interviewData?.scheduledTime)}</span>
            </div>
            <div className="interview-info-item">
              <span className="label">{copy.deadline}:</span>
              <span className="value">{formatDate(interviewData?.deadlineTime)}</span>
            </div>
          </div>
        </div>

        <div className="interview-actions-section">
          <div className="interview-notice">
            <h3>{copy.checklist}</h3>
            <ul>
              {copy.items.map(item => <li key={item}>{item}</li>)}
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
              {copy.start}
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// useAuth 훅을 임포트합니다. 실제 AuthContext 파일 경로에 맞게 수정해주세요.
import { useAuth } from '../../../context/AuthContext.jsx';
import SEO from '../../../components/SEO';

import { Sidebar } from '../Sidebar';
import { PortfolioNavbar } from '../Portfolio';
import { 
  JobSelectionModal,
  RegionSelectionModal,
  SalarySelectionModal,
  CompanySizeSelectionModal,
  CommuteTimeSelectionModal,
  BenefitSelectionModal
} from '../Modals';
import { InterviewSchedulerModal } from '../Interview';
import InterviewPreparationModal from '../../../components/InterviewPreparationModal';
import { apiUrl } from '../../../api/config';

import './CandidateDashboard.css';

// DB 날짜 포맷을 Date 객체로 변환하는 함수
function parseDbDate(str) {
  if (!str || typeof str !== 'string') return null;
  // ISO 포맷(yyyy-MM-ddTHH:mm:ss)도 지원
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  // 기존 yy/MM/dd HH:mm:ss.SSS... 포맷
  const [date, time] = str.split(' ');
  if (!date || !time) return null;
  const [yy, MM, dd] = date.split('/');
  if (!yy || !MM || !dd) return null;
  const yyyy = Number(yy) < 50 ? '20' + yy : '19' + yy;
  const timePart = time.split('.')[0];
  const isoString = `${yyyy}-${MM}-${dd}T${timePart}`;
  const d = new Date(isoString);
  return isNaN(d.getTime()) ? null : d;
}

// Date 객체를 KST(로컬)로 변환해서 표시하는 함수
function formatUtcToKst(dateObj) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleString('ko-KR', { hour12: false });
}

// 남은 시간을 계산하는 함수
function calculateRemainingTime(deadlineDate) {
  if (!deadlineDate || !(deadlineDate instanceof Date) || isNaN(deadlineDate.getTime())) return '';
  
  const now = new Date();
  const diffMs = deadlineDate - now;
  
  if (diffMs <= 0) return '면접이 종료되었습니다.';
  
  const diffMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  
  if (diffMin < 1) {
    return '곧 종료됩니다!';
  } else if (hours > 0) {
    return `면접 종료까지 ${hours}시간 ${minutes}분 남았습니다.`;
  } else {
    return `면접 종료까지 ${minutes}분 남았습니다.`;
  }
}

// 스테이지별 색상 스타일 함수 추가
const getStageColor = (code) => {
  switch (code) {
    case '4n': return { bg: '#fed7d7', text: '#e53e3e', border: '#fc8181' }; // 불합격 - 빨간색
    case '4y': return { bg: '#c6f6d5', text: '#38a169', border: '#68d391' }; // 합격 - 진한 초록색
    default: return { bg: '#e6fffa', text: '#319795', border: '#b2f5ea' };
  }
};

// 스테이지별 라벨 함수 추가
const getStageLabel = (code) => {
  switch (code) {
    case '4n': return '불합격';
    case '4y': return '합격';
    default: return '진행중';
  }
};

function CandidateDashboard() {
  // useAuth 훅을 사용하여 인증 상태 정보를 가져옵니다.
  // authState 객체에 로그인 정보 (예: userId, userType, token)가 담겨 있다고 가정합니다.
  const { authState } = useAuth();

  const [userName, setUserName] = useState('게스트');
  const [activeTab, setActiveTab] = useState('all');

  // 백엔드에서 가져온 공고 목록 데이터를 저장할 상태
  const [jobPostings, setJobPostings] = useState([]);

  // 로그인한 사용자의 ID를 authState에서 가져옵니다.
  // authState.userId 또는 authState.candidateId 등 실제 필드명에 맞게 수정해주세요.
  // 로그인되지 않은 상태일 경우 authState.userId는 null 또는 undefined일 수 있습니다.
  const candidateId = authState.userId; // <-- 로그인한 사용자의 ID 사용

  // React Router의 navigate 훅 초기화
  const navigate = useNavigate();

  // 직무 선택 모달 상태 (localStorage 연동)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState('입력해주세요');

  // 지역 선택 모달 상태 (localStorage 연동)
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('입력해주세요');

  // 연봉 선택 모달 상태 (localStorage 연동)
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState('입력해주세요');

  // 기업규모 선택 모달 상태 (새로 추가, localStorage 연동)
  const [isCompanySizeModalOpen, setIsCompanySizeModalOpen] = useState(false);
  const [selectedCompanySize, setSelectedCompanySize] = useState('입력해주세요');

  // 출근소요시간 선택 모달 상태 (새로 추가, localStorage 연동)
  const [isCommuteTimeModalOpen, setIsCommuteTimeModalOpen] = useState(false);
  const [selectedCommuteTime, setSelectedCommuteTime] = useState('입력해주세요');

  // 나머지 입력값 상태 (현재 모달이 없으므로 '입력해주세요'로 고정)
  const [selectedBenefits, setSelectedBenefits] = useState([]);

  // 면접 일정 모달 관련 상태
  const [isInterviewSchedulerModalOpen, setIsInterviewSchedulerModalOpen] = useState(false);
  const [selectedPostIdForScheduling, setSelectedPostIdForScheduling] = useState(null);

  // 면접 예상질문 모달 관련 상태
  const [isInterviewPreparationModalOpen, setIsInterviewPreparationModalOpen] = useState(false);
  const [selectedPostIdForPreparation, setSelectedPostIdForPreparation] = useState(null);

  // 면접 일정이 잡힌 공고들을 추적하는 상태
  const [scheduledInterviews, setScheduledInterviews] = useState({});

  // 복리후생 모달 관련 상태
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);

  // 컴포넌트가 처음 마운트되거나 candidateId가 변경될 때 데이터를 가져오는 useEffect 훅
  useEffect(() => {
    const fetchUserDataAndJobPostings = async () => {
      try {
        // 1. 사용자 정보 가져오기
        const userResponse = await fetch(apiUrl(`/api/candidates/${candidateId}`));
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserName(userData.candidateName || '사용자');
        }

        // 2. 공고 목록 가져오기
        const postingsResponse = await fetch(apiUrl(`/api/candidates/${candidateId}/job-postings`));
        if (postingsResponse.ok) {
          const postingsData = await postingsResponse.json();
          setJobPostings(postingsData);
        }

        // 3. 사용자 설정 불러오기
        await loadPreferencesFromDB();
        
        // 4. 기존 면접 일정 정보 불러오기
        await loadExistingInterviewSchedules();
        
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        setUserName('오류 발생'); // 사용자 이름 로딩 오류 처리
        setJobPostings([]); // 공고 목록 로딩 오류 시 빈 배열로 설정
      }
    };

    // candidateId 값이 변경될 때마다 effect 재실행
    // authState.userId (또는 해당 필드)가 변경될 때마다 이 effect가 다시 실행되어 새로운 사용자의 데이터를 가져옵니다.
    fetchUserDataAndJobPostings();
  // 이 effect는 API helper가 컴포넌트 내부에 있어 의도적으로 사용자 변경 시에만 실행합니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId, authState.userId]); // 의존성 배열에 candidateId와 authState.userId 추가

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    console.log(`Tab selected: ${tabId}`);
    // TODO: 탭 변경 시 해당 탭에 맞는 공고 목록을 필터링하거나, 백엔드 API 호출 시 탭 정보를 넘겨줄 수 있습니다.
    // 현재는 모든 탭에서 동일한 전체 목록을 보여줍니다.
  };
  // 면접 일정 모달 관련 함수 추가
  const openInterviewSchedulerModal = (postId) => {
    setSelectedPostIdForScheduling(postId);
    setIsInterviewSchedulerModalOpen(true);
  };

  const closeInterviewSchedulerModal = () => {
    setIsInterviewSchedulerModalOpen(false);
    setSelectedPostIdForScheduling(null);
  };

  // 면접 예상질문 모달 열기/닫기 핸들러
  const openInterviewPreparationModal = (postId) => {
    setSelectedPostIdForPreparation(postId);
    setIsInterviewPreparationModalOpen(true);
  };

  const closeInterviewPreparationModal = () => {
    setIsInterviewPreparationModalOpen(false);
    setSelectedPostIdForPreparation(null);
  };

  // 면접 일정이 정해졌을 때 처리하는 함수
  const handleInterviewScheduled = async (postId, scheduleInfo) => {
    console.log("면접 일정 저장됨:", postId, scheduleInfo);
    
    // 1. 서버에서 최신 데이터를 다시 가져와서 상태 동기화
    try {
      const response = await fetch(apiUrl(`/api/candidates/${candidateId}/job-postings`));
      if (response.ok) {
        const updatedJobPostings = await response.json();
        setJobPostings(updatedJobPostings);
        console.log("면접 일정 등록 후 최신 데이터 동기화 완료");
        
        // 2. 면접 일정 정보를 백엔드에서 가져와서 scheduledInterviews에 저장
        try {
          const interviewResponse = await fetch(apiUrl(`/api/interviews/by-post-candidate?postId=${postId}&candidateId=${candidateId}`));
          if (interviewResponse.ok) {
            const interviewData = await interviewResponse.json();
            console.log("면접 정보 조회 성공:", interviewData);
            
            // 면접 정보를 scheduledInterviews에 저장
            const scheduledDate = parseDbDate(interviewData.scheduledTime);
            const deadlineDate = parseDbDate(interviewData.deadlineTime);
            console.log('면접 API 응답:', interviewData);
            console.log('파싱 결과 scheduledDate:', scheduledDate, 'deadlineDate:', deadlineDate);
            setScheduledInterviews(prev => {
              const updated = {
                ...prev,
                [postId]: {
                  date: formatUtcToKst(scheduledDate),
                  time: '',
                  iso: scheduledDate,
                  deadline: deadlineDate,
                  link: interviewData.interviewLink,
                  scheduleId: interviewData.scheduleId
                }
              };
              console.log('scheduledInterviews 저장:', updated);
              return updated;
            });
          } else {
            console.error("면접 정보 조회 실패:", interviewResponse.status);
          }
        } catch (interviewError) {
          console.error("면접 정보 조회 중 오류:", interviewError);
        }
      }
    } catch (error) {
      console.error("면접 일정 등록 후 데이터 동기화 실패:", error);
      // 동기화 실패 시 로컬 상태만 업데이트
      setJobPostings(prevJobPostings =>
        prevJobPostings.map(post =>
          post.postId === postId
            ? { ...post, jobCandCurrStage: '3n' } // 상태를 '3n'으로 변경 (면접 일정 확정)
            : post
        )
      );
    }
    
    closeInterviewSchedulerModal();
  };

  // 포트폴리오 제출 페이지로 이동하는 함수
  const handleGoToSubmitPortfolio = (postId) => {
    console.log(`공고 ID ${postId}에 대한 포트폴리오 제출 페이지로 이동`);
    // React Router의 navigate 함수를 사용하여 포트폴리오 제출 페이지로 이동합니다.
    // URL 경로에 공고 ID를 포함시켜 제출 페이지에서 어떤 공고인지 알 수 있도록 합니다.
    navigate(`/submit-portfolio/${postId}`); // 실제 라우팅 경로에 맞게 수정
  };
  // 면접 페이지로 이동하는 함수
  const navigateToInterview = async (postId) => {
    try {
      // 1. 현재 로그인한 사용자의 candidateId 가져오기
      const candidateId = localStorage.getItem('userId');
      if (!candidateId) {
        alert('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 2. scheduledInterviews에서 면접 일정 확인
      const interview = scheduledInterviews[postId];
      if (interview && interview.iso) {
        const interviewDateTime = new Date(interview.iso);
        const now = new Date();
        if (interviewDateTime > now) {
          alert('아직 면접 시작 시간이 되지 않았습니다.');
          return;
        }
      }

      // 3. 백엔드 API 호출 URL 수정
      const response = await fetch(apiUrl(`/api/interviews/by-post-candidate?postId=${postId}&candidateId=${candidateId}`));
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API 응답 오류:", response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || '면접 일정을 조회하는데 실패했습니다.');
        } catch (parseError) {
          throw new Error(`면접 일정을 조회하는데 실패했습니다. (HTTP ${response.status}: ${errorText.substring(0, 100)}...)`);
        }
      }
      const data = await response.json();
      if (data && data.scheduleId) {
        navigate(`/interview/${data.scheduleId}`);
      } else {
        alert('해당 공고에 대한 면접 일정을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('면접 페이지로 이동 중 오류 발생:', error);
      alert(`면접 페이지로 이동할 수 없습니다: ${error.message}`);
    }
  };

  // 직무 모달 관련 함수
  const openJobModal = () => {
    setIsJobModalOpen(true);
  };
  const closeJobModal = () => {
    setIsJobModalOpen(false);
  };
  const handleJobSelected = async (job) => {
    setSelectedJob(job);
    localStorage.setItem('selectedJob', job);
    // DB에 저장
    await savePreferencesToDB({ preferredJob: job });
  };

  // 지역 모달 관련 함수
  const openRegionModal = () => {
    setIsRegionModalOpen(true);
  };
  const closeRegionModal = () => {
    setIsRegionModalOpen(false);
  };
  const handleRegionSelected = async (region) => {
    setSelectedRegion(region);
    localStorage.setItem('selectedRegion', region);
    // DB에 저장
    await savePreferencesToDB({ preferredRegion: region });
  };

  // 연봉 모달 관련 함수
  const openSalaryModal = () => {
    setIsSalaryModalOpen(true);
  };
  const closeSalaryModal = () => {
    setIsSalaryModalOpen(false);
  };
  const handleSalarySelected = async (salary) => {
    setSelectedSalary(salary);
    localStorage.setItem('selectedSalary', salary);
    // DB에 저장
    await savePreferencesToDB({ preferredSalary: salary });
  };

  // 기업규모 모달 관련 함수 (새로 추가)
  const openCompanySizeModal = () => {
    setIsCompanySizeModalOpen(true);
  };
  const closeCompanySizeModal = () => {
    setIsCompanySizeModalOpen(false);
  };
  const handleCompanySizeSelected = async (size) => {
    setSelectedCompanySize(size);
    localStorage.setItem('selectedCompanySize', size);
    // DB에 저장
    await savePreferencesToDB({ preferredCompanySize: size });
  };

  // 출근소요시간 모달 관련 함수 (새로 추가)
  const openCommuteTimeModal = () => {
    setIsCommuteTimeModalOpen(true);
  };
  const closeCommuteTimeModal = () => {
    setIsCommuteTimeModalOpen(false);
  };
  const handleCommuteTimeSelected = async (time) => {
    setSelectedCommuteTime(time);
    localStorage.setItem('selectedCommuteTime', time);
    // DB에 저장
    await savePreferencesToDB({ preferredCommuteTime: time });
  };

  // 복리후생 모달 관련 함수 (새로 추가)
  const openBenefitModal = () => {
    setIsBenefitModalOpen(true);
  };
  const closeBenefitModal = () => {
    setIsBenefitModalOpen(false);
  };
  const handleBenefitsSelected = async (benefits) => {
    setSelectedBenefits(benefits);
    localStorage.setItem('selectedBenefits', JSON.stringify(benefits));
    // DB에 저장
    await savePreferencesToDB({ preferredBenefit: benefits.join(', ') });
  };

  // 공고 제목 클릭 시 해당 공고 상세 페이지로 이동
  const handleJobTitleClick = (postId) => {
    navigate(`/job/${postId}`);
  };

  // 사용자 설정을 DB에 저장하는 함수
  const savePreferencesToDB = async (preferences) => {
    try {
      const response = await fetch(apiUrl(`/api/candidates/${candidateId}/preferences`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidateId,
          ...preferences
        })
      });

      if (response.ok) {
        console.log('사용자 설정이 DB에 저장되었습니다.');
      } else {
        console.error('사용자 설정 저장 실패:', response.status);
      }
    } catch (error) {
      console.error('사용자 설정 저장 중 오류:', error);
    }
  };

  // 사용자 설정을 DB에서 불러오는 함수
  const loadPreferencesFromDB = async () => {
    try {
      const response = await fetch(apiUrl(`/api/candidates/${candidateId}/preferences`));
      if (response.ok) {
        const preferences = await response.json();
        
        // DB에서 가져온 설정으로 상태 업데이트
        if (preferences.preferredJob) {
          setSelectedJob(preferences.preferredJob);
          localStorage.setItem('selectedJob', preferences.preferredJob);
        }
        if (preferences.preferredRegion) {
          setSelectedRegion(preferences.preferredRegion);
          localStorage.setItem('selectedRegion', preferences.preferredRegion);
        }
        if (preferences.preferredSalary) {
          setSelectedSalary(preferences.preferredSalary);
          localStorage.setItem('selectedSalary', preferences.preferredSalary);
        }
        if (preferences.preferredCompanySize) {
          setSelectedCompanySize(preferences.preferredCompanySize);
          localStorage.setItem('selectedCompanySize', preferences.preferredCompanySize);
        }
        if (preferences.preferredCommuteTime) {
          setSelectedCommuteTime(preferences.preferredCommuteTime);
          localStorage.setItem('selectedCommuteTime', preferences.preferredCommuteTime);
        }
        if (preferences.preferredBenefit) {
          const benefits = preferences.preferredBenefit.split(', ').filter(b => b.trim());
          setSelectedBenefits(benefits);
          localStorage.setItem('selectedBenefits', JSON.stringify(benefits));
        }
        
        console.log('사용자 설정을 DB에서 불러왔습니다.');
      }
    } catch (error) {
      console.error('사용자 설정 로드 중 오류:', error);
    }
  };

  // 기존 면접 일정 정보 불러오기
  const loadExistingInterviewSchedules = async () => {
    try {
      // 각 공고별로 면접 일정 정보를 가져오기
      const jobPostingsResponse = await fetch(apiUrl(`/api/candidates/${candidateId}/job-postings`));
      if (jobPostingsResponse.ok) {
        const jobPostings = await jobPostingsResponse.json();
        
        // 3n 상태(면접 일정 확정)인 공고들에 대해서만 면접 정보 조회
        const interviewPromises = jobPostings
          .filter(post => post.jobCandCurrStage === '3n')
          .map(async (post) => {
            try {
              const interviewResponse = await fetch(apiUrl(`/api/interviews/by-post-candidate?postId=${post.postId}&candidateId=${candidateId}`));
              if (interviewResponse.ok) {
                const interviewData = await interviewResponse.json();
                return {
                  postId: post.postId,
                  interviewData: interviewData
                };
              }
            } catch (error) {
              console.error(`공고 ${post.postId}의 면접 정보 조회 실패:`, error);
            }
            return null;
          });

        const interviewResults = await Promise.all(interviewPromises);
        
        // scheduledInterviews 상태 업데이트
        const newScheduledInterviews = {};
        interviewResults.forEach(result => {
          if (result && result.interviewData) {
            const scheduledDate = parseDbDate(result.interviewData.scheduledTime);
            const deadlineDate = parseDbDate(result.interviewData.deadlineTime);
            console.log('면접 API 응답(일괄):', result.interviewData);
            console.log('파싱 결과 scheduledDate2:', scheduledDate, 'deadlineDate2:', deadlineDate);
            newScheduledInterviews[result.postId] = {
              date: formatUtcToKst(scheduledDate),
              time: '',
              iso: scheduledDate,
              deadline: deadlineDate,
              link: result.interviewData.interviewLink,
              scheduleId: result.interviewData.scheduleId
            };
          }
        });
        
        setScheduledInterviews(newScheduledInterviews);
        console.log('최종 scheduledInterviews:', newScheduledInterviews);
      }
    } catch (error) {
      console.error('기존 면접 일정 로드 중 오류:', error);
    }
  };

  return (
    <div className="candidate-dashboard-wrapper dashboard-page">
      <SEO title="개인 대시보드" description="개인 대시보드에서 나의 포지션 제안, 면접 일정, 결과를 확인할 수 있습니다." />
      <Sidebar />

      <div className="main-content-area">
        {/* Header 컴포넌트에 userName 전달 */}
        <PortfolioNavbar userName={userName} />

        <h1 className="page-title">포지션 제안 현황</h1>

        <div className="info-box company-proposal">
          <p>
            <span className="icon">
              <img src="../../icons/sparkle.svg" alt="sparkle" />
            </span> 기업에게 포지션 제안을 받는 중입니다.
          </p>
          <button className="highlight-button">
            이력서 하이라이트 신청하기 <span className="arrow-right">›</span>
          </button>
        </div>

        {/* Search/Filter Section */}
        <div className="filter-section">
          <div className="filter-row">
            <span className="label">희망 근무 조건</span>
            <div className="tags">
              {/* 직무 관련 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">직무</span>
                <span className="tag blue interactive-tag" onClick={openJobModal}>
                  {selectedJob}
                </span>
              </div>
              
              {/* 지역 관련 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">지역</span>
                <span className="tag blue interactive-tag" onClick={openRegionModal}>
                  {selectedRegion}
                </span>
              </div>
              
              {/* 조건 관련 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">연봉</span>
                <span className="tag blue interactive-tag" onClick={openSalaryModal}>
                  {selectedSalary}
                </span>
              </div>
              
              {/* 복리후생 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">복리후생</span>
                <span className="tag blue interactive-tag" onClick={openBenefitModal}>
                  {selectedBenefits.length > 0 ? selectedBenefits.join(', ') : '입력해주세요'}
                </span>
              </div>
              
              {/* 기업 관련 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">기업규모</span>
                <span className="tag blue interactive-tag" onClick={openCompanySizeModal}>
                  {selectedCompanySize}
                </span>
              </div>
              
              {/* 출근 관련 그룹 */}
              <div className="tag-group">
                <span className="tag static-tag">출근소요시간</span>
                <span className="tag blue interactive-tag" onClick={openCommuteTimeModal}>
                  {selectedCommuteTime}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Tabs and Content Area */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabClick('all')}
            >
              전체
            </button>
            <button
              className={`tab-button ${activeTab === 'positionOffer' ? 'active' : ''}`}
              onClick={() => handleTabClick('positionOffer')}
            >
              포지션 제안
            </button>
            <button
              className={`tab-button ${activeTab === 'interviewOffer' ? 'active' : ''}`}
              onClick={() => handleTabClick('interviewOffer')}
            >
              면접
            </button>
            <button
              className={`tab-button ${activeTab === 'resultAnnouncement' ? 'active' : ''}`}
              onClick={() => handleTabClick('resultAnnouncement')}
            >
              결과
            </button>
          </div>

          <div className="filter-options">
            <select className="dropdown">
              <option>지난 1년</option>
            </select>
            <select className="dropdown">
              <option>확인안한 제안 제외</option>
            </select>
            <select className="dropdown">ㄴ
              <option>20개씩</option>
            </select>
          </div>
        </div>

        {/* Tab Content - 공고 목록 표시 */}
        <div className="tab-content">
  {activeTab === 'all' && (
    <div>
      {/* jobPostings 상태에 데이터가 있는지 확인하고 목록을 렌더링 */}
      {jobPostings.length > 0 ? (
        <ul>
          {/* jobPostings 배열을 순회하며 각 공고 항목을 렌더링 */}
          {jobPostings.map(post => (
            <li key={post.postId} className="job-posting-item">
              <div className="job-posting-flex-row">
                <div className="job-posting-content">
                  <div className="company-title-row">
                    <h3>{post.companyName}</h3>
                    <p 
                      onClick={() => handleJobTitleClick(post.postId)}
                      className="clickable-job-title"
                    >
                      {post.postTitle}
                    </p>
                  </div>
                  <div className="job-posting-dates">
                    <p>등록일: {post.postPostedDate}</p>
                    <p>마감일: {post.postExpiryDate}</p>
                  </div>
                </div>
                <div className="job-posting-action-col">
                  {/* jobCandCurrStage 값에 따라 버튼 표시 로직 추가 */}
                  {post.jobCandCurrStage === '1n' && (
                    <button onClick={() => handleGoToSubmitPortfolio(post.postId)}
                      className="submit-portfolio-button">
                      포트폴리오 제출하기
                    </button>
                  )}
                  {post.jobCandCurrStage === '2n' && (
                    <button onClick={() => handleGoToSubmitPortfolio(post.postId)}
                      className="submit-portfolio-button">
                      포트폴리오 제출하기
                    </button>
                  )}
                  {post.jobCandCurrStage === '2y' && (
                    <div 
                      className="pending-status"
                      style={{
                        backgroundColor: '#fef5e7',
                        color: '#d69e2e',
                        border: '1px solid #fbd38d',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        cursor: 'default',
                        userSelect: 'none'
                      }}
                    >
                      {/* Use a clock SVG for pending/waiting */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d69e2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      면접 수락 요청 중
                    </div>
                  )}
                  {post.jobCandCurrStage === '2p' && (
                    <button 
                      onClick={() => openInterviewSchedulerModal(post.postId)}
                      className="action-button interview-scheduler-button">
                      면접 일정 정하기
                    </button>
                  )}
                  {post.jobCandCurrStage === '3n' && (() => {
                    const interview = scheduledInterviews[post.postId];
                    const now = new Date();
                    const isInterviewStarted = interview && interview.iso && new Date(interview.iso) <= now;
                    const remainingTime = interview && interview.deadline ? calculateRemainingTime(new Date(interview.deadline)) : '';
                    return (
                      <>
                        <div style={{ marginBottom: 8, width: 'fit-content' }}>
                          <button 
                            onClick={() => openInterviewPreparationModal(post.postId)}
                            className="action-button preparation-button"
                            style={{
                              borderRadius: '999px',
                              background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 15,
                              padding: '7px 15px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              border: 'none',
                              boxShadow: '0 2px 8px #fbbf2433',
                              cursor: 'pointer',
                              transition: 'background 0.18s, box-shadow 0.18s, transform 0.14s',
                              outline: 'none',
                              minWidth: 'auto',
                              width: 'auto',
                              lineHeight: 1.2
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
                              e.currentTarget.style.boxShadow = '0 6px 18px #fbbf2444';
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
                              e.currentTarget.style.boxShadow = '0 2px 8px #fbbf2433';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            {/* Outline Lightbulb SVG */}
                            <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
                              <path d="M9 18h6" />
                              <path d="M10 22h4" />
                              <path d="M12 2a7 7 0 0 0-4 12c.3.3.5.7.5 1.1V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.9c0-.4.2-.8.5-1.1A7 7 0 0 0 12 2z" />
                            </svg>
                            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.5px' }}>면접 예상질문</span>
                          </button>
                        </div>
                        <div className="button-group">
                          <button 
                            onClick={() => openInterviewPreparationModal(post.postId)}
                            style={{ display: 'none' }}
                          />
                          <button 
                            onClick={() => navigateToInterview(post.postId)}
                            className={`action-button interview-button ${!isInterviewStarted ? 'disabled' : ''}`}
                            disabled={!isInterviewStarted}>
                          {interview && interview.date
                            ? isInterviewStarted 
                              ? remainingTime || '면접 보러가기'
                              : `${interview.date} (시작 대기중)`
                            : '면접 일정'}
                        </button>
                      </div>
                    </>
                  );
                })()}
                  {post.jobCandCurrStage === '3y' && (
                    <button 
                      onClick={() => navigate(`/interview-result/${post.postId}`)}
                      className="action-button result-button"
                      disabled
                      style={{ cursor: 'not-allowed', opacity: 0.7 }}
                    >
                      결과 취합 중
                    </button>
                  )}
                  {(post.jobCandCurrStage === '4n' || post.jobCandCurrStage === '4y') && (
                    <div 
                      className="result-badge"
                      style={{
                        backgroundColor: getStageColor(post.jobCandCurrStage).bg,
                        color: getStageColor(post.jobCandCurrStage).text,
                        border: `1px solid ${getStageColor(post.jobCandCurrStage).border}`,
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {post.jobCandCurrStage === '4y' && (
                        <span style={{ fontSize: '16px' }}>✓</span>
                      )}
                      {post.jobCandCurrStage === '4n' && (
                        <span style={{ fontSize: '16px' }}>✗</span>
                      )}
                      {getStageLabel(post.jobCandCurrStage)}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        // jobPostings 배열이 비어있을 때 표시할 내용
        <p>표시할 공고가 없습니다.</p>
      )}
    </div>
  )}
  {activeTab === 'positionOffer' && (
    <div className="tab-content">
      {jobPostings.filter(post => post.jobCandCurrStage === '1n' || post.jobCandCurrStage === '2n').length > 0 ? (
        <ul>
          {jobPostings.filter(post => post.jobCandCurrStage === '1n' || post.jobCandCurrStage === '2n').map(post => (
            <li key={post.postId} className="job-posting-item">
              {/* 포지션 제안 항목의 내용 - 전체 탭과 유사한 구조 */}
              <div className="job-posting-flex-row">
                <div className="job-posting-content">
                  <div className="company-title-row">
                    <h3>{post.companyName}</h3>
                    <p 
                      onClick={() => handleJobTitleClick(post.postId)}
                      className="clickable-job-title"
                    >
                      {post.postTitle}
                    </p>
                  </div>
                  <div className="job-posting-dates">
                    <p>등록일: {post.postPostedDate}</p>
                    <p>마감일: {post.postExpiryDate}</p>
                  </div>
                </div>
                <div className="job-posting-action-col">
                  <button onClick={() => handleGoToSubmitPortfolio(post.postId)}
                    className="submit-portfolio-button">
                  포트폴리오 제출하기
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p>표시할 포지션 제안이 없습니다.</p>
    )}
  </div>
)}

{activeTab === 'interviewOffer' && (
  <div className="tab-content">
<div>
  {/* 2y (포트폴리오 제출 완료), 2p (면접 수락됨), 3n (면접 일정 확정), 3y (면접 완료) 상태의 공고를 필터링 */}
  {jobPostings.filter(post => post.jobCandCurrStage === '2y' || post.jobCandCurrStage === '2p' || post.jobCandCurrStage === '3n' || post.jobCandCurrStage === '3y').length > 0 ? (
    <ul>
      {jobPostings.filter(post => post.jobCandCurrStage === '2y' || post.jobCandCurrStage === '2p' || post.jobCandCurrStage === '3n' || post.jobCandCurrStage === '3y').map(post => (
        <li key={post.postId} className="job-posting-item">
          <div className="job-posting-flex-row">
            <div className="job-posting-content">
              <div className="company-title-row">
                <h3>{post.companyName}</h3>
                <p 
                  onClick={() => handleJobTitleClick(post.postId)}
                  className="clickable-job-title"
                >
                  {post.postTitle}
                </p>
              </div>
              <div className="job-posting-dates">
                <p>등록일: {post.postPostedDate}</p>
                <p>마감일: {post.postExpiryDate}</p>
              </div>
            </div>
            <div className="job-posting-action-col">
              {/* jobCandCurrStage 값에 따라 버튼 표시 */}
              {post.jobCandCurrStage === '3y' ? (
                <button 
                  onClick={() => navigate(`/interview-result/${post.postId}`)}
                  className="action-button result-button"
                  disabled
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                >
                  결과 취합 중
                </button>
              ) : post.jobCandCurrStage === '2y' ? (
                <div 
                  className="pending-status"
                  style={{
                    backgroundColor: '#fef5e7',
                    color: '#d69e2e',
                    border: '1px solid #fbd38d',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    cursor: 'default',
                    userSelect: 'none'
                  }}
                >
                  <img src={process.env.PUBLIC_URL + '/icons/interview.svg'} alt="interview" style={{ width: 20, height: 20, verticalAlign: 'middle' }} />
                  면접 수락 요청 중
                </div>
              ) : post.jobCandCurrStage === '2p' ? (
                <button 
                  onClick={() => openInterviewSchedulerModal(post.postId)}
                  className="action-button interview-scheduler-button">
                면접 일정 정하기
              </button>
            ) : post.jobCandCurrStage === '3n' ? (
              (() => {
                const interview = scheduledInterviews[post.postId];
                const now = new Date();
                const isInterviewStarted = interview && interview.iso && new Date(interview.iso) <= now;
                const remainingTime = interview && interview.deadline ? calculateRemainingTime(new Date(interview.deadline)) : '';
                
                return (
                  <div className="button-group">
                    <button 
                      onClick={() => openInterviewPreparationModal(post.postId)}
                      className="action-button preparation-button">
                      면접 예상질문
                    </button>
                    <button 
                      onClick={() => navigateToInterview(post.postId)}
                      className={`action-button interview-button ${!isInterviewStarted ? 'disabled' : ''}`}
                      disabled={!isInterviewStarted}>
                    {interview && interview.date
                      ? isInterviewStarted 
                        ? remainingTime || '면접 보러가기'
                        : `${interview.date} (시작 대기중)`
                      : '면접 일정'}
                  </button>
                </div>
              );
            })()
          ) : null}
        </div>
      </div>
    </li>
  ))}
</ul>
) : (
  <p>표시할 면접 제안이 없습니다.</p>
)}
</div>
</div>
)}




{activeTab === 'resultAnnouncement' && (
  <div className="tab-content">
<div>
  {/* '4n' (불합격), '4y' (합격) 단계만 결과 발표 탭에서 보여주도록 수정 */}
  {jobPostings.filter(post => post.jobCandCurrStage === '4n' || post.jobCandCurrStage === '4y').length > 0 ? (
    <ul>
      {jobPostings.filter(post => post.jobCandCurrStage === '4n' || post.jobCandCurrStage === '4y').map(post => (
        <li key={post.postId} className="job-posting-item">
          <div className="job-posting-flex-row">
            <div className="job-posting-content">
              <div className="company-title-row">
                <h3>{post.companyName}</h3>
                <p 
                  onClick={() => handleJobTitleClick(post.postId)}
                  className="clickable-job-title"
                >
                  {post.postTitle}
                </p>
              </div>
              <div className="job-posting-dates">
                <p>등록일: {post.postPostedDate}</p>
                <p>마감일: {post.postExpiryDate}</p>
              </div>
            </div>
            <div className="job-posting-action-col">
              <div 
                className="result-badge"
                style={{
                  backgroundColor: getStageColor(post.jobCandCurrStage).bg,
                  color: getStageColor(post.jobCandCurrStage).text,
                  border: `1px solid ${getStageColor(post.jobCandCurrStage).border}`,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {post.jobCandCurrStage === '4y' && (
                  <span style={{ fontSize: '16px' }}>✓</span>
                )}
                {post.jobCandCurrStage === '4n' && (
                  <span style={{ fontSize: '16px' }}>✗</span>
                )}
                {getStageLabel(post.jobCandCurrStage)}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p>표시할 결과 발표가 없습니다.</p>
  )}
</div>
</div>
)}

        </div>
      </div>

      {/* 모달 렌더링 */}
      {isJobModalOpen && (<JobSelectionModal onClose={closeJobModal} onSelectJob={handleJobSelected} />)}
      {isRegionModalOpen && (<RegionSelectionModal onClose={closeRegionModal} onSelectRegion={handleRegionSelected} />)}
      {isSalaryModalOpen && (<SalarySelectionModal onClose={closeSalaryModal} onSelectSalary={handleSalarySelected} />)}
      {isCompanySizeModalOpen && (<CompanySizeSelectionModal onClose={closeCompanySizeModal} onSelectCompanySize={handleCompanySizeSelected} />)}
      {isCommuteTimeModalOpen && (<CommuteTimeSelectionModal onClose={closeCommuteTimeModal} onSelectCommuteTime={handleCommuteTimeSelected} />)}
      {/* 복리후생 선택 모달 */}
      <BenefitSelectionModal
        isOpen={isBenefitModalOpen}
        onClose={closeBenefitModal}
        onSave={handleBenefitsSelected}
        selectedBenefits={selectedBenefits}
      />

      {/* 면접 일정 모달 */}
      <InterviewSchedulerModal
        isOpen={isInterviewSchedulerModalOpen}
        onClose={closeInterviewSchedulerModal}
        postId={selectedPostIdForScheduling}
        candidateId={candidateId}
        onSchedule={handleInterviewScheduled}
      />

      {/* 면접 예상질문 모달 */}
      <InterviewPreparationModal
        isOpen={isInterviewPreparationModalOpen}
        onClose={closeInterviewPreparationModal}
        postId={selectedPostIdForPreparation}
        candidateId={candidateId}
      />
    </div>
  );
}

export default CandidateDashboard;

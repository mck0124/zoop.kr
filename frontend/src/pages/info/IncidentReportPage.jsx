import React, { useState, useEffect } from 'react';
import './IncidentReportPage.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import './FaqPage.css';

// SVG 아이콘 컴포넌트들
const MoneyIcon = ({ size = 20, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 8v8"/>
    <path d="M8 12h8"/>
    <path d="M12 6v2"/>
    <path d="M12 16v2"/>
    <path d="M6 12h2"/>
    <path d="M16 12h2"/>
  </svg>
);

const MaskIcon = ({ size = 20, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const LockIcon = ({ size = 20, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const WarningIcon = ({ size = 20, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const EmailIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const EditIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ClockIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

// CheckIcon 컴포넌트 삭제
// LockKeyIcon 컴포넌트 수정
const LockKeyIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <path d="M12 7v4"/>
    <path d="M8 7v4"/>
    <path d="M16 7v4"/>
  </svg>
);

const BuildingIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <rect x="9" y="9" width="1" height="1"/>
    <rect x="14" y="9" width="1" height="1"/>
    <rect x="9" y="14" width="1" height="1"/>
    <rect x="14" y="14" width="1" height="1"/>
    <rect x="9" y="19" width="1" height="1"/>
    <rect x="14" y="19" width="1" height="1"/>
  </svg>
);

const PersonIcon = ({ size = 16, color = '#30C59B' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const INCIDENTS = {
  "회사 관리자": [
    {
      title: "입사 명목으로 돈을 요구했어요.",
      description: "지원자에게 입사 관련 비용을 요구하는 사례를 신고해주세요.",
      icon: "money"
    },
    {
      title: "회사관계자로 사칭하는 곳에 돈을 보냈어요.",
      description: "회사 직원을 사칭한 계좌로 금전을 보낸 경우 신고해주세요.",
      icon: "mask"
    },
    {
      title: "개인정보가 유출되어 돈이 나갔어요.",
      description: "지원자 개인정보가 유출되어 금전 피해가 발생한 사례를 신고해주세요.",
      icon: "lock"
    }
  ],
  "지원자": [
    {
      title: "입사 명목으로 돈을 요구했어요.",
      description: "채용과정에서 입사비, 서류 처리비용 등 금전 요구를 받았다면 신고해주세요.",
      icon: "money"
    },
    {
      title: "회사관계자로 사칭하는 곳에 돈을 보냈어요.",
      description: "회사 관계자를 사칭한 메일, 문자, 전화를 통해 금전 피해가 있었다면 신고해주세요.",
      icon: "mask"
    },
    {
      title: "개인정보가 유출되어 돈이 나갔어요.",
      description: "입사지원 과정에서 개인정보가 유출되어 금전적 피해가 발생했다면 신고해주세요.",
      icon: "lock"
    }
  ]
};

export default function IncidentReportPage() {
  const [role, setRole] = useState('회사 관리자');
  const [report, setReport] = useState({ email: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const { authState } = useAuth();
  const navigate = useNavigate();

  // 아이콘 렌더링 함수
  const renderIcon = (iconName) => {
    switch(iconName) {
      case 'money':
        return <MoneyIcon />;
      case 'mask':
        return <MaskIcon />;
      case 'lock':
        return <LockIcon />;
      default:
        return null;
    }
  };

  // 로그인 상태에 따라 초기 역할 설정 및 역할 변경 제한
  useEffect(() => {
    if (authState.userType === 'candidate') {
      setRole('지원자');
      // 로그인된 지원자의 경우 이메일 자동 설정
      if (authState.loginId) {
        setReport(prev => ({ ...prev, email: authState.loginId }));
      }
    } else if (authState.userType === 'company') {
      setRole('회사 관리자');
      // 로그인된 기업회원의 경우 이메일 자동 설정
      if (authState.loginId) {
        setReport(prev => ({ ...prev, email: authState.loginId }));
      }
    }
  }, [authState.userType, authState.loginId]);

  // 로그인되지 않은 사용자의 역할 변경
  const handleRoleChange = (selected) => {
    if (!authState.userType) {
      setRole(selected);
    }
  };

  const handleChange = (e) => {
    setReport({ ...report, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 로그인 상태 확인
    if (!authState.userType) {
      setFeedback({ type: 'error', message: '로그인이 필요합니다. 로그인 후 신고해주세요.' });
      navigate('/auth/login');
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });
    
    try {
      // 로그인 상태에 따른 신고자 타입 설정
      let reporterType = 'ANONYMOUS';
      let reporterId = null;
      
      if (authState.userType === 'candidate') {
        reporterType = 'CANDIDATE';
        reporterId = authState.userId;
      } else if (authState.userType === 'company') {
        reporterType = 'COMPANY_ADMIN';
        reporterId = authState.userId;
      }
      
      const requestData = {
        email: report.email,
        content: report.content,
        role: role,
        reporterType: reporterType,
        reporterId: reporterId
      };

      const response = await axios.post('/api/incident-reports/submit', requestData);
      const result = response.data;

      if (result.success) {
        const userTypeText = authState.userType === 'candidate' ? '지원자' : 
                           authState.userType === 'company' ? '회사관리자' : '익명';
        setFeedback({ type: 'success', message: `${userTypeText} 신고가 접수되었습니다. 검토 후 연락드리겠습니다.` });
        
        // 신고 접수 후 신고내용 비우기
        setReport(prev => ({ ...prev, content: '' }));
      } else {
        setFeedback({ type: 'error', message: '신고 접수 실패: ' + (result.message || '잠시 후 다시 시도해주세요.') });
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setFeedback({ type: 'error', message: '로그인이 필요합니다. 로그인 페이지로 이동합니다.' });
          navigate('/auth/login');
          return;
        }
        setFeedback({ type: 'error', message: '신고 접수 실패: ' + (error.response.data.message || `서버 오류 (${error.response.status})`) });
      } else if (error.request) {
        setFeedback({ type: 'error', message: '서버에 연결하지 못했습니다. 신고 내용은 전송되지 않았으니 다시 시도해주세요.' });
      } else {
        setFeedback({ type: 'error', message: '신고 접수 중 오류가 발생했습니다: ' + error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그인 상태에 따른 UI 표시
  const renderLoginStatus = () => {
    if (authState.userType) {
      const userTypeText = authState.userType === 'candidate' ? '지원자' : '회사관리자';
      return (
        <div className="login-status">
          <span className="login-badge">
            <LockKeyIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            로그인됨 ({userTypeText})
          </span>
          <span className="user-email">{authState.loginId}</span>
        </div>
      );
    }
    return (
      <div className="login-status">
        <span className="login-badge anonymous">
          <WarningIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          로그인 필요
        </span>
        <span className="login-required-text">피해사건 신고를 위해서는 로그인이 필요합니다.</span>
        <Link to="/auth/login" className="login-link">
          <LockKeyIcon size={16} color="#ffffff" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          로그인하기
        </Link>
      </div>
    );
  };

  // 역할 탭 렌더링 - 로그인 상태에 따라 제한
  const renderRoleTabs = () => {
    if (authState.userType) {
      // 로그인된 경우: 해당 사용자 유형에 맞는 탭만 활성화
      const isCandidate = authState.userType === 'candidate';
      const isCompany = authState.userType === 'company';
      
      return (
        <div className="role-tabs">
          <button
            className={isCompany ? 'active' : ''}
            disabled={!isCompany}
            style={{ opacity: isCompany ? 1 : 0.5 }}
          >
            <BuildingIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            회사 관리자 {isCompany && '(현재 계정)'}
          </button>
          <button
            className={isCandidate ? 'active' : ''}
            disabled={!isCandidate}
            style={{ opacity: isCandidate ? 1 : 0.5 }}
          >
            <PersonIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            지원자 {isCandidate && '(현재 계정)'}
          </button>
        </div>
      );
    } else {
      // 로그인되지 않은 경우: 모든 탭 활성화
      return (
        <div className="role-tabs">
          <button
            className={role === '회사 관리자' ? 'active' : ''}
            onClick={() => handleRoleChange('회사 관리자')}
          >
            <BuildingIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            회사 관리자
          </button>
          <button
            className={role === '지원자' ? 'active' : ''}
            onClick={() => handleRoleChange('지원자')}
          >
            <PersonIcon size={16} color="#30C59B" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            지원자
          </button>
        </div>
      );
    }
  };

  // 사용자 유형에 따른 제목 렌더링
  const renderTitle = () => {
    if (authState.userType === 'candidate') {
      return <h1><WarningIcon size={40} color="#FF5722" style={{ marginRight: '8px', verticalAlign: 'middle' }} />지원자 피해 사건 신고</h1>;
    } else if (authState.userType === 'company') {
      return <h1><WarningIcon size={40} color="#FF5722" style={{ marginRight: '8px', verticalAlign: 'middle' }} />회사 관리자 피해 사건 신고</h1>;
    } else {
      return <h1><WarningIcon size={40} color="#FF5722" style={{ marginRight: '8px', verticalAlign: 'middle' }} />피해 사건 신고</h1>;
    }
  };

  // 사용자 유형에 따른 신고 내용 플레이스홀더
  const getContentPlaceholder = () => {
    if (authState.userType === 'candidate') {
      return "지원 과정에서 발생한 구체적인 상황과 피해 내용을 상세히 적어주세요. (예: 언제, 어디서, 어떻게 피해를 입었는지, 어떤 회사인지 등)";
    } else if (authState.userType === 'company') {
      return "회사 운영 과정에서 발생한 구체적인 상황과 피해 내용을 상세히 적어주세요. (예: 언제, 어디서, 어떻게 피해를 입었는지, 어떤 지원자인지 등)";
    } else {
      return "구체적인 상황과 피해 내용을 상세히 적어주세요. (예: 언제, 어디서, 어떻게 피해를 입었는지)";
    }
  };

  // 사용자 유형에 따른 도움말 텍스트
  const getHelpText = () => {
    if (authState.userType === 'candidate') {
      return <span>지원자 신고 내용은 검토 후 처리되며, 개인정보는 안전하게 보호됩니다.</span>;
    } else if (authState.userType === 'company') {
      return <span>회사 관리자 신고 내용은 검토 후 처리되며, 개인정보는 안전하게 보호됩니다.</span>;
    } else {
      return <span>신고 내용은 검토 후 처리되며, 개인정보는 안전하게 보호됩니다.</span>;
    }
  };

  // 사용자 유형에 따른 버튼 텍스트
  const getButtonText = () => {
    if (isSubmitting) {
      return <span style={{ display: 'inline-flex', alignItems: 'center' }}><ClockIcon size={16} color="#30C59B" style={{ marginRight: '8px' }} />신고 접수 중...</span>;
    }
    if (authState.userType === 'candidate') {
      return <span style={{ display: 'inline-flex', alignItems: 'center' }}>지원자 신고하기</span>;
    } else if (authState.userType === 'company') {
      return <span style={{ display: 'inline-flex', alignItems: 'center' }}>회사 관리자 신고하기</span>;
    } else {
      return <span style={{ display: 'inline-flex', alignItems: 'center' }}>신고하기</span>;
    }
  };

  // navLinks 배열 추가 (FaqPage와 동일)
  const navLinks = [
    { label: '자주 묻는 질문', href: '/faq', active: window.location.pathname === '/faq' },
    { label: '피해사건 신고', href: '/report', active: window.location.pathname === '/report' },
  ];

  return (
    <div className="customer-main-bg">
      <nav className="customer-nav">
        <div className="customer-nav-logo" style={{ color: '#30C59B', cursor: 'pointer' }} onClick={() => window.location.href = '/support'}>고객센터</div>
        <ul className="customer-nav-links">
          {navLinks.map(link => (
            <li key={link.label} className={link.active ? 'active' : ''}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
          <li><a href="/">HOME</a></li>
        </ul>
      </nav>
      <main className="faq-main-content">
        <div className="incident-report-page">
        {/* 사용자 유형에 따른 제목 */}
        {renderTitle()}
        
                {/* 로그인 상태 표시 */}
        {/* 역할 탭 - 로그인 상태에 따라 다르게 렌더링 */}
        {renderRoleTabs()}
        
        {/* notice-section과 폼을 양옆으로 배치 */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'stretch',
          marginBottom: '2rem',
          width: '100%',
          maxWidth: '1000px',
          justifyContent: 'center',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div className="notice-section">
            {renderLoginStatus()}
            {/* 로그인 상태 표시 내부에 로그인 링크가 있으므로 여기서는 제거 */}
            <div className="notice-header">
              <span className="warning-icon">
                <WarningIcon size={20} color="#30C59B" />
              </span>
              <strong>! 이런 경우 신고해주세요</strong>
            </div>
            <ul className="incident-list">
              {INCIDENTS[authState.userType === 'candidate' ? '지원자' : authState.userType === 'company' ? '회사 관리자' : role].map((item, idx) => (
                <li key={idx} className="incident-item">
                  <div className="incident-title">
                    <span className="bullet">
                      {renderIcon(item.icon)}
                    </span>
                    <b>{item.title}</b>
                  </div>
                  <p className="incident-description">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <form className="report-form" onSubmit={handleSubmit}>
            {feedback.message && (
              <div
                role={feedback.type === 'error' ? 'alert' : 'status'}
                className={`form-feedback ${feedback.type === 'error' ? 'error' : 'success'}`}
              >
                {feedback.message}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email">
                <EmailIcon size={16} color="#30C59B" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                이메일 <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                value={report.email}
                onChange={handleChange}
                placeholder="your@email.com"
                readOnly={!!authState.userType} // 로그인된 경우 읽기 전용
              />
              {authState.userType && (
                <small className="form-help">로그인된 계정의 이메일이 자동으로 설정되었습니다.</small>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="content">
                <EditIcon size={16} color="#30C59B" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                신고 내용 <span className="required">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={report.content}
                onChange={handleChange}
                placeholder={getContentPlaceholder()}
                rows={6}
                required
              />
              <small className="form-help">
                {getHelpText()}
              </small>
            </div>
            
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {getButtonText()}
            </button>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
}

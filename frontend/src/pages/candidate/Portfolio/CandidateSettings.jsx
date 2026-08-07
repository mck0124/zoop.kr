import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../../components/Navbar';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { apiUrl } from '../../../api/config';

export default function CandidateSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 내 정보 폼 상태
  const [profileForm, setProfileForm] = useState({
    candidateName: '',
    candidateEmail: '',
    nickname: ''
  });

  // 비밀번호 변경 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 알림 설정 상태 (개인 맞춤)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    autoMatching: true,
    interviewSchedule: true,
    resultNotification: true,
    marketingEmails: false
  });

  const { authState } = useAuth();

  useEffect(() => {
    if (authState.userId) {
      try {
        const saved = localStorage.getItem(`zoop_candidate_notifications_${authState.userId}`);
        if (saved) setNotificationSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (_) {
        // Ignore malformed local preferences and keep safe defaults.
      }
    }
    // userId가 있으면 사용자 정보 불러오기
    const fetchProfile = async () => {
      if (!authState.userId) return;
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/candidates/${authState.userId}`));
        if (res.ok) {
          const data = await res.json();
          setProfileForm({
            candidateName: data.candidateName || '',
            candidateEmail: data.candidateEmail || '',
            nickname: data.githubLogin || ''
          });
        }
      } catch (e) {
        console.error('profile fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [authState.userId]);

  // 각 입력 필드별 onChange 핸들러를 useCallback으로 안정화
  const handleCandidateNameChange = useCallback((e) => {
    setProfileForm(prev => ({ ...prev, candidateName: e.target.value }));
  }, []);

  const handleCandidateEmailChange = useCallback((e) => {
    setProfileForm(prev => ({ ...prev, candidateEmail: e.target.value }));
  }, []);

  const handleNicknameChange = useCallback((e) => {
    setProfileForm(prev => ({ ...prev, nickname: e.target.value }));
  }, []);

  const handleCurrentPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }));
  }, []);

  const handleNewPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }));
  }, []);

  const handleConfirmPasswordChange = useCallback((e) => {
    setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  // 내 정보 저장
  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/candidates/${authState.userId}/profile`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName: profileForm.candidateName, candidateEmail: profileForm.candidateEmail })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '프로필 저장에 실패했습니다.');
      setStatusMessage('내 정보가 저장되었습니다.');
    } catch (e) {
      setStatusMessage(e.message || '내 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/candidates/${authState.userId}/password`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '비밀번호 변경에 실패했습니다.');
      setStatusMessage('비밀번호가 성공적으로 변경되었습니다.');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setStatusMessage(e.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 알림 설정 저장
  const handleNotificationSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`zoop_candidate_notifications_${authState.userId}`, JSON.stringify(notificationSettings));
      setStatusMessage('알림 설정이 이 브라우저에 저장되었습니다.');
    } catch (e) {
      setStatusMessage('알림 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 계정 삭제
  const handleAccountDelete = async () => {
    setStatusMessage('계정 삭제는 데이터 보존 정책 확인 후 고객센터를 통해 요청해 주세요.');
  };

  const TabButton = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.5rem',
        background: activeTab === id ? 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)' : 'transparent',
        color: activeTab === id ? 'white' : '#4a5568',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: '100%',
        textAlign: 'left',
        boxShadow: activeTab === id ? '0 4px 15px rgba(104, 211, 145, 0.3)' : 'none'
      }}
      onMouseEnter={e => {
        if (activeTab !== id) {
          e.currentTarget.style.background = '#f7fafc';
          e.currentTarget.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={e => {
        if (activeTab !== id) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.transform = 'translateX(0)';
        }
      }}
    >
      {icon}
      {label}
    </button>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder, required = false }) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '0.5rem'
      }}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
          background: '#ffffff'
        }}
        onFocus={e => {
          e.target.style.borderColor = '#68d391';
          e.target.style.boxShadow = '0 0 0 3px rgba(104, 211, 145, 0.1)';
        }}
        onBlur={e => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );

  const SaveButton = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled || saving}
      style={{
        background: disabled || saving
          ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
          : 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)',
        color: disabled || saving ? '#a0aec0' : 'white',
        padding: '0.75rem 2rem',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: disabled || saving ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: disabled || saving ? 'none' : '0 4px 15px rgba(104, 211, 145, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
      onMouseEnter={e => {
        if (!disabled && !saving) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(104, 211, 145, 0.4)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !saving) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(104, 211, 145, 0.3)';
        }
      }}
    >
      {saving && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>
      )}
      {children}
    </button>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
        <Navbar customStyle={{ backgroundColor: '#f7fafc' }} />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          fontSize: '1.1rem',
          color: '#4a5568'
        }}>
          <div style={{ textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#68d391" strokeWidth="2" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
            설정을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <Navbar customStyle={{ backgroundColor: '#f7fafc' }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: '2rem',
          paddingTop: 'calc(2rem + 80px)',
          maxWidth: '1200px',
          margin: '0 auto',
          marginTop: '0'
        }}
      >
        {/* 헤더 */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1a202c', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
            설정
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#4a5568', fontWeight: '500' }}>
            개인 계정과 관련된 모든 설정을 관리하세요
          </p>
          {statusMessage && (
            <div role="status" style={{ margin: '1rem auto 0', maxWidth: 620, padding: '0.75rem 1rem', borderRadius: 10, background: '#ecfdf5', color: '#047857', fontWeight: 600 }}>
              {statusMessage}
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          minHeight: '600px'
        }}>
          {/* 사이드바 */}
          <div style={{
            background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
            padding: '2rem 1.5rem',
            borderRight: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <TabButton
                id="profile"
                label="내 정보"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>}
              />
              <TabButton
                id="security"
                label="보안"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
              <TabButton
                id="notifications"
                label="알림 설정"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
              />
              <TabButton
                id="danger"
                label="계정 삭제"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/></svg>}
              />
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a202c', marginBottom: '2rem' }}>
                  내 정보
                </h2>
                <InputField
                  label="이름"
                  value={profileForm.candidateName}
                  onChange={handleCandidateNameChange}
                  placeholder="이름을 입력하세요"
                  required
                />
                <InputField
                  label="이메일"
                  type="email"
                  value={profileForm.candidateEmail}
                  onChange={handleCandidateEmailChange}
                  placeholder="이메일을 입력하세요"
                  required
                />
                <InputField
                  label="아이디"
                  value={profileForm.nickname}
                  onChange={handleNicknameChange}
                  placeholder="아이디를 입력하세요"
                />
                <div style={{ marginTop: '2rem' }}>
                  <SaveButton onClick={handleProfileSave}>내 정보 저장</SaveButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a202c', marginBottom: '2rem' }}>
                  보안 설정
                </h2>
                <div style={{ background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2d3748', marginBottom: '1rem' }}>
                    비밀번호 변경
                  </h3>
                  <p style={{ color: '#4a5568', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
                  </p>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(104, 211, 145, 0.3)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(104, 211, 145, 0.4)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(104, 211, 145, 0.3)';
                    }}
                  >
                    비밀번호 변경
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1a202c', marginBottom: '2rem' }}>
                  알림 설정
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: '#f7fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                          {key === 'emailNotifications' && '이메일 알림'}
                          {key === 'pushNotifications' && '푸시 알림'}
                          {key === 'autoMatching' && 'AI 자동 매칭'}
                          {key === 'interviewSchedule' && '면접 일정 알림'}
                          {key === 'resultNotification' && '합격/불합격 결과 알림'}
                          {key === 'marketingEmails' && '마케팅/이벤트 메일'}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                          {key === 'emailNotifications' && '이메일로 주요 알림을 받습니다'}
                          {key === 'pushNotifications' && '브라우저 푸시 알림을 받습니다'}
                          {key === 'autoMatching' && 'AI가 적합한 공고를 추천합니다'}
                          {key === 'interviewSchedule' && '면접 일정이 잡히면 알림을 받습니다'}
                          {key === 'resultNotification' && '최종 결과(합격/불합격)를 알림으로 받습니다'}
                          {key === 'marketingEmails' && '이벤트, 프로모션 등 마케팅 메일을 받습니다'}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                        style={{
                          width: '48px',
                          height: '24px',
                          background: value ? 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)' : '#cbd5e0',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: 'white',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: value ? '26px' : '2px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <SaveButton onClick={handleNotificationSave}>알림 설정 저장</SaveButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(254, 178, 178, 0.3)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)' }} />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#1a202c', margin: '0', lineHeight: '1.2', letterSpacing: '-0.025em' }}>
                      계정 삭제
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#718096', margin: '0.5rem 0 0 0', fontWeight: '500', lineHeight: '1.5' }}>
                      영구적으로 계정을 삭제합니다
                    </p>
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)', padding: '2.5rem', borderRadius: '20px', border: '1px solid #fed7d7', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(254, 178, 178, 0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(254, 178, 178, 0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(229, 62, 62, 0.3)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)', borderRadius: '50%' }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#c53030', margin: '0 0 0.75rem 0', lineHeight: '1.3' }}>
                        주의사항
                      </h3>
                      <p style={{ color: '#742a2a', lineHeight: '1.6', margin: '0', fontSize: '1rem', fontWeight: '500' }}>
                        이 작업은 되돌릴 수 없으며 모든 데이터가 영구적으로 삭제됩니다.
                      </p>
                    </div>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: '#c53030', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                      삭제될 데이터:
                    </h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {[
                        { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>), text: '내 정보 및 프로필' },
                        { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>), text: '지원 내역 및 이력서' },
                        { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>), text: '알림 및 메시지 기록' },
                        { icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="M15.5 4.5l-3 3m3 3l-3-3"/><path d="M8.5 4.5l3 3m-3 3l3-3"/></svg>), text: '계정 설정 및 환경설정' }
                      ].map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', transition: 'all 0.2s ease' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c53030' }}>
                            {item.icon}
                          </div>
                          <span style={{ color: '#742a2a', fontSize: '0.95rem', fontWeight: '500', flex: 1 }}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '0', right: '0', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(229, 62, 62, 0.03) 0%, transparent 70%)', borderRadius: '50%', transform: 'translate(30px, -30px)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2d3748', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/><path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/><path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"/><path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/></svg>
                      최종 확인
                    </h4>
                    <p style={{ color: '#4a5568', lineHeight: '1.6', marginBottom: '2rem', fontSize: '1rem', fontWeight: '500' }}>
                      계정 삭제를 진행하려면 아래 버튼을 클릭하세요. 삭제 과정은 즉시 시작되며 취소할 수 없습니다.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleAccountDelete}
                        disabled={saving}
                        style={{
                          background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                          color: 'white',
                          padding: '1.25rem 2.5rem',
                          border: 'none',
                          borderRadius: '16px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 6px 20px rgba(229, 62, 62, 0.3)',
                          opacity: saving ? 0.6 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          minWidth: '180px',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                          if (!saving) {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(229, 62, 62, 0.4)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!saving) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 62, 62, 0.3)';
                          }
                        }}
                      >
                        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)' }} />
                        {saving ? (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                              </circle>
                            </svg>
                            삭제 중...
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/></svg>
                            계정 삭제
                          </>
                        )}
                      </button>
                      <span style={{ fontSize: '0.9rem', color: '#a0aec0', fontWeight: '500' }}>
                        되돌릴 수 없음
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1a202c', marginBottom: '1.5rem' }}>
              비밀번호 변경
            </h3>
            <InputField
              label="현재 비밀번호"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handleCurrentPasswordChange}
              placeholder="현재 비밀번호를 입력하세요"
              required
            />
            <InputField
              label="새 비밀번호"
              type="password"
              value={passwordForm.newPassword}
              onChange={handleNewPasswordChange}
              placeholder="새 비밀번호를 입력하세요 (8자 이상)"
              required
            />
            <InputField
              label="새 비밀번호 확인"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="새 비밀번호를 다시 입력하세요"
              required
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <SaveButton onClick={handlePasswordChange}>비밀번호 변경</SaveButton>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{ background: '#e2e8f0', color: '#4a5568', padding: '0.75rem 2rem', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cbd5e0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0'; }}
              >
                취소
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

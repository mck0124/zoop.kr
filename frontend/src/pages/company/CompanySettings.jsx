import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { motion } from 'framer-motion';
import SEO from '../../components/SEO';
import { apiUrl } from '../../api/config';

export default function CompanySettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [companyInfo, setCompanyInfo] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('company');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // 폼 상태
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    businessNumber: '',
    ceoName: '',
    companyAddress: ''
  });
  
  const [adminForm, setAdminForm] = useState({
    companyAdminName: '',
    companyAdminEmail: '',
    companyAdminLogin: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    candidateUpdates: true,
    newApplications: true,
    interviewAnalysis: true,
    portfolioMatching: true,
    postExpiry: true
  });

  // 데이터 로드
  const fetchCompanyData = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('jwtToken');
      
      if (!userId || !token) {
        navigate('/auth/login');
        return;
      }

      // 회사 정보 가져오기
      const companyResponse = await fetch(apiUrl(`/api/companyadmins/info/${userId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (companyResponse.ok) {
        const data = await companyResponse.json();
        setCompanyInfo(data);
        setAdminInfo(data);
        
        // 폼 초기값 설정
        setCompanyForm({
          companyName: data.companyName || '',
          businessNumber: data.businessNumber || '',
          ceoName: data.ceoName || '',
          companyAddress: data.companyAddress || ''
        });
        
        setAdminForm({
          companyAdminName: data.adminName || '',
          companyAdminEmail: data.email || '',
          companyAdminLogin: data.companyAdminLogin || ''
        });
      }

      // 알림 설정 가져오기
      const notificationResponse = await fetch(apiUrl('/api/companyadmins/notification-settings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        setNotificationSettings({
          emailNotifications: notificationData.emailNotifications,
          pushNotifications: notificationData.pushNotifications,
          weeklyReports: notificationData.weeklyReports,
          candidateUpdates: notificationData.candidateUpdates,
          newApplications: notificationData.newApplications,
          interviewAnalysis: notificationData.interviewAnalysis,
          portfolioMatching: notificationData.portfolioMatching,
          postExpiry: notificationData.postExpiry
        });
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  // 각 입력 필드별 onChange 핸들러를 useCallback으로 안정화
  const handleCompanyNameChange = useCallback((e) => {
    setCompanyForm(prev => ({ ...prev, companyName: e.target.value }));
  }, []);

  const handleBusinessNumberChange = useCallback((e) => {
    setCompanyForm(prev => ({ ...prev, businessNumber: e.target.value }));
  }, []);

  const handleCeoNameChange = useCallback((e) => {
    setCompanyForm(prev => ({ ...prev, ceoName: e.target.value }));
  }, []);

  const handleCompanyAddressChange = useCallback((e) => {
    setCompanyForm(prev => ({ ...prev, companyAddress: e.target.value }));
  }, []);

  const handleAdminNameChange = useCallback((e) => {
    setAdminForm(prev => ({ ...prev, companyAdminName: e.target.value }));
  }, []);

  const handleAdminEmailChange = useCallback((e) => {
    setAdminForm(prev => ({ ...prev, companyAdminEmail: e.target.value }));
  }, []);

  const handleAdminLoginChange = useCallback((e) => {
    setAdminForm(prev => ({ ...prev, companyAdminLogin: e.target.value }));
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

  const handleCompanySave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(apiUrl(`/api/companies/${companyInfo.companyId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(companyForm)
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Company information updated successfully.' });
        fetchCompanyData(); // 데이터 새로고침
      } else {
        const errorData = await response.text();
        setFeedback({ type: 'error', message: errorData || 'Could not update company information.' });
      }
    } catch (error) {
      console.error('회사 정보 수정 오류:', error);
      setFeedback({ type: 'error', message: 'An error occurred while updating company information.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(apiUrl(`/api/companyadmins/${adminInfo.companyAdminId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: adminForm.companyAdminName,
          email: adminForm.companyAdminEmail
        })
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Administrator information updated successfully.' });
        fetchCompanyData(); // 데이터 새로고침
      } else {
        const errorData = await response.text();
        setFeedback({ type: 'error', message: errorData || 'Could not update administrator information.' });
      }
    } catch (error) {
      console.error('관리자 정보 수정 오류:', error);
      setFeedback({ type: 'error', message: 'An error occurred while updating administrator information.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'The new passwords do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'The new password must be at least 8 characters.' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(apiUrl('/api/companyadmins/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Password changed successfully.' });
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.text();
        setFeedback({ type: 'error', message: errorData || 'Could not change the password.' });
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setFeedback({ type: 'error', message: 'An error occurred while changing the password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    const confirmed = window.confirm(
      'Delete this account?\nThis cannot be undone and all data will be permanently deleted.'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(apiUrl(`/api/companyadmins/${adminInfo.companyAdminId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Account deleted successfully.' });
        localStorage.clear();
        navigate('/');
      } else {
        setFeedback({ type: 'error', message: 'Could not delete the account.' });
      }
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      setFeedback({ type: 'error', message: 'An error occurred while deleting the account.' });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(apiUrl('/api/companyadmins/notification-settings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Notification settings saved successfully.' });
      } else {
        const errorData = await response.text();
        setFeedback({ type: 'error', message: errorData || 'Could not save notification settings.' });
      }
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      setFeedback({ type: 'error', message: 'An error occurred while saving notification settings.' });
    } finally {
      setSaving(false);
    }
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
      onMouseEnter={(e) => {
        if (activeTab !== id) {
          e.currentTarget.style.background = '#f7fafc';
          e.currentTarget.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={(e) => {
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
        onFocus={(e) => {
          e.target.style.borderColor = '#68d391';
          e.target.style.boxShadow = '0 0 0 3px rgba(104, 211, 145, 0.1)';
        }}
        onBlur={(e) => {
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
      onMouseEnter={(e) => {
        if (!disabled && !saving) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(104, 211, 145, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
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
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <Navbar customStyle={{ backgroundColor: '#f7fafc' }} />
      <SEO
        title="Company settings"
        description="Manage company information, administrator details, security, and notifications."
        keywords="company settings, administrator, security, notifications"
      />
      
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
        <div style={{
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            color: '#1a202c',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Settings
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#4a5568',
            fontWeight: '500'
          }}>
            Manage your company account, security, and notification preferences.
          </p>
          {feedback.message && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              style={{
                maxWidth: '720px',
                margin: '1rem auto 0',
                padding: '0.8rem 1rem',
                borderRadius: '10px',
                border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                background: feedback.type === 'error' ? '#fff7f7' : '#effcf7',
                color: feedback.type === 'error' ? '#991b1b' : '#166534',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            >
              {feedback.message}
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
                id="company"
                label="Company information"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                }
              />
              <TabButton
                id="admin"
                label="Administrator"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                }
              />
              <TabButton
                id="security"
                label="Security"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />
              <TabButton
                id="notifications"
                label="Notifications"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                }
              />
              <TabButton
                id="danger"
                label="Delete account"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                  </svg>
                }
              />
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div style={{ padding: '2rem' }}>
            {activeTab === 'company' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '2rem'
                }}>
                  Company information
                </h2>
                
                <InputField
                  label="Company name"
                  value={companyForm.companyName}
                  onChange={handleCompanyNameChange}
                  placeholder="Enter company name"
                  required
                />
                
                <InputField
                  label="Business registration number"
                  value={companyForm.businessNumber}
                  onChange={handleBusinessNumberChange}
                  placeholder="000-00-00000"
                  required
                />
                
                <InputField
                  label="CEO name"
                  value={companyForm.ceoName}
                  onChange={handleCeoNameChange}
                  placeholder="Enter CEO name"
                />
                
                <InputField
                  label="Company address"
                  value={companyForm.companyAddress}
                  onChange={handleCompanyAddressChange}
                  placeholder="Enter company address"
                />
                
                <div style={{ marginTop: '2rem' }}>
                  <SaveButton onClick={handleCompanySave}>
                    Save company information
                  </SaveButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '2rem'
                }}>
                  Administrator details
                </h2>
                
                <InputField
                  label="Administrator name"
                  value={adminForm.companyAdminName}
                  onChange={handleAdminNameChange}
                  placeholder="Enter administrator name"
                  required
                />
                
                <InputField
                  label="Email"
                  type="email"
                  value={adminForm.companyAdminEmail}
                  onChange={handleAdminEmailChange}
                  placeholder="Enter email"
                  required
                />
                
                <InputField
                  label="Login username"
                  value={adminForm.companyAdminLogin}
                  onChange={handleAdminLoginChange}
                  placeholder="Enter login username"
                  required
                />
                
                <div style={{ marginTop: '2rem' }}>
                  <SaveButton onClick={handleAdminSave}>
                    Save administrator details
                  </SaveButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '2rem'
                }}>
                  Security settings
                </h2>
                
                <div style={{
                  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '1rem'
                  }}>
                    Change password
                  </h3>
                  <p style={{
                    color: '#4a5568',
                    marginBottom: '1.5rem',
                    lineHeight: '1.6'
                  }}>
                    We recommend changing your password regularly to keep your account secure.
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(104, 211, 145, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(104, 211, 145, 0.3)';
                    }}
                  >
                    Change password
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: '#1a202c',
                  marginBottom: '2rem'
                }}>
                  Notification settings
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
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#2d3748',
                          marginBottom: '0.25rem'
                        }}>
                          {key === 'emailNotifications' && 'Email notifications'}
                          {key === 'pushNotifications' && 'Push notifications'}
                          {key === 'weeklyReports' && 'Weekly reports'}
                          {key === 'candidateUpdates' && 'Candidate updates'}
                          {key === 'newApplications' && 'New applications'}
                          {key === 'interviewAnalysis' && 'Interview analysis complete'}
                          {key === 'portfolioMatching' && 'Portfolio matching'}
                          {key === 'postExpiry' && 'Job closing soon'}
                        </h4>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#4a5568'
                        }}>
                          {key === 'emailNotifications' && 'Receive updates by email'}
                          {key === 'pushNotifications' && 'Receive browser push notifications'}
                          {key === 'weeklyReports' && 'Receive a weekly hiring report'}
                          {key === 'candidateUpdates' && 'Receive new candidate updates'}
                          {key === 'newApplications' && 'Get notified when someone applies'}
                          {key === 'interviewAnalysis' && 'Get notified when interview analysis is ready'}
                          {key === 'portfolioMatching' && 'Receive portfolio matching results'}
                          {key === 'postExpiry' && 'Get notified when a job is closing soon'}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotificationSettings({
                          ...notificationSettings,
                          [key]: !value
                        })}
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
                  <SaveButton onClick={handleNotificationSave}>
                    Save notification settings
                  </SaveButton>
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  marginBottom: '2.5rem'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(254, 178, 178, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)'
                    }} />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: '#1a202c',
                      margin: '0',
                      lineHeight: '1.2',
                      letterSpacing: '-0.025em'
                    }}>
                      Delete account
                    </h2>
                    <p style={{
                      fontSize: '1rem',
                      color: '#718096',
                      margin: '0.5rem 0 0 0',
                      fontWeight: '500',
                      lineHeight: '1.5'
                    }}>
                      Permanently delete your account
                    </p>
                  </div>
                </div>

                {/* 경고 카드 */}
                <div style={{
                  background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
                  padding: '2.5rem',
                  borderRadius: '20px',
                  border: '1px solid #fed7d7',
                  marginBottom: '2rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 장식적 배경 요소들 */}
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '120px',
                    height: '120px',
                    background: 'radial-gradient(circle, rgba(254, 178, 178, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '-30px',
                    width: '80px',
                    height: '80px',
                    background: 'radial-gradient(circle, rgba(254, 178, 178, 0.08) 0%, transparent 70%)',
                    borderRadius: '50%'
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 6px 20px rgba(229, 62, 62, 0.3)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        right: '0',
                        bottom: '0',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                        borderRadius: '50%'
                      }} />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        color: '#c53030',
                        margin: '0 0 0.75rem 0',
                        lineHeight: '1.3'
                      }}>
                        Before you continue
                      </h3>
                      <p style={{
                        color: '#742a2a',
                        lineHeight: '1.6',
                        margin: '0',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}>
                        This action cannot be undone. All account data will be permanently deleted.
                      </p>
                    </div>
                  </div>

                  <div style={{
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <h4 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: '#c53030',
                      margin: '0 0 1.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.828 14.828a4 4 0 0 1-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                      </svg>
                      Data that will be deleted:
                    </h4>
                    <div style={{
                      display: 'grid',
                      gap: '1rem'
                    }}>
                      {[
                        { 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9,22 9,12 15,12 15,22"/>
                            </svg>
                          ), 
                          text: 'Company information and profile'
                        },
                        { 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                          ), 
                          text: 'All job postings and candidate data'
                        },
                        { 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                          ), 
                          text: 'Uploaded files and documents'
                        },
                        { 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          ), 
                          text: 'Notifications and message history'
                        },
                        { 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3"/>
                              <path d="M12 1v6m0 6v6"/>
                              <path d="M15.5 4.5l-3 3m3 3l-3-3"/>
                              <path d="M8.5 4.5l3 3m-3 3l3-3"/>
                            </svg>
                          ), 
                          text: 'Account settings and preferences'
                        }
                      ].map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.75rem 0',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c53030'
                          }}>
                            {item.icon}
                          </div>
                          <span style={{
                            color: '#742a2a',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            flex: 1
                          }}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 확인 단계 */}
                <div style={{
                  background: '#ffffff',
                  padding: '2.5rem',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* 장식적 배경 */}
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(229, 62, 62, 0.03) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30px, -30px)'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{
                      fontSize: '1.3rem',
                      fontWeight: '600',
                      color: '#2d3748',
                      margin: '0 0 1rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                        <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                        <path d="M12 3c0 1-1 2-2 2s-2-1-2-2 1-2 2-2 2 1 2 2z"/>
                        <path d="M12 21c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z"/>
                      </svg>
                      Final confirmation
                    </h4>
                    <p style={{
                      color: '#4a5568',
                      lineHeight: '1.6',
                      marginBottom: '2rem',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}>
                      Click below to permanently delete your account.
                      The process starts immediately and cannot be canceled.
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
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
                        onMouseEnter={(e) => {
                          if (!saving) {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(229, 62, 62, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!saving) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(229, 62, 62, 0.3)';
                          }
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          right: '0',
                          bottom: '0',
                          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
                        }} />
                        {saving ? (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                              </circle>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                            Delete account
                          </>
                        )}
                      </button>
                      
                      <span style={{
                        fontSize: '0.9rem',
                        color: '#a0aec0',
                        fontWeight: '500'
                      }}>
                        Cannot be undone
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '1.5rem'
            }}>
              Change password
            </h3>
            
              <InputField
                label="Current password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handleCurrentPasswordChange}
                placeholder="Enter your current password"
              required
            />
            
            <InputField
                label="New password"
              type="password"
              value={passwordForm.newPassword}
              onChange={handleNewPasswordChange}
                placeholder="Enter a new password (8+ characters)"
              required
            />
            
            <InputField
                label="Confirm new password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handleConfirmPasswordChange}
                placeholder="Enter the new password again"
              required
            />
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <SaveButton onClick={handlePasswordChange}>
                Change password
              </SaveButton>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: '#e2e8f0',
                  color: '#4a5568',
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#cbd5e0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e2e8f0';
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}

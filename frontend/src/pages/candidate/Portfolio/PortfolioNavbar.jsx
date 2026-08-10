import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../api/config';

function PortfolioNavbar() {
  const [displayedUserName, setDisplayedUserName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expiringPosts, setExpiringPosts] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (authState?.loginId) {
      setDisplayedUserName(authState.loginId);
    } else if (authState?.userName) {
       setDisplayedUserName(authState.userName);
    } else {
      setDisplayedUserName('게스트');
    }
  }, [authState]);

  // 드롭다운 외부 클릭 감지 로직
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, notificationRef]);

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    if (!authState.userId) return;
    
    setLoadingNotifications(true);
    try {
      const response = await fetch(apiUrl(`/api/candidate-notifications/candidate/${authState.userId}?requestingCandidateId=${authState.userId}`), {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // 읽음 상태를 확실하게 처리
        const processedData = data.map(notification => ({
          ...notification,
          read: notification.read ?? notification.isRead ?? false,
          isRead: notification.read ?? notification.isRead ?? false
        }));
        setNotifications(processedData);
        console.log('가져온 알림 데이터:', processedData);
      }
    } catch (error) {
      console.error('알림 가져오기 오류:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    if (!authState.userId) return;
    
    try {
      const response = await fetch(apiUrl(`/api/candidate-notifications/candidate/${authState.userId}/unread-count?requestingCandidateId=${authState.userId}`), {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data || 0);
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 오류:', error);
    }
  };

  // 마감일 임박 공고 가져오기
  const fetchExpiringPosts = async () => {
    if (!authState.userId) return;
    
    try {
      const response = await fetch(apiUrl(`/api/candidates/${authState.userId}/job-postings`));
      if (response.ok) {
        const data = await response.json();
        
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        const expiring = data.filter(post => {
          if (post.postStatus !== 'ACTIVE') return false;
          
          const expiryDate = new Date(post.postExpiryDate);
          return expiryDate <= threeDaysFromNow && expiryDate > now;
        });
        
        setExpiringPosts(expiring);
      }
    } catch (error) {
      console.error('마감일 임박 공고 가져오기 오류:', error);
    }
  };

  // 알림 팝업 토글
  const toggleNotification = async () => {
    console.log('알림 아이콘 클릭됨!');
    console.log('현재 isNotificationOpen:', isNotificationOpen);
    console.log('authState.userId:', authState.userId);
    
    if (!isNotificationOpen) {
      console.log('알림 데이터 가져오기 시작...');
      await fetchNotifications();
      await fetchExpiringPosts();
    }
    setIsNotificationOpen(!isNotificationOpen);
    console.log('isNotificationOpen 변경됨:', !isNotificationOpen);
  };

  // 알림 클릭 처리
  const handleNotificationClick = async (notification) => {
    try {
      console.log('알림 클릭됨:', notification);
      
      // 알림을 읽음 처리
      const response = await fetch(apiUrl(`/api/candidate-notifications/${notification.notificationId}/read`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('알림 읽음 처리 성공');
        // 로컬 상태에서도 읽음 처리
        setNotifications(prev => prev.map(n => 
          n.notificationId === notification.notificationId 
            ? { ...n, read: true, isRead: true }
            : n
        ));
      } else {
        console.error('알림 읽음 처리 실패:', response.status);
      }
      
      // 알림 개수 새로고침
      await fetchUnreadCount();
      
      // 알림 팝업 닫기
      setIsNotificationOpen(false);
      
      // 관련 페이지로 이동
      if (notification.relatedPostId) {
        navigate(`/candidate/dashboard?postId=${notification.relatedPostId}&tab=all`);
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 날짜 포맷팅 함수
  const formatNotificationDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  // 마감일까지 남은 일수 계산
  const getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 주기적으로 알림 개수 새로고침 (30초마다)
  useEffect(() => {
    if (!authState.userId) return;
    
    // 초기 로드
    fetchUnreadCount();
    
    // 30초마다 새로고침
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  // Polling callback intentionally reads the current auth context for this session.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.userId]);

  const handleLogout = () => {
      logout();
      navigate('/auth/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  return (
    <div className="portfolio-navbar">
      <div className="portfolio-navbar-right">
        {/* 알림 버튼 */}
        <div className="notification-container" ref={notificationRef}>
          <div className={`notification-icon ${isNotificationOpen ? 'active' : ''}`} onClick={toggleNotification}>
            <img src="/icons/bell.svg" alt="알림" />
          </div>
          {unreadCount > 0 && (
            <span 
              className="notification-badge" 
              style={{
                position: 'absolute',
                top: '-80px',
                right: '-30px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5rem',
                fontWeight: '700',
                zIndex: 10,
                border: '2px solid #ffffff',
                padding: 0,
                minWidth: '12px',
                minHeight: '12px',
                lineHeight: 1,
                backgroundColor: '#dc2626',
                color: '#ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* 알림 팝업 */}
          {isNotificationOpen && (
            <div className="notification-popup">
              <div className="notification-header">
                <div>
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: '#6b7280' }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    알림
                  </h3>
                  <span className="notification-subtitle">Notifications from the last 30 days</span>
                </div>
              </div>
              
              {loadingNotifications ? (
                <div className="notification-loading">
                  <div style={{ marginBottom: '1rem' }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" stroke="#f3f4f6" strokeWidth="4" fill="none"/>
                      <circle cx="20" cy="20" r="18" stroke="#6b7280" strokeWidth="4" fill="none" 
                        strokeDasharray="113" strokeDashoffset="113"
                        style={{
                          animation: 'spin 1.5s linear infinite',
                          transformOrigin: 'center'
                        }}
                      />
                    </svg>
                  </div>
                  <p style={{ fontWeight: '600', color: '#374151' }}>Loading notifications...</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Please wait</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-section">
                  <h4>Today</h4>
                  <div className="notification-empty">
                    <div className="notification-illustration">
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="35" fill="url(#gradient1)"/>
                        <path d="M30 40L36 46L50 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f3f4f6"/>
                            <stop offset="100%" stopColor="#e5e7eb"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <p>No new notifications</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>We will notify you when there is new activity</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 마감일 임박 공고 섹션 */}
                  {expiringPosts.length > 0 && (
                    <div className="notification-section" style={{ marginBottom: '1.5rem' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        borderRadius: '12px',
                        border: '1px solid #fecaca'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                        </div>
                        <div>
                          <h4 style={{
                            color: '#dc2626',
                            fontSize: '1rem',
                            fontWeight: '700',
                            margin: '0 0 0.25rem 0'
                          }}>
                            마감일 임박 공고
                          </h4>
                          <p style={{
                            color: '#991b1b',
                            fontSize: '0.85rem',
                            margin: 0,
                            opacity: 0.8
                          }}>
                            {expiringPosts.length}개 공고가 3일 이내 마감됩니다
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {expiringPosts.map((post) => {
                          const daysLeft = getDaysUntilExpiry(post.postExpiryDate);
                          const urgencyColor = daysLeft === 1 ? '#dc2626' : daysLeft === 2 ? '#ea580c' : '#d97706';
                          const urgencyBg = daysLeft === 1 ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 
                                          daysLeft === 2 ? 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)' : 
                                          'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)';
                          const urgencyBorder = daysLeft === 1 ? '#fecaca' : daysLeft === 2 ? '#fed7aa' : '#fde68a';
                          
                          return (
                            <div 
                              key={post.postId} 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('마감 임박 공고 클릭:', post.postId, post.postTitle);
                                setIsNotificationOpen(false);
                                setTimeout(() => {
                                  navigate(`/candidate/dashboard?postId=${post.postId}&tab=all`);
                                }, 100);
                              }}
                              style={{
                                padding: '1rem',
                                background: urgencyBg,
                                border: `1px solid ${urgencyBorder}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = `0 0 20px rgba(${daysLeft === 1 ? '220, 38, 38' : daysLeft === 2 ? '234, 88, 12' : '217, 119, 6'}, 0.2), 0 4px 12px rgba(${daysLeft === 1 ? '220, 38, 38' : daysLeft === 2 ? '234, 88, 12' : '217, 119, 6'}, 0.1)`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}

                            >
                              {/* 긴급도 배지 */}
                              <div style={{
                                position: 'absolute',
                                top: '0.75rem',
                                right: '0.75rem',
                                background: urgencyColor,
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}>
                                {daysLeft === 1 ? 'D-1' : daysLeft === 2 ? 'D-2' : 'D-3'}
                              </div>
                              
                              {/* 공고 제목 */}
                              <div style={{
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '0.5rem',
                                paddingRight: '3rem',
                                lineHeight: '1.4'
                              }}>
                                {post.postTitle}
                              </div>
                              
                              {/* 마감일 정보 */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={urgencyColor} strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                                  <path d="M16 2v4M8 2v4M3 10h18"/>
                                </svg>
                                <span style={{
                                  fontSize: '0.85rem',
                                  color: urgencyColor,
                                  fontWeight: '600'
                                }}>
                                  마감일: {formatDate(post.postExpiryDate)}
        </span>
                              </div>
                              
                              {/* 남은 시간 */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={urgencyColor} strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                <span style={{
                                  fontSize: '0.85rem',
                                  color: urgencyColor,
                                  fontWeight: '600'
                                }}>
                                  {daysLeft === 1 ? '내일 마감' : `${daysLeft}일 남음`}
        </span>
                              </div>
                              
                              {/* 클릭 힌트 */}
                              <div style={{
                                position: 'absolute',
                                bottom: '0.75rem',
                                right: '0.75rem',
                                opacity: 0.6
                              }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={urgencyColor} strokeWidth="2">
                                  <path d="M9 18L15 12L9 6"/>
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="notification-section">
                    <h4>Recent notifications</h4>
                    <div className="notification-list">
                      {notifications
                        .sort((a, b) => {
                          const aIsRead = a.read ?? a.isRead;
                          const bIsRead = b.read ?? b.isRead;
                          // 읽지 않은 알림을 먼저, 그 다음에 읽은 알림
                          if (!aIsRead && bIsRead) return -1;
                          if (aIsRead && !bIsRead) return 1;
                          // 둘 다 읽었거나 둘 다 안 읽었으면 최신순
                          return new Date(b.createdAt) - new Date(a.createdAt);
                        })
                        .map((notification) => {
                        const isRead = notification.read ?? notification.isRead ?? false;
                        console.log('알림 읽음 상태:', {
                          notificationId: notification.notificationId,
                          read: notification.read,
                          isRead: notification.isRead,
                          finalIsRead: isRead,
                          message: notification.notificationMessage
                        });
                        // 읽지 않은 알림 스타일 (흰색 배경 + 은은한 초록 네온 테두리)
                        const unreadBg = '#ffffff';
                        const unreadBorder = 'rgba(16, 185, 129, 0.3)';
                        const unreadDot = '#10b981';
                        const unreadText = '#1f2937';
                        const unreadShadow = '0 0 0 1px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.1)';
                        // 읽은 알림 스타일
                        const readBg = '#f9fafb';
                        const readBorder = '#e5e7eb';
                        const readDot = '#9ca3af';
                        const readText = '#6b7280';
                        const readShadow = 'none';
                        return (
                          <div 
                            key={notification.notificationId} 
                            onClick={() => handleNotificationClick(notification)}
                            style={{
                              padding: '1.5rem',
                              background: isRead ? readBg : unreadBg,
                              border: `1px solid ${isRead ? readBorder : unreadBorder}`,
                              borderRadius: '16px',
                              boxShadow: isRead ? readShadow : unreadShadow,
                              marginBottom: '1.2rem',
                              transition: 'all 0.3s ease',
                              opacity: isRead ? 0.8 : 1,
                              cursor: 'pointer',
                              position: 'relative',
                              minHeight: '80px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              overflow: 'hidden',
                              backdropFilter: 'blur(10px)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.15), 0 4px 12px rgba(16, 185, 129, 0.1)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = isRead ? readShadow : unreadShadow;
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}

                          >
                            {/* 상단: 시간과 상태 표시 */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              marginBottom: '0.8rem',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%',
                                  background: isRead ? readDot : unreadDot,
                                  marginRight: 12,
                                  boxShadow: isRead ? 'none' : '0 0 0 3px rgba(16,185,129,0.2)',
                                  position: 'relative'
                                }}>
                                  {!isRead && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-2px',
                                      left: '-2px',
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      background: 'rgba(16,185,129,0.1)',
                                      animation: 'pulse 2s infinite'
                                    }} />
                                  )}
                                </div>
                                <span style={{
                                  color: isRead ? readText : unreadText,
                                  fontWeight: isRead ? 500 : 700,
                                  fontSize: '0.9rem',
                                  letterSpacing: '0.02em',
                                  opacity: isRead ? 0.8 : 1
                                }}>
                                  {formatNotificationDate(notification.createdAt)}
        </span>
                              </div>
                              {/* 우측 화살표 아이콘 */}
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" 
                                style={{
                                  color: isRead ? readDot : unreadDot,
                                  opacity: isRead ? 0.4 : 0.8,
                                  transition: 'all 0.2s ease'
                                }}>
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            
                            {/* 메시지 영역 */}
                            <div style={{
                              color: isRead ? readText : unreadText,
                              fontWeight: isRead ? 400 : 600,
                              fontSize: '1rem',
                              lineHeight: 1.6,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'break-word',
                              letterSpacing: '0.01em'
                            }}>
                              {notification.notificationMessage}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 사용자 프로필 */}
        <div className="portfolio-user-profile" onClick={toggleDropdown} ref={dropdownRef}>
          <img src="/person.png" alt="User Avatar" className="portfolio-user-avatar" />
          <span>{displayedUserName}</span>

          {/* 드롭다운 메뉴 */}
          {isDropdownOpen && (
            <div className="portfolio-dropdown-menu">
              <div className="portfolio-dropdown-item" onClick={() => handleMenuItemClick('/candidate/dashboard')}>
                대시보드
              </div>
              <div className="portfolio-dropdown-item" onClick={() => handleMenuItemClick('/candidate/portfolio')}>
                포트폴리오
              </div>
              <div className="portfolio-dropdown-item" onClick={() => handleMenuItemClick('/candidate/settings')}>
                설정
              </div>
              <div className="portfolio-dropdown-item portfolio-logout-dropdown-item" onClick={handleLogout}>
                로그아웃
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PortfolioNavbar; 

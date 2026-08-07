import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { AccessibleButton, AccessibleLink, ScreenReaderOnly } from './Accessibility';
import { apiUrl } from '../api/config';
import { SUPPORTED_LANGUAGES, useLanguage } from '../context/LanguageContext';

const Navbar = ({ onLangChange, hideAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, setAuthState } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayedUserName, setDisplayedUserName] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [expiringPosts, setExpiringPosts] = useState([]);
  const navbarRef = useRef(null);
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const isAboutPage = location.pathname === '/about';

  // 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // 리사이즈 시 메뉴 자동 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // 스크롤 시 blur 클래스 적용
  useEffect(() => {
    if (!isAboutPage) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAboutPage]);

  // 사용자 이름 설정
  useEffect(() => {
    if (authState?.loginId) {
      setDisplayedUserName(authState.loginId);
    } else if (authState?.userName) {
      setDisplayedUserName(authState.userName);
    } else {
      setDisplayedUserName('게스트');
    }
  }, [authState]);

  // 드롭다운 외부 클릭 감지
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

  // 키보드 네비게이션
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        setMenuOpen(false);
        break;
      case 'Enter':
      case ' ':
        if (e.target.tagName === 'BUTTON') {
          e.preventDefault();
          e.target.click();
        }
        break;
      default:
        break;
    }
  };

  const handleLogoClick = () => {
    setMenuOpen(false);
    // 로고 클릭 플래그 설정
    sessionStorage.setItem('logoClick', 'true');
    // 기업 계정이면 기업 대시보드로, 아니면 기존대로 이동
    if (authState.userType === 'company') {
      if (window.location.pathname === '/company/dashboard') {
        window.location.href = '/company/dashboard';
      } else {
        navigate('/company/dashboard');
      }
    } else {
      if (window.location.pathname === '/') {
        window.location.href = '/';
      } else {
        navigate('/');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthState({ token: null, userType: null, userId: null, loginId: null });
    setMenuOpen(false);
    setIsDropdownOpen(false);

    // 알림 관련 상태도 초기화
    setIsNotificationOpen(false);
    setNotifications([]);
    setUnreadCount(0);
    setLoadingNotifications(false);
    setExpiringPosts([]);

    navigate('/auth/login');
  };

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (onLangChange) onLangChange(nextLanguage);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleNotificationClick = () => {
    // 알림 팝업 토글
    setIsNotificationOpen(prev => !prev);
    // 드롭다운이 열려있다면 닫기
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
    
    // 알림이 열릴 때 데이터 가져오기
    if (!isNotificationOpen && authState.userId) {
      fetchNotifications();
      // 기업회원인 경우 마감일 임박 공고도 가져오기
      if (authState.userType === 'company') {
        fetchExpiringPosts();
      }
    }
  };

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    if (!authState.userId) return;
    
    setLoadingNotifications(true);
    try {
      const endpoint = authState.userType === 'company' 
        ? apiUrl(`/api/company-notifications/company/${authState.userId}?requestingAdminId=${authState.userId}`)
        : apiUrl(`/api/candidate-notifications/candidate/${authState.userId}?requestingCandidateId=${authState.userId}`);
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else if (response.status === 403) {
        console.error('알림 접근 권한이 없습니다.');
      }
    } catch (error) {
      console.error('알림 데이터 가져오기 실패:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    if (!authState.userId) return;
    
    try {
      const endpoint = authState.userType === 'company'
        ? apiUrl(`/api/company-notifications/company/${authState.userId}/unread-count?requestingAdminId=${authState.userId}`)
        : apiUrl(`/api/candidate-notifications/candidate/${authState.userId}/unread-count?requestingCandidateId=${authState.userId}`);
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const count = await response.json();
        setUnreadCount(count);
      } else if (response.status === 403) {
        console.error('알림 개수 접근 권한이 없습니다.');
      }
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    }
  };

  // CSS 애니메이션 스타일 추가 (한 번만)
  useEffect(() => {
    // 이미 스타일이 있는지 확인
    const existingStyle = document.getElementById('navbar-pulse-animation');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'navbar-pulse-animation';
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.1);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById('navbar-pulse-animation');
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, []);

  // 마감일 임박 공고 가져오기 (기업회원만)
  const fetchExpiringPosts = async () => {
    if (!authState.userId || authState.userType !== 'company') return;
    
    console.log('마감일 임박 공고 가져오기 시작:', { userId: authState.userId, userType: authState.userType });
    
    try {
      const response = await fetch(apiUrl('/api/postings/company'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      
      console.log('API 응답 상태:', response.status);
      
      if (response.ok) {
        const posts = await response.json();
        console.log('받은 공고 데이터:', posts);
        
        // 3일 이내 마감되는 ACTIVE 공고 필터링
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        console.log('필터링 기준:', { now: now.toISOString(), threeDaysFromNow: threeDaysFromNow.toISOString() });
        
        const expiring = posts.filter(post => {
          if (!post.postExpiryDate || post.postStatus !== 'ACTIVE') {
            console.log('제외된 공고:', { title: post.postTitle, expiryDate: post.postExpiryDate, status: post.postStatus });
            return false;
          }
          const expiryDate = new Date(post.postExpiryDate);
          const isExpiring = expiryDate <= threeDaysFromNow && expiryDate >= now;
          console.log('공고 검사:', { 
            title: post.postTitle, 
            expiryDate: expiryDate.toISOString(), 
            isExpiring,
            daysLeft: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
          });
          return isExpiring;
        });
        
        console.log('마감일 임박 공고:', expiring);
        setExpiringPosts(expiring);
      } else {
        console.error('API 응답 오류:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('마감일 임박 공고 가져오기 실패:', error);
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
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 알림 클릭 처리 (읽음 처리 + 관련 페이지 이동)
  const handleNotificationItemClick = async (notification) => {
    try {
      // 먼저 알림을 읽음 처리
      const endpoint = authState.userType === 'company'
        ? apiUrl(`/api/company-notifications/${notification.notificationId}/read`)
        : apiUrl(`/api/candidate-notifications/${notification.notificationId}/read`);
      
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      if (response.ok) {
        // 알림 목록과 읽지 않은 개수 새로고침
        fetchNotifications();
        fetchUnreadCount();
        
        // 알림 내용에 따라 관련 페이지로 이동
        const message = notification.notificationMessage;
        const notificationType = notification.notificationType;
        
        // 알림 팝업 닫기
        setIsNotificationOpen(false);
        
        if (authState.userType === 'company') {
          // 기업회원 알림 처리
          let postId = notification.relatedPostId;
          
          // relatedPostId가 없으면 메시지에서 추출 시도
          if (!postId) {
            // 다양한 패턴으로 공고 ID 추출
            const patterns = [
              /공고\s*[-\s]*(\d+)/,
              /공고\s+(\d+)/,
              /(\d+)\s*번\s*공고/,
              /(\d+)/
            ];
            
            for (const pattern of patterns) {
              const match = message.match(pattern);
              if (match) {
                postId = match[1];
                console.log('패턴으로 공고 ID 추출:', postId);
                break;
              }
            }
          }
          
          console.log('최종 추출된 공고 ID:', postId);
          
          // 알림 타입에 따른 처리
          switch (notificationType) {
            case 'NEW_APPLICATION':
              // 새로운 지원자 알림
              if (postId) {
                navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=additional-applicants`);
              } else {
                navigate('/company/dashboard?tab=candidates');
              }
              break;
              
            case 'POST_EXPIRY':
              // 공고 마감 임박 알림
              if (postId) {
                navigate(`/company/dashboard?postId=${postId}&tab=details`);
              } else {
                navigate('/company/dashboard');
              }
              break;
              
            case 'INTERVIEW_ANALYSIS_COMPLETE':
              // 면접 분석 완료 알림
              if (postId) {
                navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=interview-completed`);
              } else {
                navigate('/company/dashboard?tab=candidates');
              }
              break;
              
            case 'PORTFOLIO_ANALYSIS_COMPLETE':
              // 포트폴리오 분석 완료 알림
              if (postId) {
                navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=portfolio-matched`);
              } else {
                navigate('/company/dashboard?tab=candidates');
              }
              break;
              
            case 'MATCHED_CANDIDATE':
              // 매칭된 후보자 알림
              if (postId) {
                navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=matched`);
              } else {
                navigate('/company/dashboard?tab=candidates');
              }
              break;
              
            default:
              // 기본 처리 - 메시지 내용으로 판단
              if (message.includes('지원') || message.includes('지원자')) {
                if (postId) {
                  navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=additional-applicants`);
                } else {
                  navigate('/company/dashboard?tab=candidates');
                }
              } else if (message.includes('공고') || message.includes('채용')) {
                if (postId) {
                  navigate(`/company/dashboard?postId=${postId}&tab=details`);
                } else {
                  navigate('/company/dashboard');
                }
              } else if (message.includes('면접')) {
                if (postId) {
                  navigate(`/company/dashboard?postId=${postId}&tab=candidates&filter=interview-completed`);
                } else {
                  navigate('/company/dashboard?tab=candidates');
                }
              } else {
                // 기본적으로 대시보드로
                navigate('/company/dashboard');
              }
              break;
          }
        } else {
          // 개인회원 알림 처리
          let postId = notification.relatedPostId;
          
          if (!postId) {
            const patterns = [
              /공고\s*[-\s]*(\d+)/,
              /공고\s+(\d+)/,
              /(\d+)\s*번\s*공고/,
              /(\d+)/
            ];
            
            for (const pattern of patterns) {
              const match = message.match(pattern);
              if (match) {
                postId = match[1];
                break;
              }
            }
          }
          
          // 개인회원 알림 타입에 따른 처리
          switch (notificationType) {
            case 'INTERVIEW_ACCEPTED':
            case 'INTERVIEW_SOON':
            case 'FINAL_RESULT':
              // 면접 관련 알림
              if (postId) {
                navigate(`/candidate/dashboard?postId=${postId}&tab=all`);
              } else {
                navigate('/candidate/dashboard');
              }
              break;
              
            case 'COMPANY_MATCHED':
              // 기업 매칭 알림
              if (postId) {
                navigate(`/candidate/dashboard?postId=${postId}&tab=all`);
              } else {
                navigate('/candidate/dashboard');
              }
              break;
              
            default:
              // 기본적으로 대시보드로
              if (postId) {
                navigate(`/candidate/dashboard?postId=${postId}&tab=all`);
              } else {
                navigate('/candidate/dashboard');
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = async () => {
    if (!authState.userId) return;
    
    try {
      const endpoint = authState.userType === 'company'
        ? apiUrl(`/api/company-notifications/company/${authState.userId}/read-all`)
        : apiUrl(`/api/candidate-notifications/candidate/${authState.userId}/read-all`);
      
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      if (response.ok) {
        // 알림 목록과 읽지 않은 개수 새로고침
        fetchNotifications();
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 페이지 이동 시 알림 상태 초기화
  useEffect(() => {
    setIsNotificationOpen(false);
    setNotifications([]);
    setLoadingNotifications(false);
  }, [location.pathname]);

  // 알림 개수 주기적 업데이트 (로그인한 모든 회원)
  useEffect(() => {
    if (authState.token && authState.userId) {
      fetchUnreadCount();
      
      // 30초마다 읽지 않은 알림 개수 업데이트
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  // fetchUnreadCount is intentionally kept stable for the interval lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token, authState.userId]);

  const handleMenuItemClick = (path) => {
    setMenuOpen(false);
    setIsDropdownOpen(false);
    if (path) {
      if (path === '/support') {
        navigate(path);
      } else if (path === '/mypage') {
        // 사용자 타입에 따라 다른 마이페이지로 이동
        if (authState.userType === 'company') {
          navigate('/company/dashboard');
        } else if (authState.userType === 'candidate') {
          navigate('/candidate/dashboard');
        } else {
          navigate('/');
        }
      } else if (path === '/settings') {
        // 사용자 타입에 따라 다른 설정 페이지로 이동
        if (authState.userType === 'company') {
          navigate('/company/settings');
        } else if (authState.userType === 'candidate') {
          navigate('/candidate/settings');
        } else {
          navigate('/settings');
        }
      } else {
        navigate(path);
      }
    }
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString();
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제 ' + date.toLocaleTimeString();
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <header
      className={`zoop-navbar ${isAboutPage ? `about${scrolled ? ' scrolled' : ''}` : ''}`}
      ref={navbarRef}
      role="banner"
      aria-label="메인 네비게이션"
    >
      <AccessibleButton
        className="logo-button"
        onClick={handleLogoClick}
        ariaLabel="ZOOP 홈으로 이동"
        onKeyDown={handleKeyDown}
      >
        <img 
          src="/logo_zoop.png" 
          alt="ZOOP 로고" 
          className="logo-img" 
        />
      </AccessibleButton>

      <AccessibleButton
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        ariaLabel={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={menuOpen}
        aria-controls="main-menu"
        onKeyDown={handleKeyDown}
      >
        <ScreenReaderOnly>메뉴</ScreenReaderOnly>
        ☰
      </AccessibleButton>

      <nav 
        className="nav-links desktop-only"
        role="navigation"
        aria-label="메인 메뉴"
        id="main-menu"
        ref={menuRef}
      >
        <AccessibleLink
          onClick={() => handleMenuItemClick('/about')}
          ariaLabel="회사 소개"
          role="menuitem"
        >
          회사 소개
        </AccessibleLink>
        <AccessibleLink
          onClick={() => handleMenuItemClick('/notice')}
          ariaLabel="공지사항"
          role="menuitem"
        >
          공지사항
        </AccessibleLink>
        <AccessibleLink
          onClick={() => handleMenuItemClick('/support')}
          ariaLabel="고객센터"
          role="menuitem"
        >
          고객센터
        </AccessibleLink>
        <AccessibleLink
          onClick={() => handleMenuItemClick('/faq')}
          ariaLabel="자주 묻는 질문"
          role="menuitem"
        >
          자주 묻는 질문
        </AccessibleLink>
        <AccessibleLink
          onClick={() => handleMenuItemClick('/careers')}
          ariaLabel="채용"
          role="menuitem"
        >
          채용
        </AccessibleLink>
      </nav>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <nav 
          className={`mobile-menu ${menuOpen ? 'active' : ''}`}
          role="navigation"
          aria-label="모바일 메뉴"
          aria-hidden="false"
        >
          <AccessibleLink
            onClick={() => handleMenuItemClick('/about')}
            ariaLabel="회사 소개"
            role="menuitem"
            tabIndex="0"
          >
            회사 소개
          </AccessibleLink>
          <AccessibleLink
            onClick={() => handleMenuItemClick('/notice')}
            ariaLabel="공지사항"
            role="menuitem"
            tabIndex="0"
          >
            공지사항
          </AccessibleLink>
          <AccessibleLink
            onClick={() => handleMenuItemClick('/support')}
            ariaLabel="고객센터 (새 창에서 열림)"
            external={true}
            role="menuitem"
            tabIndex="0"
          >
            고객센터
          </AccessibleLink>
          <AccessibleLink
            onClick={() => handleMenuItemClick('/faq')}
            ariaLabel="자주 묻는 질문"
            role="menuitem"
            tabIndex="0"
          >
            자주 묻는 질문
          </AccessibleLink>
          <AccessibleLink
            onClick={() => handleMenuItemClick('/careers')}
            ariaLabel="채용"
            role="menuitem"
            tabIndex="0"
          >
            채용
          </AccessibleLink>

          <div className="mobile-language-selector" role="group" aria-label="Language selection">
            <span aria-hidden="true">Language</span>
            {SUPPORTED_LANGUAGES.map(item => (
              <button
                type="button"
                key={item.code}
                onClick={() => handleLanguageChange(item.code)}
                aria-pressed={language === item.code}
                className={language === item.code ? 'active' : ''}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          {authState.token ? (
            <>
              <div className="mobile-user-info">
                <img src="/person.png" alt="User Avatar" className="mobile-user-avatar" />
                <span className="mobile-user-name">{displayedUserName}</span>
              </div>
              
              {/* 모바일 알림 버튼 (기업회원과 개인회원 모두) */}
              <div className="mobile-notification-button" onClick={handleNotificationClick}>
                <img src="/icons/bell.svg" alt="알림" className="mobile-notification-icon" />
                {unreadCount > 0 && (
                  <span className="mobile-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                <span className="mobile-notification-text">알림</span>
              </div>
              
              <AccessibleButton
                onClick={() => handleMenuItemClick('/candidate/dashboard')}
                ariaLabel="마이페이지"
                role="menuitem"
                tabIndex="0"
                className="mobile-menu-item"
              >
                마이페이지
              </AccessibleButton>
              <AccessibleButton
                onClick={() => handleMenuItemClick('/settings')}
                ariaLabel="설정"
                role="menuitem"
                tabIndex="0"
                className="mobile-menu-item"
              >
                설정
              </AccessibleButton>
              <AccessibleButton
                onClick={handleLogout}
                ariaLabel="로그아웃"
                role="menuitem"
                tabIndex="0"
                className="mobile-menu-item logout"
              >
                로그아웃
              </AccessibleButton>
            </>
          ) : (
            <AccessibleLink
              onClick={() => handleMenuItemClick('/auth/login')}
              ariaLabel="로그인"
              role="menuitem"
              tabIndex="0"
            >
              로그인
            </AccessibleLink>
          )}
        </nav>
      )}

      {/* 전역 언어 변경 버튼 */}
      <div className="lang-toggle desktop-only" role="group" aria-label="Language selection" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', position: 'absolute', right: '12rem', top: '50%', transform: 'translateY(-50%)' }}>
        {SUPPORTED_LANGUAGES.map((item, index) => (
          <React.Fragment key={item.code}>
            {index > 0 && <span style={{ color: '#bbb', fontWeight: 400 }}>|</span>}
            <button
              className="lang-btn"
              style={{
                fontWeight: language === item.code ? 'bold' : 'normal',
                color: language === item.code ? '#19b47a' : '#888',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: 0
              }}
              onClick={() => handleLanguageChange(item.code)}
              aria-label={`View in ${item.name}`}
              aria-pressed={language === item.code}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* 데스크톱 사용자 프로필 드롭다운 */}
      {!hideAuth && (
        <div className="auth-buttons desktop-only">
          {authState.token ? (
            <>
              {/* 알림 버튼 추가 (기업회원과 개인회원 모두) */}
              <div className={`notification-button ${isNotificationOpen ? 'active' : ''}`} onClick={handleNotificationClick} ref={notificationRef}>
                <img src="/icons/bell.svg" alt="알림" className="notification-icon" />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
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
                        <span className="notification-subtitle">최근 30일간의 알림 내역</span>
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={markAllNotificationsAsRead}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.25rem' }}>
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          모두 읽음
                        </button>
                      )}
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
                        <p style={{ fontWeight: '600', color: '#374151' }}>알림을 불러오는 중...</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>잠시만 기다려주세요</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-section">
                        <h4>오늘의 알림</h4>
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
                          <p>새로운 알림이 없습니다</p>
                          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>새로운 활동이 있을 때 알려드릴게요</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 마감일 임박 공고 섹션 (기업회원만) */}
                        {authState.userType === 'company' && expiringPosts.length > 0 && (
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
                                  navigate(`/company/dashboard?postId=${post.postId}&tab=details&forceRefresh=true`);
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
                          <h4>최근 알림</h4>
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
                              const isRead = notification.read ?? notification.isRead;
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
                                  onClick={() => handleNotificationItemClick(notification)}
                                  style={{
                                    padding: '1.5rem',
                                    background: isRead ? readBg : unreadBg,
                                    border: `1px solid ${isRead ? readBorder : unreadBorder}`,
                                    borderRadius: '16px',
                                    boxShadow: isRead ? readShadow : unreadShadow,
                                    marginBottom: '1.2rem',
                                    opacity: isRead ? 0.8 : 1,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    minHeight: '80px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.3s ease',
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
                                        opacity: isRead ? 0.4 : 0.8
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
              
              <div className="user-profile" onClick={toggleDropdown} ref={dropdownRef}>
                <img src="/person.png" alt="User Avatar" className="user-avatar" />
                <span className="user-name">{displayedUserName}</span>
                {/* 드롭다운 메뉴 */}
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => handleMenuItemClick('/mypage')}>
                      마이페이지
                    </div>
                    <div className="dropdown-item" onClick={() => handleMenuItemClick('/settings')}>
                      설정
                    </div>
                    <div className="dropdown-item logout-dropdown-item" onClick={handleLogout}>
                      로그아웃
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <AccessibleLink
              onClick={() => handleMenuItemClick('/auth/login')}
              ariaLabel="로그인"
              className="auth-button login"
            >
              로그인
            </AccessibleLink>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

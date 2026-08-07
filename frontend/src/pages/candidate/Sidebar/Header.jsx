// c/pages/candidate/Header.jsx

import React, { useEffect, useState, useRef } from 'react'; // useState와 useRef가 여기에 import 되어 있어야 합니다.
import './Header.css';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  // --- FIX IS HERE ---
  // 이 부분에 isDropdownOpen과 setIsDropdownOpen 상태를 선언해야 합니다.
  const [displayedUserName, setDisplayedUserName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // <--- 이 라인이 Header 함수 내부에 있어야 합니다.
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // 드롭다운 요소를 참조하기 위한 ref

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
        setIsDropdownOpen(false); // 드롭다운 외부 클릭 시 닫기
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  // 로그아웃 처리 함수
  const handleLogout = () => {
    if (logout) {
      logout();
      console.log("로그아웃 되었습니다.");
      navigate('/auth/login');
    } else {
      console.error("AuthContext에서 logout 함수를 찾을 수 없습니다.");
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginId');
      localStorage.removeItem('userName');
      navigate('/auth/login');
    }
    setIsDropdownOpen(false); // 로그아웃 후 드롭다운 닫기
  };

  // 드롭다운 토글 함수
  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // 마이페이지, 설정 등 클릭 핸들러 (예시)
  const handleMenuItemClick = (path) => {
    if (path === '/mypage') {
      if (authState?.userType === 'candidate') {
        navigate('/candidate/dashboard');
      } else {
        navigate('/mypage');
      }
    } else {
      navigate(path);
    }
    setIsDropdownOpen(false); // 메뉴 클릭 후 드롭다운 닫기
  };

  return (
    <div className="header">
      <div className="header-left">
        {/* Placeholder for menu icon if needed */}
      </div>
      <div className="header-right">
        <span className="header-icon" aria-label="알림">
          <img src="../../icons/bell.svg" alt="알림" />
        </span>
        <span className="header-icon" aria-label="메시지">
          <img src="../../icons/mail.svg" alt="메시지" />
        </span>
        <span className="header-icon" aria-label="채팅">
          <img src="../../icons/message-circle.svg" alt="채팅" />
        </span>
        {/* User Profile Area - 클릭 시 드롭다운 토글 */}
        <div className="user-profile" onClick={toggleDropdown} ref={dropdownRef} style={{ cursor: 'pointer' }}>
          <img src="../../person.png" alt="User Avatar" className="user-avatar" />
          <span>{displayedUserName}</span>

          {/* 드롭다운 메뉴 (isDropdownOpen 상태에 따라 표시) */}
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => handleMenuItemClick('/mypage')}>마이페이지</div>
              <div className="dropdown-item" onClick={() => handleMenuItemClick('/settings')}>설정</div>
              {authState?.token && (
                <div className="dropdown-item logout-dropdown-item" onClick={handleLogout}>
                  로그아웃
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;

// src/pages/candidate/Sidebar.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// SVG Icon Components
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const ProposalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const ResumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const BookmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4l3 3"/>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="m4.93 4.93 2.83 2.83"/>
    <path d="m16.24 16.24 2.83 2.83"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <path d="m4.93 19.07 2.83-2.83"/>
    <path d="m16.24 7.76 2.83-2.83"/>
  </svg>
);

const InterviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="m23 21-2-2"/>
    <path d="m16 3.13 2 2"/>
    <path d="m20 7-2-2"/>
    <path d="m14 7 2-2"/>
    <path d="m18 11-2 2"/>
    <path d="m16 15 2 2"/>
    <path d="m12 15-2 2"/>
    <path d="m8 11-2 2"/>
  </svg>
);

const PaymentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

const CouponIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/>
    <path d="M2 15v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4"/>
    <path d="M9 9h.01"/>
    <path d="M15 9h.01"/>
    <path d="M9 15h.01"/>
    <path d="M15 15h.01"/>
  </svg>
);

const MileageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

function Sidebar({ setActiveSection }) {
  const [expandedMenuId, setExpandedMenuId] = useState(null);
  const navigate = useNavigate();

  const handleMenuItemClick = (menuId) => {
    setExpandedMenuId(expandedMenuId === menuId ? null : menuId);
  };

  return (
    <div className="sidebar">
      <div className="logo-link" onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('로고 클릭됨');
        // 로고 클릭 플래그 설정 (PublicOnlyRoute에서 홈페이지 표시를 위해)
        sessionStorage.setItem('logoClick', 'true');
        // 현재 탭에서 홈페이지로 이동 (인증 정보 유지)
        window.location.replace('/');
      }}>
        <div className="logo">
          <img src="/logo_zoop.png" alt="zoop" />
        </div>
      </div>

      <ul className="menu-list">
        {/* 'My 홈' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'myHome' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('myHome')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'myHome'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('myHome');
            }
          }}
        >
          <span className="icon"><HomeIcon /></span> My home
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'myHome' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'myHome' && (
            <ul className="sub-menu" role="menu">
              <li className="sub-menu-item" role="menuitem">Account details</li>
              <li className="sub-menu-item" role="menuitem">Change password</li>
              <li className="sub-menu-item" role="menuitem">Login management</li>
              <li className="sub-menu-item" role="menuitem">Notifications</li>
              <li className="sub-menu-item" role="menuitem">Log out</li>
            </ul>
          )}
        </li>

        {/* '받은 제안' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'receivedProposals' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('receivedProposals')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'receivedProposals'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('receivedProposals');
            }
          }}
        >
          <span className="icon"><ProposalIcon /></span> Received offers
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'receivedProposals' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'receivedProposals' && (
            <ul className="sub-menu" role="menu">
              <li className="sub-menu-item" role="menuitem">Job offers</li>
              <li className="sub-menu-item" role="menuitem">Resume views</li>
            </ul>
          )}
        </li>

        {/* '이력서/자소서' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'resumeCoverLetter' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('resumeCoverLetter')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'resumeCoverLetter'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('resumeCoverLetter');
            }
          }}
        >
          <span className="icon"><ResumeIcon /></span> Resume / cover letter
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'resumeCoverLetter' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'resumeCoverLetter' && (
            <ul className="sub-menu" role="menu">
              <li
                className="sub-menu-item"
                role="menuitem"
                onClick={() => navigate('/candidate/resume/ResumeSubmissionPage')}
              >
                Build resume
              </li>
              <li className="sub-menu-item" role="menuitem">Manage resume</li>
              <li className="sub-menu-item" role="menuitem">Manage cover letter</li>
            </ul>
          )}
        </li>

        <li className="menu-item" onClick={() => navigate('/candidate/bookmarks')}>
          <span className="icon"><BookmarkIcon /></span> Bookmarks / companies
        </li>

        {/* '지원한 공고' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'appliedJobs' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('appliedJobs')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'appliedJobs'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('appliedJobs');
            }
          }}
        >
          <span className="icon"><SearchIcon /></span> Applied jobs
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'appliedJobs' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'appliedJobs' && (
            <ul className="sub-menu" role="menu">
              <li className="sub-menu-item" role="menuitem">My applications</li>
              <li className="sub-menu-item" role="menuitem">Applications by company</li>
            </ul>
          )}
        </li>

        <li className="menu-item">
          <span className="icon"><SettingsIcon /></span> Offer preferences
        </li>

        {/* '지원내역' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'applicationHistory' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('applicationHistory')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'applicationHistory'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('applicationHistory');
            }
          }}
        >
          <span className="icon"><HistoryIcon /></span> Application history
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'applicationHistory' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'applicationHistory' && (
            <ul className="sub-menu" role="menu">
              <li className="sub-menu-item" role="menuitem">View applications</li>
              <li className="sub-menu-item" role="menuitem">Manage application history</li>
            </ul>
          )}
        </li>
        
        <li className="menu-item">
          <span className="icon"><InterviewIcon /></span> Interviews
        </li>
        
        <li className="menu-item">
          <span className="icon"><PaymentIcon /></span> Payments
        </li>
        
        <li className="menu-item">
          <span className="icon"><CouponIcon /></span> My coupons
        </li>

        {/* '커리어 마일리지' 메뉴 아이템 */}
        <li
          className={`menu-item ${expandedMenuId === 'careerMileage' ? 'active' : ''}`}
          onClick={() => handleMenuItemClick('careerMileage')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedMenuId === 'careerMileage'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleMenuItemClick('careerMileage');
            }
          }}
        >
          <span className="icon"><MileageIcon /></span> Career mileage
          <span className="arrow" aria-hidden="true">
            <svg className={`arrow-icon ${expandedMenuId === 'careerMileage' ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {expandedMenuId === 'careerMileage' && (
            <ul className="sub-menu" role="menu">
              <li className="sub-menu-item" role="menuitem">Earned mileage</li>
              <li className="sub-menu-item" role="menuitem">Used mileage</li>
              <li className="sub-menu-item" role="menuitem">Exchange mileage</li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;

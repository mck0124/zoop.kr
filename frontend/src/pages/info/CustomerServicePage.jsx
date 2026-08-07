import React, { useState } from 'react';
import './CustomerServicePage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const navLinks = [
  { label: '고객센터', href: '/support', active: true },
  { label: '자주 묻는 질문', href: '/faq' },
  { label: '피해사건 신고', href: '/report' },
  { label: 'HOME', href: '/' },
];

const categories = [
  '회원가입/로그인',
  '이력서 작성',
  '채용 공고 지원',
  '면접 일정/결과',
  '포인트/마일리지',
  '기업회원 문의',
];

// 상담원 이모티콘 이미지
function SupportMascot({ size = 80 }) {
  return (
    <img 
      src="/zoopy.png" 
      alt="ZOOP 마스코트" 
      width={size} 
      height={size} 
      className="customer-hero-img"
      style={{ 
        borderRadius: '50%',
        animation: 'bounce 2s ease-in-out infinite'
      }}
    />
  );
}

function CustomerServicePage() {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  function handleSearch() {
    navigate('/faq');
  }

  return (
    <>
      <style>{`body { background: #fff !important; }`}</style>
      <div className="customer-main-bg">
        <nav className="customer-nav">
          <span
            className="customer-nav-logo"
            style={{ cursor: 'pointer' }}
            onClick={e => {
              e.preventDefault();
              navigate('/support');
            }}
            tabIndex={0}
            role="button"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/support');
              }
            }}
          >
            고객센터
          </span>
          <ul className="customer-nav-links">
            {navLinks.filter(link => !(location.pathname === '/support' && link.href === '/support')).map(link => (
              <li key={link.label} className={link.active ? 'active' : ''}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <main className="customer-main-content">
          <div className="customer-hero">
            <SupportMascot size={80} />
            <h1 className="customer-hero-title">무엇을 도와드릴까요?</h1>
            {/* 더욱 세련된 검색창 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0,
              margin: '0 auto 44px auto',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 4px 18px rgba(48,197,155,0.07)',
              borderRadius: 32,
              background: '#fff',
              padding: 2,
            }}>
              <input
                type="text"
                placeholder="궁금한 내용을 검색해보세요"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                style={{
                  flex: 1,
                  padding: '0 24px',
                  border: 'none',
                  borderRadius: '32px 0 0 32px',
                  fontSize: '1.13rem',
                  background: '#fff',
                  outline: 'none',
                  height: 52,
                  boxShadow: '0 1.5px 8px rgba(48,197,155,0.06)',
                  transition: 'background 0.18s, box-shadow 0.18s',
                }}
                onFocus={e => {
                  e.target.style.background = '#f6fff9';
                  e.target.style.boxShadow = '0 0 0 2px #30C59B33';
                }}
                onBlur={e => {
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 1.5px 8px rgba(48,197,155,0.06)';
                }}
              />
              <button
                style={{
                  background: 'linear-gradient(90deg, #30C59B 60%, #22c55e 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0 32px 32px 0',
                  padding: '0 34px',
                  fontWeight: 700,
                  fontSize: '1.13rem',
                  height: 52,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(48,197,155,0.10)',
                  transition: 'background 0.18s, transform 0.18s',
                  minWidth: 110,
                }}
                disabled={!searchInput.trim()}
                onClick={handleSearch}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#22c55e';
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #30C59B 60%, #22c55e 100%)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                검색
              </button>
            </div>
            <div className="customer-categories">
              {categories.map(cat => {
                const handleClick = () => navigate('/faq');
                return (
                  <button
                    key={cat}
                    className="customer-category-btn"
                    onClick={handleClick}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
        <div className="customer-info-section">
          <div className="customer-info-left">
            <h2>ZOOP 고객센터에서<br />24시간 상담받을 수 있어요</h2>
            <div className="customer-info-contacts">
              <div>회원/로그인 문의 <b style={{color: '#22c55e'}}>1661-7654</b></div>
              <div>이력서/포트폴리오 문의 <b style={{color: '#22c55e'}}>1599-4905</b></div>
              <div>채용/면접 문의 <b style={{color: '#22c55e'}}>1599-7987</b></div>
              <div>기업회원 문의 <b style={{color: '#22c55e'}}>1660-1114</b></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerServicePage;

import React from 'react';
import { useNavigate } from 'react-router-dom';

// 언어별 SVG 아이콘 컴포넌트
// Kept for the legacy sidebar variant that imports this module dynamically.
// eslint-disable-next-line no-unused-vars
const LanguageIcon = ({ name }) => {
  switch (name && name.toLowerCase()) {
    case 'python':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><g><path fill="#3776AB" d="M12.09 0c-1.1.005-2.16.1-3.09.27-2.73.48-3.23 1.48-3.23 3.33v2.3h6.46v.77H3.77c-1.8 0-3.23 1.5-3.23 3.33v2.3c0 1.83 1.43 3.33 3.23 3.33h2.3v-2.3c0-1.83 1.43-3.33 3.23-3.33h6.46c1.8 0 3.23-1.5 3.23-3.33v-2.3c0-1.83-1.43-3.33-3.23-3.33h-2.3V3.6c0-1.83-1.43-3.33-3.23-3.33zm-2.3 2.3c.64 0 1.16.52 1.16 1.16 0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16z"/><path fill="#FFD43B" d="M23.46 10.7c-1.8 0-3.23-1.5-3.23-3.33v-2.3c0-1.83-1.43-3.33-3.23-3.33h-2.3v2.3c0 1.83-1.43 3.33-3.23 3.33H3.77c-1.8 0-3.23 1.5-3.23 3.33v2.3c0 1.83 1.43 3.33 3.23 3.33h2.3v-2.3c0-1.83 1.43-3.33 3.23-3.33h6.46c1.8 0 3.23 1.5 3.23 3.33v2.3c0 1.83-1.43 3.33-3.23 3.33h-2.3v-2.3c0-1.83-1.43-3.33-3.23-3.33H3.77c-1.8 0-3.23-1.5-3.23-3.33v-2.3c0-1.83 1.43-3.33 3.23-3.33h2.3v2.3c0 1.83 1.43 3.33 3.23 3.33h6.46c1.8 0 3.23-1.5 3.23-3.33v2.3c0 1.83-1.43 3.33-3.23 3.33h-2.3v-2.3c0-1.83-1.43-3.33-3.23-3.33z"/></g></svg>
      );
    case 'java':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#007396" d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0zm0 22.8C6.037 22.8 1.2 17.963 1.2 12S6.037 1.2 12 1.2 22.8 6.037 22.8 12 17.963 22.8 12 22.8z"/><path fill="#007396" d="M12 5.4c-1.32 0-2.4 1.08-2.4 2.4 0 1.32 1.08 2.4 2.4 2.4s2.4-1.08 2.4-2.4c0-1.32-1.08-2.4-2.4-2.4zm0 3.6c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2z"/></svg>
      );
    case 'javascript':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#F7DF1E" d="M2 2h20v20H2z"/><path d="M17.6 17.2c-.3.6-.7 1.1-1.5 1.1-.6 0-.9-.3-1.1-.7l-1.2.7c.4.8 1.2 1.5 2.6 1.5 1.5 0 2.5-.8 2.5-2.2 0-1.1-.7-1.7-2-2.2l-.7-.3c-.6-.2-.8-.4-.8-.7 0-.3.2-.5.7-.5.5 0 .8.2 1.1.7l1.1-.7c-.4-.7-1-1.1-2.2-1.1-1.3 0-2.2.7-2.2 1.9 0 1.1.8 1.7 2.1 2.2l.7.3c.6.2.8.4.8.7zM9.7 18.3c-.2.4-.5.7-1.1.7-.6 0-.9-.3-1.1-.7l-1.2.7c.4.8 1.2 1.5 2.6 1.5 1.5 0 2.5-.8 2.5-2.2 0-1.1-.7-1.7-2-2.2l-.7-.3c-.6-.2-.8-.4-.8-.7 0-.3.2-.5.7-.5.5 0 .8.2 1.1.7l1.1-.7c-.4-.7-1-1.1-2.2-1.1-1.3 0-2.2.7-2.2 1.9 0 1.1.8 1.7 2.1 2.2l.7.3c.6.2.8.4.8.7z"/></svg>
      );
    case 'c++':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#00599C" d="M12 2.248c-.3 0-.59.08-.84.23L3.1 7.27c-.5.29-.81.83-.81 1.41v6.64c0 .58.31 1.12.81 1.41l8.06 4.79c.25.15.54.23.84.23s.59-.08.84-.23l8.06-4.79c.5-.29.81-.83.81-1.41V8.68c0-.58-.31-1.12-.81-1.41l-8.06-4.79c-.25-.15-.54-.23-.84-.23zm0 1.5l7.5 4.47v6.56l-7.5 4.47-7.5-4.47V8.22l7.5-4.47zm-2.25 7.5v1.5h-1.5v1.5h1.5v1.5h1.5v-1.5h1.5v-1.5h-1.5zm6 0v1.5h-1.5v1.5h1.5v1.5h1.5v-1.5h1.5v-1.5h-1.5v-1.5h-1.5z"/></svg>
      );
    case 'go':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#00ADD8"/><text x="12" y="16" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">Go</text></svg>
      );
    case 'ruby':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="10" fill="#CC342D"/><text x="12" y="16" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Ruby</text></svg>
      );
    case 'kotlin':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#7F52FF"/><path d="M4 20L20 4H12L4 12v8z" fill="#FFB300"/></svg>
      );
    case 'typescript':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#3178C6"/><text x="12" y="16" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">TS</text></svg>
      );
    default:
      return null;
  }
};

// 확성기(메가폰) 아이콘 (공고 관리)
const MegaphoneIcon = () => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#eafff7',
    color: '#19b47a',
    marginRight: 16,
    boxShadow: 'none',
    fontSize: 18
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#19b47a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10v4a2 2 0 0 0 2 2h2l5 5V3l-5 5H4a2 2 0 0 0-2 2z"/>
      <path d="M16 8a4 4 0 0 1 0 8"/>
    </svg>
  </span>
);

// 등록된 공고 뱃지
const Badge = ({ count }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.18rem 0.7rem',
    borderRadius: '999px',
    background: '#eafff7',
    border: '1.5px solid #35cfce',
    color: '#19b47a',
    fontWeight: 700,
    fontSize: '0.98rem',
    marginRight: 10,
    boxShadow: 'none',
    letterSpacing: '-0.5px',
  }}>
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="#19b47a" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}>
      <circle cx="10" cy="10" r="9" fill="#eafff7"/>
      <path d="M6 10.5l2.5 2.5 5-5" />
    </svg>
    {count}
  </span>
);

export default function CompanySidebar({
  postings,
  loading,
  selectedPostId,
  onPostClick,
  onDirectApplicantsClick,
  showDirectApplicants,
}) {
  const navigate = useNavigate();

  const hoverBoxStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    border: '1px solid #f1f3f4'
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-6px)';
    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
  };

  const handleAddDraftPost = () => {
    navigate('/company/recruit/create');
  };

  const handlePostClick = (postId) => {
    if (selectedPostId === postId) {
      onPostClick(null);
    } else {
      onPostClick(postId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <aside
      style={{
        ...hoverBoxStyle,
        marginTop: '9.0rem',
        marginLeft: '3rem',
        padding: '2rem',
        width: '360px',
        position: 'sticky',
        top: '6rem',
        height: 'fit-content',
        fontSize: '0.85rem',
        color: '#222',
        background: '#ffffff',
        border: '1px solid #f1f3f4',
        minHeight: '1500px',
        overflow: 'visible',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#111',
        marginBottom: '1.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #f8f9fa'
      }}>
        <MegaphoneIcon />
        Job postings
      </h3>

      <button
        onClick={handleAddDraftPost}
        style={{
          background: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '1rem',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(104, 211, 145, 0.3)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          <span style={{ fontSize: '1rem', fontWeight: '600' }}>Add new job</span>
        </div>
      </button>

      <div
        onClick={() => onDirectApplicantsClick && onDirectApplicantsClick()}
        style={{
          padding: '1.5rem',
          border: showDirectApplicants ? '1px solid #68d391' : '1px solid #e2e8f0',
          borderRadius: '14px',
          background: showDirectApplicants
            ? 'linear-gradient(135deg, #e6fffa 0%, #c6f6d5 100%)'
            : 'transparent',
          color: showDirectApplicants ? '#22543d' : '#4a5568',
          transition: 'all 0.3s ease',
          marginBottom: '2rem',
          position: 'relative',
          cursor: 'pointer',
          boxShadow: showDirectApplicants
            ? '0 8px 24px rgba(56, 178, 172, 0.13)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={(e) => {
          if (!showDirectApplicants) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!showDirectApplicants) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
            View additional candidates
          </span>
        </div>
        </div>

      {loading ? (
        <div style={{
          color: '#666',
          fontSize: 15,
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          borderRadius: '16px',
          border: '2px dashed #dee2e6'
        }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '1rem' }}>
          <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
          </circle>
        </svg>
        Loading job postings...
        </div>
      ) : postings.length === 0 ? (
        <div style={{
          color: '#666',
          fontSize: 15,
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
          borderRadius: '16px',
          border: '2px dashed #dee2e6'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '1rem' }}>
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          No job postings yet.
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#333',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            paddingBottom: '0.8rem',
            borderBottom: '1px solid #f1f3f4'
          }}>
            <Badge count={postings.length} />
            Your job postings
          </h4>
          <div style={{
            maxHeight: '1200px',
            overflowY: 'auto',
            paddingRight: '0.5rem',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f1f3f4',
            width: '95%',
          }}>
            <style>
              {`
                .postings-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .postings-scroll::-webkit-scrollbar-track {
                  background: #f1f3f4;
                  border-radius: 3px;
                }
                .postings-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 3px;
                }
                .postings-scroll::-webkit-scrollbar-thumb:hover {
                  background: #a0aec0;
                }
              `}
            </style>
            <div className="postings-scroll">
              {postings.map((post) => {
                const isSelected = String(selectedPostId) === String(post.postId);
                // 언어 파싱 (콤마, 슬래시, 공백 등)
                const langs = post.postProgrammingLanguage
                  ? post.postProgrammingLanguage.split(/[,/\s]+/).filter(Boolean)
                  : [];
                if (langs.length === 0) return null;
                if (langs.length === 1) {
                  return (
                    <div
                      key={post.postId}
                      onClick={() => handlePostClick(post.postId)}
                      style={{
                        padding: '1.5rem',
                        border: `1px solid ${isSelected ? '#68d391' : '#e2e8f0'}`,
                        borderRadius: '14px',
                        background: isSelected
                          ? 'linear-gradient(135deg, #e6fffa 0%, #c6f6d5 100%)'
                          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        color: isSelected ? '#22543d' : '#2d3748',
                        transition: 'all 0.3s ease',
                        marginTop: '1.2rem',
                        paddingTop: '1.2rem',
                        position: 'relative',
                        cursor: 'pointer',
                        boxShadow: isSelected
                          ? '0 8px 24px rgba(56, 178, 172, 0.13)'
                          : '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        }
                      }}
                    >
                      {/* 상태 표시 배지 */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: post.postStatus === 'ACTIVE' ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #ed8936, #dd6b20)',
                        color: 'white',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        zIndex: 10
                      }}>
                        {post.postStatus === 'ACTIVE' ? 'Active' : 'Closed'}
                      </div>
                      <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '0.8rem', 
                        color: '#2d3748', 
                        fontSize: '1.1rem',
                        paddingRight: '4rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{post.postTitle}</div>
                      <div style={{ fontSize: '0.9rem', color: '#4a5568', display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'column' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 위치 SVG */}
                          <svg width="18" height="18" fill="none" stroke="#48bb78" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/>
                            <circle cx="12" cy="11" r="2.5"/>
                          </svg>
                      {post.postLocation || 'Location not set'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 머니백 SVG */}
                          <svg width="18" height="18" fill="none" stroke="#ecc94b" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="5" y="7" width="14" height="12" rx="2" stroke="#ecc94b" fill="#f6e05e"/>
                            <path d="M12 17v-6" stroke="#b7791f"/>
                            <path d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="#b7791f"/>
                            <path d="M17 7V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2" stroke="#b7791f"/>
                          </svg>
                          {post.postSalaryStart || '0'} ~ {post.postSalaryEnd || '0'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 사람 두 명 SVG */}
                          <svg width="18" height="18" fill="none" stroke="#4fd1c5" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="7" cy="10" r="3"/>
                            <circle cx="17" cy="10" r="3"/>
                            <path d="M7 13c-2.67 0-8 1.34-8 4v3h22v-3c0-2.66-5.33-4-8-4"/>
                          </svg>
                      {post.postHeadcount || 0} openings
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 달력 SVG */}
                          <svg width="18" height="18" fill="none" stroke="#a0aec0" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <path d="M16 2v4M8 2v4M3 10h18"/>
                          </svg>
                          {formatDate(post.postPostedDate)}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', right: '1.2rem', bottom: '1.2rem', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                        <span
                          style={{
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                            padding: '5px 8px',
                            color: '#2563eb',
                            fontSize: 12,
                            fontWeight: 800,
                            zIndex: 3,
                            whiteSpace: 'nowrap'
                          }}
                        >{langs[0]}</span>
                      </div>
                    </div>
                  );
                }
                // 2개 이상
                return (
                  <div
                    key={post.postId}
                    onClick={() => handlePostClick(post.postId)}
                    style={{
                      padding: '1.5rem',
                      border: `1px solid ${isSelected ? '#68d391' : '#e2e8f0'}`,
                      borderRadius: '14px',
                      background: isSelected
                        ? 'linear-gradient(135deg, #e6fffa 0%, #c6f6d5 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      color: isSelected ? '#22543d' : '#2d3748',
                      transition: 'all 0.3s ease',
                      marginTop: '1.2rem',
                      paddingTop: '1.2rem',
                      position: 'relative',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 8px 24px rgba(56, 178, 172, 0.13)'
                        : '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      }
                    }}
                  >
                    {/* 상태 표시 배지 */}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: post.postStatus === 'ACTIVE' ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #ed8936, #dd6b20)',
                      color: 'white',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      zIndex: 10
                    }}>
                      {post.postStatus === 'ACTIVE' ? 'Active' : 'Closed'}
                    </div>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '0.8rem', 
                      color: '#2d3748', 
                      fontSize: '1.1rem',
                      paddingRight: '4rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{post.postTitle}</div>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568', display: 'flex', gap: '1rem', flexWrap: 'wrap', flexDirection: 'column' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* 위치 SVG */}
                        <svg width="18" height="18" fill="none" stroke="#48bb78" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/>
                          <circle cx="12" cy="11" r="2.5"/>
                        </svg>
                        {post.postLocation || 'Location not specified'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* 머니백 SVG */}
                        <svg width="18" height="18" fill="none" stroke="#ecc94b" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="5" y="7" width="14" height="12" rx="2" stroke="#ecc94b" fill="#f6e05e"/>
                          <path d="M12 17v-6" stroke="#b7791f"/>
                          <path d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="#b7791f"/>
                          <path d="M17 7V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v2" stroke="#b7791f"/>
                        </svg>
                        {post.postSalaryStart || '0'} ~ {post.postSalaryEnd || '0'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* 사람 두 명 SVG */}
                        <svg width="18" height="18" fill="none" stroke="#4fd1c5" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="7" cy="10" r="3"/>
                          <circle cx="17" cy="10" r="3"/>
                          <path d="M7 13c-2.67 0-8 1.34-8 4v3h22v-3c0-2.66-5.33-4-8-4"/>
                        </svg>
                        {post.postHeadcount || 0} openings
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* 달력 SVG */}
                        <svg width="18" height="18" fill="none" stroke="#a0aec0" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        {formatDate(post.postPostedDate)}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', right: '1.2rem', bottom: '1.2rem', display: 'flex', alignItems: 'center', zIndex: 2 }}>
                      <span
                        style={{
                          background: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                          padding: '5px 8px',
                          color: '#2563eb',
                          fontSize: 12,
                          fontWeight: 800,
                          zIndex: 3,
                          whiteSpace: 'nowrap'
                        }}
                      >{langs[0]}</span>
                      <span
                        style={{
                          background: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                          padding: '5px 8px',
                          color: '#2563eb',
                          fontSize: 12,
                          fontWeight: 800,
                          zIndex: 2
                        }}
                      >{langs[1]}</span>
                      {langs.length > 2 && (
                        <span style={{
                          marginLeft: -10,
                          marginRight: 0,
                          fontWeight: 900,
                          fontSize: 18,
                          color: '#b2bec3',
                          background: 'white',
                          borderRadius: '8px',
                          padding: '0 7px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                          zIndex: 1,
                          position: 'relative',
                          left: 0,
                        }}>…</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

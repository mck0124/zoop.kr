// src/pages/Careers.jsx
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import CompactJobCard from '../../components/CompactJobCard';
import { FaSearch } from 'react-icons/fa';
import ApplyForm from '../../components/ApplyForm';
import SEO from '../../components/SEO';
import './Careers.css';
import '../../components/ApplyForm.css';
import '../../components/CompactJobCard.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../api/config';

const LANGUAGES = [
  'Python', 'JavaScript', 'Java', 'C++', 'Go', 'Ruby', 'Kotlin', 'TypeScript', 'Other'
];
const LOCATIONS = [
  ['Seoul', '서울'], ['Gyeonggi', '경기'], ['Incheon', '인천'], ['Busan', '부산'], ['Daegu', '대구'], ['Gwangju', '광주'], ['Daejeon', '대전'], ['Ulsan', '울산'], ['Sejong', '세종'], ['Gangwon', '강원'], ['North Chungcheong', '충북'], ['South Chungcheong', '충남'], ['North Jeolla', '전북'], ['South Jeolla', '전남'], ['North Gyeongsang', '경북'], ['South Gyeongsang', '경남'], ['Jeju', '제주'], ['Other', '기타']
];

function Careers() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [videoPhase, setVideoPhase] = useState(0); // 0=video, 1=image
  const [showText, setShowText] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // 페이지네이션 추가
  const videoRef = useRef(null);
  const { authState, isInitialized, bookmarkedPostIds, toggleBookmark, fetchBookmarks } = useAuth();
  const navigate = useNavigate();

  const POSTS_PER_PAGE = 12; // 페이지당 공고 수

  // Fetch postings once
  useEffect(() => {
    fetchPublicPostings();
  }, []);

  useEffect(() => {
    if (isInitialized && authState.userId) {
      fetchBookmarks();
    }
    // AuthContext exposes an action function whose identity changes on render;
    // the user identity is the actual trigger for this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, authState.userId]);

  // Set video playback rate when video loads
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, [videoPhase]);

  // Toggle media every 7s with smooth transition
  useEffect(() => {
    setShowText(false);
    const textTimer = setTimeout(() => setShowText(true), 600);
    const mediaTimer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setVideoPhase(v => 1 - v);
        setIsTransitioning(false);
      }, 500); // 0.5초 페이드 전환
    }, 7000);
    return () => {
      clearTimeout(textTimer);
      clearTimeout(mediaTimer);
    };
  }, [videoPhase]);

  const fetchPublicPostings = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(apiUrl('/api/postings/public'));
      if (res.ok) {
        const data = await res.json();
        setPostings(data.map(p => ({ ...p, companyName: p.companyName || 'ZOOP' })));
      } else {
        setPostings([]);
        setLoadError('We could not load job postings. Please try again shortly.');
      }
    } catch {
      setPostings([]);
      setLoadError('We could not connect to the jobs service. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = () => setShowApplyModal(false);
  const handleSubmitApplication = async formData => {
    setApplicationError('');
    try {
      const res = await fetch(apiUrl('/api/applications'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowApplyModal(false);
        setShowSuccessModal(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setApplicationError(err.error || 'Application failed. Please check your details and try again.');
      }
    } catch {
      setApplicationError('Something went wrong while submitting your application. Please try again.');
    }
  };

  const handleJobClick = post => {
    navigate(`/job/${post.postId}`);
  };

  const handleApply = post => {
    setSelectedPost(() => post);
    setShowApplyModal(true);
  };

  // 북마크 토글 함수 (전역 상태 사용)
  const handleBookmarkToggle = async (post) => {
    await toggleBookmark(post.postId);
    await fetchBookmarks();
  };

  // Filter logic
  const filtered = postings.filter(post => {
    // 백엔드에서 이미 상태(ACTIVE)와 마감일 필터링을 했으므로 제거
    // if (post.postStatus && post.postStatus !== 'ACTIVE') {
    //   console.log('상태 필터로 제외된 공고:', post.postTitle, post.postStatus);
    //   return false;
    // }
    // if (post.postExpiryDate && new Date(post.postExpiryDate) < new Date()) {
    //   console.log('마감일 필터로 제외된 공고:', post.postTitle, post.postExpiryDate);
    //   return false;
    // }
    
    // 사용자가 선택한 필터만 적용
    if (languageFilter && !post.postProgrammingLanguage?.includes(languageFilter)) return false;
    if (locationFilter && !post.postLocation?.includes(locationFilter)) return false;
    if (search && !(post.postTitle?.includes(search) || post.companyName?.includes(search))) return false;
    return true;
  });
  
  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = filtered.slice(startIndex, endIndex);

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    // 페이지 범위 검증
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 변경 시 맨 위로 스크롤
  };

  // 필터가 변경될 때 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [languageFilter, locationFilter, search]);

  return (
    <>
      {/* SEO 컴포넌트 */}
      <SEO
        title="Careers - ZOOP | Evidence-first opportunities"
        description="Explore developer roles and connect with companies through ZOOP's evidence-based hiring platform."
        keywords="ZOOP careers, developer jobs, AI recruiting, engineering roles"
        image="/careers1.png"
        url="https://zoop.com/careers"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "ZOOP careers",
          "description": "Developer opportunities on the ZOOP AI recruiting platform",
          "numberOfItems": postings.length,
          "itemListElement": postings.slice(0, 10).map((post, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "JobPosting",
              "title": post.postTitle,
              "hiringOrganization": {
                "@type": "Organization",
                "name": post.companyName || "ZOOP"
              },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": post.postLocation
                }
              },
              "employmentType": "FULL_TIME",
              "description": post.postContent
            }
          }))
        }}
      />

      <div className="careers-page">
        <Navbar />

        {/* Slider Section */}
        <section className="careers-video-section">
          <video
            key="video"
            className={`careers-media ${videoPhase === 0 ? 'active' : 'inactive'} ${isTransitioning ? 'transitioning' : ''}`}
            ref={videoRef}
            autoPlay 
            muted 
            loop={true}
            src="/careers_video.mp4"
            onError={(e) => {
              console.warn('Video loading error:', e);
            }}
          />
          
          <img
            key="image"
            className={`careers-media ${videoPhase === 1 ? 'active' : 'inactive'} ${isTransitioning ? 'transitioning' : ''}`}
            src="/careers1.png"
            alt="Developer opportunities"
            onError={(e) => {
              console.warn('Image loading error:', e);
            }}
          />

          <div className="video-overlay">
            {showText && (
              <h1 className="video-title">
                {videoPhase === 0
                  ? 'Great teams are looking for their next builder'
                  : 'Find your next opportunity'}
              </h1>
            )}
          </div>
        </section>

        {/* Filter Bar */}
        <section className="careers-filter-bar">
          <div className="filter-group">
            <select value={languageFilter} onChange={e=>setLanguageFilter(e.target.value)} className="filter-select">
              <option value="">Filter by language</option>
              {LANGUAGES.map(lang=> <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <select value={locationFilter} onChange={e=>setLocationFilter(e.target.value)} className="filter-select">
              <option value="">Filter by location</option>
              {LOCATIONS.map(([label, value]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <div className="search-box">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs or companies" />
              <FaSearch className="search-icon" />
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="careers-job-listings-grid">
          <div className="careers-job-grid">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading job postings...</p>
              </div>
            ) : loadError ? (
              <div className="no-jobs" role="alert" style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
                <span>{loadError}</span>
                <button type="button" onClick={fetchPublicPostings} style={{ border: '1px solid #30c59b', borderRadius: 999, padding: '9px 16px', background: '#ecfdf5', color: '#087f5b', fontWeight: 700, cursor: 'pointer' }}>
                  Try again
                </button>
              </div>
            ) : currentPosts.length === 0 ? (
              <div className="no-jobs">No job postings match your filters.</div>
            ) : currentPosts.map(post => (
              <CompactJobCard
                key={post.postId}
                post={post}
                onClick={() => handleJobClick(post)}
                onApply={handleApply}
                isBookmarked={bookmarkedPostIds.includes(post.postId)}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))}
          </div>
          
          {/* 페이지네이션 */}
          {!loading && totalPages > 1 && (
            <div className="pagination-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '3rem',
              marginBottom: '2rem'
            }}>
              {/* 이전 페이지 버튼 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '12px',
                  background: currentPage === 1 ? '#f8f9fa' : '#fff',
                  color: currentPage === 1 ? '#adb5bd' : '#495057',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: currentPage === 1 ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>

              {/* 페이지 번호 버튼들 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  style={{
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '12px',
                    background: currentPage === page ? 'linear-gradient(135deg, #30c59b 0%, #28a085 100%)' : '#fff',
                    color: currentPage === page ? '#fff' : '#495057',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    minWidth: '40px',
                    height: '40px',
                    fontWeight: currentPage === page ? '600' : '500',
                    boxShadow: currentPage === page ? '0 4px 12px rgba(48,197,155,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== page) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      e.target.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== page) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      e.target.style.background = '#fff';
                    }
                  }}
                >
                  {page}
                </button>
              ))}

              {/* 다음 페이지 버튼 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '12px',
                  background: currentPage >= totalPages ? '#f8f9fa' : '#fff',
                  color: currentPage >= totalPages ? '#adb5bd' : '#495057',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: currentPage >= totalPages ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px'
                }}
                onMouseEnter={(e) => {
                  if (currentPage < totalPages) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage < totalPages) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* Modals */}
        {showApplyModal && (
          <div className="modal-overlay modal-enter" onClick={()=>setShowApplyModal(false)}>
            <div className="apply-modal modal-enter" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedPost?.postTitle} 지원하기</h2>
                <button className="close-button" onClick={()=>setShowApplyModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {applicationError && <p role="alert" style={{ color: '#b42318', marginBottom: '1rem' }}>{applicationError}</p>}
                <ApplyForm post={selectedPost} onSubmit={handleSubmitApplication} onCancel={handleCancelApplication} />
              </div>
            </div>
          </div>
        )}
        
        {showSuccessModal && (
          <div className="modal-overlay modal-enter" onClick={()=>setShowSuccessModal(false)}>
            <div className="success-modal modal-enter" onClick={e=>e.stopPropagation()}>
              <div className="success-content">
                <div className="success-icon">✓</div>
                <h2>지원이 완료되었습니다!</h2>
                <p>입력해주신 정보가 담당자에게 전달되었습니다.</p>
                <button className="success-button" onClick={()=>setShowSuccessModal(false)}>
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Careers;

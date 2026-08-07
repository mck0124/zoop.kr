import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CompactJobCard from '../../components/CompactJobCard';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Sidebar } from './Sidebar';
import { PortfolioNavbar } from './Portfolio';
import './BookmarksPage.css';
import { apiUrl } from '../../api/config';

// Constants for filters
const LANGUAGES = ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Ruby', 'Kotlin'];
const LOCATIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export default function BookmarksPage() {
  const { authState, toggleBookmark } = useAuth();
  const candidateId = authState.userId;
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('게스트');
  const navigate = useNavigate();

  // Filter states
  const [languageFilter, setLanguageFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookmarks = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/bookmarks/candidate/${candidateId}`));
      if (res.ok) {
        const data = await res.json();
        console.log('북마크 API 응답:', data);
        
        // BookmarkDto 구조에 맞게 데이터 변환
        const posts = data.map(bookmark => ({
          postId: bookmark.postId,
          postTitle: bookmark.postTitle,
          postDescription: bookmark.postDescription,
          postLocation: bookmark.postLocation,
          postSalaryStart: bookmark.postSalaryStart,
          postSalaryEnd: bookmark.postSalaryEnd,
          postStatus: bookmark.postStatus,
          postPostedDate: bookmark.postPostedDate,
          companyName: bookmark.companyName || 'ZOOP',
          postProgrammingLanguage: bookmark.postProgrammingLanguage || 'Python',
          postExpiryDate: bookmark.postExpiryDate || bookmark.postPostedDate,
          postHeadcount: bookmark.postHeadcount ? bookmark.postHeadcount.toString() : '1'
        }));
        
        setBookmarkedPosts(posts);
      } else {
        setError('북마크 정보를 불러오지 못했습니다.');
      }
    } catch (e) {
      console.error('북마크 로딩 오류:', e);
      setError('북마크 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  const handleBookmarkToggle = async (post) => {
    await toggleBookmark(post.postId);
    // 북마크 페이지에서는 북마크된 공고 목록을 다시 가져와야 함
    fetchBookmarks();
  };

  const fetchUserName = useCallback(async () => {
    try {
      const userResponse = await fetch(apiUrl(`/api/candidates/${candidateId}`));
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserName(userData.candidateName || '사용자');
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      setUserName('사용자');
    }
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;
    fetchBookmarks();
    fetchUserName();
  }, [candidateId, fetchBookmarks, fetchUserName]);

  const handleJobTitleClick = (postId) => {
    navigate(`/job/${postId}`);
  };

  // Filter posts based on search and filters
  const filteredPosts = bookmarkedPosts.filter(post => {
    const matchesLanguage = !languageFilter || 
      (post.postProgrammingLanguage && 
       post.postProgrammingLanguage.toLowerCase().includes(languageFilter.toLowerCase()));
    
    const matchesLocation = !locationFilter || 
      (post.postLocation && post.postLocation.includes(locationFilter));
    
    const matchesSearch = !search || 
      (post.postTitle && post.postTitle.toLowerCase().includes(search.toLowerCase())) ||
      (post.companyName && post.companyName.toLowerCase().includes(search.toLowerCase()));

    return matchesLanguage && matchesLocation && matchesSearch;
  });

  return (
    <div className="bookmarks-page">
      <Sidebar />
      <div className="main-content-area">
        <PortfolioNavbar userName={userName} />
        
        <h1 className="page-title">스크랩/관심기업</h1>
        
        <div className="info-box company-proposal">
          <p>
            <span className="icon">
              <img src="../../icons/bookmark.svg" alt="bookmark" />
            </span> 저장한 채용 공고를 한눈에 확인하세요
          </p>
        </div>

      {/* Filter Bar */}
      <section className="bookmarks-filter-bar">
        <div className="filter-group">
          <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} className="filter-select">
            <option value="">언어 선택</option>
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="filter-select">
            <option value="">지역 선택</option>
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <div className="search-box">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="검색어 입력" 
            />
            <FaSearch className="search-icon" />
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="bookmarks-job-listings-grid">
        <div className="bookmarks-job-grid">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>북마크를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <CompactJobCard
                key={post.postId}
                post={post}
                isBookmarked={true}
                onBookmarkToggle={handleBookmarkToggle}
                onClick={() => handleJobTitleClick(post.postId)}
              />
            ))
          ) : bookmarkedPosts.length > 0 ? (
            <div className="no-jobs">조건에 맞는 북마크가 없습니다.</div>
          ) : (
            <div className="no-jobs">스크랩한 공고가 없습니다.</div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

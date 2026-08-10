import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CompactJobCard from '../../components/CompactJobCard';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Sidebar } from './Sidebar';
import { PortfolioNavbar } from './Portfolio';
import './BookmarksPage.css';
import { apiUrl } from '../../api/config';

const authenticatedFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
    ...(options.headers || {}),
  },
});

// Constants for filters
const LANGUAGES = ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Ruby', 'Kotlin'];
const LOCATIONS = [
  ['Seoul', '서울'], ['Busan', '부산'], ['Daegu', '대구'], ['Incheon', '인천'],
  ['Gwangju', '광주'], ['Daejeon', '대전'], ['Ulsan', '울산'], ['Sejong', '세종'],
  ['Gyeonggi', '경기'], ['Gangwon', '강원'], ['Chungbuk', '충북'], ['Chungnam', '충남'],
  ['Jeonbuk', '전북'], ['Jeonnam', '전남'], ['Gyeongbuk', '경북'], ['Gyeongnam', '경남'], ['Jeju', '제주'],
];

export default function BookmarksPage() {
  const { authState, toggleBookmark } = useAuth();
  const candidateId = authState.userId;
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('Guest');
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
      const res = await authenticatedFetch(apiUrl(`/api/bookmarks/candidate/${candidateId}`));
      if (res.ok) {
        const data = await res.json();
        
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
        setError('We could not load your bookmarks.');
      }
    } catch (e) {
      console.error('북마크 로딩 오류:', e);
      setError('An error occurred while loading your bookmarks.');
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
      const userResponse = await authenticatedFetch(apiUrl(`/api/candidates/${candidateId}`));
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserName(userData.candidateName || 'Candidate');
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 오류:', error);
      setUserName('Candidate');
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
        
        <h1 className="page-title">Saved jobs and companies</h1>
        
        <div className="info-box company-proposal">
          <p>
            <span className="icon">
              <img src="../../icons/bookmark.svg" alt="bookmark" />
            </span> Review your saved jobs in one place
          </p>
        </div>

      {/* Filter Bar */}
      <section className="bookmarks-filter-bar">
        <div className="filter-group">
          <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)} className="filter-select">
            <option value="">Filter by language</option>
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="filter-select">
            <option value="">Filter by location</option>
            {LOCATIONS.map(([label, value]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="search-box">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search jobs or companies"
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
              <p>Loading saved jobs...</p>
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
            <div className="no-jobs">No saved jobs match these filters.</div>
          ) : (
            <div className="no-jobs">You have not saved any jobs yet.</div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './Notice.css';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';

const noticeList = [
  {
    id: 1,
    title: 'Scheduled service maintenance',
    date: '2025-07-01',
    category: 'System',
    summary: 'Scheduled maintenance will take place on July 10 from 00:00 to 02:00.',
    detail: (
      <ul style={{ textAlign: "left", marginTop: 10, marginBottom: 0 }}>
        <li>Maintenance window: July 10, 2024, 00:00–02:00</li>
        <li>Some features may be temporarily unavailable.</li>
        <li>We appreciate your patience while we improve the service.</li>
      </ul>
    ),
  },
  {
    id: 2,
    title: 'New personalized alerts are live',
    date: '2025-07-05',
    category: 'New feature',
    summary: 'Candidates can now receive alerts based on their preferred conditions.',
    detail: (
      <ul style={{ textAlign: "left", marginTop: 10, marginBottom: 0 }}>
        <li>Personalized alerts: save your preferences to receive relevant job updates.</li>
        <li>Setup: open Profile &gt; Notification settings and add your conditions.</li>
        <li>Contact support if you need help.</li>
      </ul>
    )
  },
  {
    id: 3,
    title: 'ZOOP support assistant update',
    date: '2025-07-10',
    category: 'Service improvement',
    summary: 'The support assistant now provides faster, guide-grounded answers.',
    detail: (
      <ul style={{ textAlign: "left", marginTop: 10, marginBottom: 0 }}>
        <li>Support assistant: get help around the clock.</li>
        <li>Key features: FAQ guidance, support intake, and grounded answers.</li>
        <li>Open the assistant from the Support menu.</li>
      </ul>
    )
  },
  {
    id: 4,
    title: '[ZOOP] Temporary support chat interruption',
    date: '2025-07-15',
    category: 'System',
    summary: 'Support chat will be temporarily unavailable during maintenance.',
    detail: (
      <ul style={{ textAlign: "left", marginTop: 10, marginBottom: 0 }}>
        <li>Window: July 22, 2025, 02:00–03:00</li>
        <li>Reason: platform stability work.</li>
        <li>Chat support will be unavailable during the window.</li>
        <li>We apologize for the inconvenience.</li>
      </ul>
    )
  }
];

// 공지 NEW 뱃지 기준(7일 이내)
function isNew(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

// 카테고리별 아이콘
function CategoryIcon({ category, size = 20 }) {
  const icons = {
    'System': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'New feature': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    'Service improvement': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };
  
  return icons[category] || icons.System;
}

function Notice() {
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [visibleNotices, setVisibleNotices] = useState([]);
  
  const toggleNotice = (id) => setSelectedId(selectedId === id ? null : id);

  // 필터링된 공지사항
  const filteredNotices = filter === 'all' 
    ? noticeList 
    : noticeList.filter(notice => notice.category === filter);

  // 카테고리 목록
  const categories = ['all', ...new Set(noticeList.map(notice => notice.category))];

  // 애니메이션을 위한 지연 로딩
  useEffect(() => {
    setVisibleNotices(filteredNotices);
  }, [filteredNotices]);

  return (
    <>
      <SEO
        title="Notices - ZOOP | Product updates"
        description="Read the latest ZOOP product notices, service improvements, and new features."
        keywords="ZOOP notices, product updates, AI recruiting, hiring platform"
        image="/notice-banner.jpg"
        url="https://zoop.com/notice"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "ZOOP notices",
          "description": "The latest ZOOP notices and product updates",
          "numberOfItems": noticeList.length,
          "itemListElement": noticeList.map((notice, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Article",
              "headline": notice.title,
              "datePublished": notice.date,
              "description": notice.summary
            }
          }))
        }}
      />
      <Navbar />
      
      {/* 히어로 섹션 */}
      <section className="notice-hero">
        <div className="notice-hero-content">
          <h1 className="notice-hero-title">Notices</h1>
          <p className="notice-hero-desc">
            Stay up to date with the latest from ZOOP.<br />
            Find product improvements, new features, and service updates in one place.
          </p>
        </div>
      </section>

      {/* 필터 섹션 */}
      <div className="notice-filter-section">
        <div className="notice-filter-container">
          <div className="filter-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${filter === category ? 'active' : ''}`}
                onClick={() => setFilter(category)}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 공지사항 목록 */}
      <div className="notice-page">
        <div className="notice-container">
          <ul className="notice-list">
            {visibleNotices
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((notice, index) => (
                <li 
                  key={notice.id} 
                  className={`notice-card${selectedId === notice.id ? ' open' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  tabIndex={0} 
                  onClick={() => toggleNotice(notice.id)} 
                  onKeyPress={e => (e.key === 'Enter' || e.key === ' ') && toggleNotice(notice.id)}
                >
                  <div className="notice-card-header">
                    <div className="notice-card-left">
                      <div className="notice-card-title-row">
                        <span className="notice-card-title">{notice.title}</span>
                        {isNew(notice.date) && <span className="notice-badge-new">NEW</span>}
                      </div>
                      <div className="notice-card-meta">
                        <span className="notice-card-category">
                          <CategoryIcon category={notice.category} />
                          {notice.category}
                        </span>
                        <span className="notice-card-date">{notice.date}</span>
                      </div>
                    </div>
                    <div className="notice-card-arrow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M7 10l5 5 5-5" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{ 
                            transform: selectedId === notice.id ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="notice-card-summary">{notice.summary}</div>
                  <div className={`notice-card-detail${selectedId === notice.id ? ' open' : ''}`}>
                    {selectedId === notice.id && notice.detail}
                  </div>
                </li>
              ))}
          </ul>
          
          {visibleNotices.length === 0 && (
            <div className="notice-empty">
              <div className="notice-empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="2"/>
                  <path d="M24 16v8M24 28h.01" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="notice-empty-text">There are no notices in this category.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Notice;

import React from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import './CompactJobCard.css';

function getInitials(name) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return name[0];
  return words[0][0] + words[1][0];
}

export default function CompactJobCard({ post, onClick, isBookmarked, onBookmarkToggle, onApply }) {
  const {
    companyName,
    postTitle,
    postLocation,
    postProgrammingLanguage,
    postExpiryDate,
    postSalaryStart,
    postSalaryEnd,
    postHeadcount,
    companyLogoUrl
  } = post;

  return (
    <div className="compact-job-card" onClick={onClick}>
      {/* Bookmark button */}
      <button
        className={`bookmark-btn${isBookmarked ? ' active' : ''}`}
        onClick={e => {
          e.stopPropagation();
          if (onBookmarkToggle) onBookmarkToggle(post);
        }}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
      >
        {isBookmarked ? <FaBookmark color="#30c59b" size={22} /> : <FaRegBookmark color="#bbb" size={22} />}
      </button>
      <div className="logo-wrap">
        {companyLogoUrl ? (
          <img src={companyLogoUrl} alt={companyName} className="company-logo" />
        ) : (
          <div className="company-initials">{getInitials(companyName)}</div>
        )}
      </div>
      <div className="job-info">
        <div className="company-name">{companyName}</div>
        <div className="job-title">{postTitle}</div>
        <div className="job-meta">
          <span className="meta-item">
            <FaMapMarkerAlt /> {postLocation}
          </span>
          <span className="meta-item">
            <FaCalendarAlt /> {postExpiryDate ? new Date(postExpiryDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' }) : ''}
          </span>
        </div>
        <div className="job-tags">
          {postProgrammingLanguage && postProgrammingLanguage.split(',').map(lang => (
            <span className="job-tag" key={lang}>{lang.trim()}</span>
          ))}
          {postSalaryStart && postSalaryEnd && (
            <span className="job-tag salary">{postSalaryStart}~{postSalaryEnd}만원</span>
          )}
          {postHeadcount && (
            <span className="job-tag headcount">{postHeadcount}명</span>
          )}
        </div>
        {onApply && (
          <button
            type="button"
            className="job-apply-btn"
            onClick={e => {
              e.stopPropagation();
              onApply(post);
            }}
          >
            지원하기
          </button>
        )}
      </div>
    </div>
  );
}

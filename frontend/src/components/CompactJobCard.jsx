import React, { useState } from 'react';
import { FaMapMarkerAlt, FaCalendarAlt, FaRegBookmark, FaBookmark } from 'react-icons/fa';
import './CompactJobCard.css';
import { formatSalaryRange } from '../utils/formatters';

function getInitials(name) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return name[0];
  return words[0][0] + words[1][0];
}

export default function CompactJobCard({ post, onClick, isBookmarked, onBookmarkToggle, onApply }) {
  const [logoFailed, setLogoFailed] = useState(false);
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
        {companyLogoUrl && !logoFailed ? (
          <img
            src={companyLogoUrl}
            alt=""
            className="company-logo"
            onError={() => setLogoFailed(true)}
          />
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
            <FaCalendarAlt /> {postExpiryDate ? new Date(postExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
          </span>
        </div>
        <div className="job-tags">
          {postProgrammingLanguage && postProgrammingLanguage.split(',').map(lang => (
            <span className="job-tag" key={lang}>{lang.trim()}</span>
          ))}
          {postSalaryStart && postSalaryEnd && (
            <span className="job-tag salary">{formatSalaryRange(postSalaryStart, postSalaryEnd)}</span>
          )}
          {postHeadcount && (
            <span className="job-tag headcount">{postHeadcount} openings</span>
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
            Apply now
          </button>
        )}
      </div>
    </div>
  );
}

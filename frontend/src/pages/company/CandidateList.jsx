import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Navbar from '../../components/Navbar';
import { FaTimes } from 'react-icons/fa';
import SEO from '../../components/SEO';
import { apiUrl } from '../../api/config';
import AIAnalysisSummary from '../../components/AIAnalysisSummary';

const authenticatedFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
    ...(options.headers || {}),
  },
});

// =========== Styled Components ===========

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(60px) scale(0.98);}
  to   { opacity: 1; transform: translateY(0) scale(1);}
`;

const Wrapper = styled.div`
  font-family: 'SUIT', sans-serif;
  background: #fff;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  padding: 7rem 2rem 3rem 2rem;
  position: relative;
  @media (max-width: 640px) {
    padding: 5.5rem 1rem 2rem;
  }
`;

const PostInfoCard = styled.div`
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 6px 32px rgba(40,60,90,0.10);
  padding: 2.8rem 2.8rem 2.1rem 2.8rem;
  margin-bottom: 3.5rem;
  border: 1px solid #e9ecef;
  position: relative;
  min-width: 350px;
  animation: ${fadeIn} 0.7s cubic-bezier(.35,.97,.46,1.01);
  @media (max-width: 640px) {
    min-width: 0;
    padding: 1.5rem 1.1rem;
    border-radius: 20px;
  }
`;

const PostInfoHeader = styled.h1`
  font-size: 2.1rem;
  font-weight: 800;
  color: #262e38;
  margin-bottom: 1.55rem;
  letter-spacing: -1.2px;
  line-height: 1.13;
`;

const PostInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
  gap: 1.1rem 1.5rem;
  margin-bottom: 1.15rem;
`;

const InfoLabel = styled.span`
  font-size: 1rem;
  color: #a6b1c0;
  font-weight: 700;
`;

const InfoText = styled.span`
  font-size: 1.08rem;
  color: #222;
  font-weight: 500;
  margin-left: 0.4rem;
`;

const PostDesc = styled.div`
  background: #f7f9fb;
  border-radius: 13px;
  padding: 1.08rem 1.4rem;
  color: #49505c;
  font-size: 1rem;
  margin-top: 1rem;
`;

const CandidatesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 1.6rem;
  margin-top: 0.7rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.35rem;
  font-weight: 800;
  color: #263249;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
`;

const PosterScrollWrap = styled.div`
  overflow-x: auto;
  overflow-y: visible;
  padding: 2.5rem 3.5rem 2.5rem 2.5rem;
  display: flex;
  gap: 2.3rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: #ddeeff #fff;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { height: 10px; background: #fff;}
  &::-webkit-scrollbar-thumb { background: #e5edf7; border-radius: 8px;}
  @media (max-width: 640px) {
    padding: 1rem 0.25rem 1.5rem;
    margin: 0 -0.25rem;
  }
`;

const PostersRow = styled.div`
  display: flex;
  gap: 2.3rem;
  /* Remove min-width so flex children can shrink */
`;

// Apple Liquid Glass Card with dynamic lighting
const TossCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  box-shadow: 
    0 4px 24px 0 rgba(48,197,155,0.08),
    0 1.5px 8px 0 rgba(107,232,200,0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  width: 340px;
  min-width: 340px;
  min-height: 480px;
  height: auto;
  padding: 1.7rem 1.3rem 1.7rem 1.3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  scroll-snap-align: start;
  cursor: pointer;
  transition:
    all 0.55s cubic-bezier(.19,1,.22,1);
  border: ${props => props.selected ? '1.5px solid rgba(48, 197, 155, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)'};
  
  /* Liquid glass shine effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 100%
    );
    border-radius: 28px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  /* Dynamic lighting based on hover position */
  &::after {
    content: '';
    position: absolute;
    top: var(--mouse-y, 50%);
    left: var(--mouse-x, 50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0.08) 30%,
      transparent 70%
    );
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }
  
  &:hover {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.15) 100%
    );
    backdrop-filter: blur(25px) saturate(200%);
    -webkit-backdrop-filter: blur(25px) saturate(200%);
    box-shadow: 
      0 12px 32px 0 rgba(48,197,155,0.12),
      0 1.5px 8px 0 rgba(107,232,200,0.08),
      0 0 0 1px rgba(255, 255, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    z-index: 2;
    transform: translateY(-6px) scale(1.025) perspective(600px) rotateY(var(--hover-rotateY,0deg)) rotateX(var(--hover-rotateX,0deg));
    
    &::before {
      opacity: 1;
    }
    
    &::after {
      opacity: 1;
    }
  }
  @media (max-width: 640px) {
    width: 290px;
    min-width: 290px;
    min-height: 440px;
    padding: 1.35rem 1rem;
  }
`;

// Liquid glass glow behind avatar
const Avatar = styled.img`
  width: 92px;
  height: 92px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    0 4px 24px rgba(48, 197, 155, 0.3),
    0 1.5px 8px rgba(107, 232, 200, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  object-fit: cover;
  position: relative;
  z-index: 3;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`;

// Add styled-component for Toss-style button

const TossAnalysisButton = styled.button`
  width: 100%;
  display: block;
  margin-top: auto;
  margin-bottom: 0;
  background: linear-gradient(90deg, #e0f7ef 0%, #b2f2e5 100%);
  color: #30c59b;
  border: none;
  border-radius: 16px;
  font-size: 1.08rem;
  font-weight: 600;
  padding: 0.58rem 0;
  box-shadow: 0 1.5px 8px #30c59b11;
  transition: background 0.16s, filter 0.16s;
  cursor: pointer;
  outline: none;
  filter: none;
  &:hover {
    filter: brightness(1.04);
  }
`;

// ============ 분석 모달 ============

const ModalOverlay = styled.div`
  position: fixed; top:0; left:0; right:0; bottom:0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1200;
  display: flex; align-items: center; justify-content: center;
  animation: ${fadeIn} 0.3s cubic-bezier(.36,1.07,.57,1.01);
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 24px;
  max-width: 800px;
  width: 95vw;
  min-width: 0;
  padding: 3rem 2.5rem 0 2.5rem;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.25);
  position: relative;
  display: flex; flex-direction: column;
  animation: ${fadeIn} 0.4s cubic-bezier(.22,1.04,.38,1.01);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 90vh;
  @media (max-width: 640px) {
    width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    min-width: 0;
    max-height: 92vh;
    border-radius: 18px;
    padding: 1.5rem 0.9rem 0;
  }
`;

const ModalCloseBtn = styled.button`
  position: absolute; 
  top: 20px; 
  right: 20px;
  background: rgba(255, 255, 255, 0.9); 
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 18px; 
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  z-index: 10;
  &:hover { 
    background: rgba(255, 255, 255, 1);
    color: #333;
    transform: scale(1.1);
  }
`;

const ModalHeader = styled.div`
  padding: 32px 32px 0 32px;
  margin-bottom: 0;
`;

// 모달 액션 버튼 (Toss 스타일)
const ModalActionBtn = styled.button`
  background: #30c59b;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1.01rem;
  padding: 0.5rem 1.6rem;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.16s, filter 0.16s;
  &:hover {
    filter: brightness(1.08);
  }
`;

// ==========================================



// Technology Stack Visualization
const TechStackVisual = ({ languages, size = 120 }) => {
  if (!languages || languages.length === 0) return null;
  
  const displayLangs = languages.slice(0, 4); // 더 적은 수로 표시
  const colors = ['#30c59b', '#6be8c8', '#43e97b', '#38a169'];
  
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '3px', 
      justifyContent: 'center',
      padding: '4px',
      maxWidth: size
    }}>
      {displayLangs.map((lang, index) => (
        <div
          key={lang}
          style={{
            background: colors[index % colors.length],
            color: 'white',
            padding: '3px 6px',
            borderRadius: '8px',
            fontSize: '9px',
            fontWeight: '600',
            opacity: 0.9,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          {lang}
        </div>
      ))}
      {languages.length > 4 && (
        <div style={{
          background: 'rgba(48, 197, 155, 0.2)',
          color: '#30c59b',
          padding: '3px 6px',
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: '600'
        }}>
          +{languages.length - 4}
        </div>
      )}
    </div>
  );
};

// Keywords Visualization
const KeywordsVisual = ({ keywords, size = 120 }) => {
  if (!keywords || keywords.length === 0) return null;
  
  const displayKeywords = keywords.slice(0, 3); // 최대 3개만 표시
  const colors = ['#667eea', '#764ba2', '#f093fb'];
  
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '2px', 
      justifyContent: 'center',
      padding: '3px',
      maxWidth: size
    }}>
      {displayKeywords.map((keyword, index) => (
        <div
          key={keyword}
          style={{
            background: colors[index % colors.length],
            color: 'white',
            padding: '2px 5px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            opacity: 0.9,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {keyword}
        </div>
      ))}
      {keywords.length > 3 && (
        <div style={{
          background: 'rgba(102, 126, 234, 0.2)',
          color: '#667eea',
          padding: '2px 5px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          +{keywords.length - 3}
        </div>
      )}
    </div>
  );
};



// Feather Target SVG as React component
const TargetIcon = (props) => (
  <svg
    width="1.7em"
    height="1.7em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#30c59b"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ verticalAlign: 'middle', marginRight: '0.5rem', ...props.style }}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Radar chart SVG for 6 component scores
const radarKeys = ['팔로워 수','공개 저장소 수','언어 다양성','최근 활동성','프로젝트 품질','기술적 깊이'];
const radarLabels = ['Followers','Public repositories','Language breadth','Recent activity','Project quality','Technical depth'];
const dimensionLabels = {
  '팔로워 수': 'Followers',
  '공개 저장소 수': 'Public repositories',
  '언어 다양성': 'Language breadth',
  '최근 활동성': 'Recent activity',
  '프로젝트 품질': 'Project quality',
  '기술적 깊이': 'Technical depth'
};
const radarMax = [10, 15, 15, 20, 20, 20]; // 각 항목별 만점
function RadarChartSVG({ scores = {}, size = 90, totalScore, showLabels = false, showScores = false }) {
  const cx = size / 2, cy = size / 2, r = size * 0.41;
  const radarShortLabels = ['Followers', 'Repos', 'Languages', 'Activity', 'Quality', 'Depth'];
  // 각 축의 각도
  const angles = radarLabels.map((_, i) => (Math.PI * 2 * i) / radarLabels.length - Math.PI/2);
  // 점수값(0~1)
  const values = radarKeys.map((key, i) => Math.max(0, Math.min(1, (scores[key] || 0) / radarMax[i])));
  // 폴리곤 좌표
  const points = values.map((v, i) => {
    const angle = angles[i];
    const rr = r * v;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)];
  });
  // 축 끝 좌표
  const axisPoints = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  // 축 라벨 좌표 (축 끝에서 바깥쪽으로 8px)
  const labelPoints = angles.map((a, i) => [
    cx + (r + 8) * Math.cos(a),
    cy + (r + 8) * Math.sin(a)
  ]);
  // 축 점수 좌표 (축 끝에서 바깥쪽으로 14px)
  const scorePoints = angles.map((a, i) => [
    cx + (r + 14) * Math.cos(a),
    cy + (r + 14) * Math.sin(a)
  ]);
  const allZero = radarKeys.every(key => (scores[key] || 0) === 0);
  return (
    <svg width={size} height={size} style={{
      display:'block',
      margin:'0 auto',
      position:'relative',
      zIndex:2,
      filter: 'drop-shadow(0 4px 8px rgba(48, 197, 155, 0.15))'
    }}>
      <defs>
        <radialGradient id="glassBg" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#e0f7ef" stopOpacity="0.25"/>
        </radialGradient>
        <linearGradient id="mintGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#43e97b"/>
          <stop offset="100%" stopColor="#30c59b"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* 3D Glassy gradient background */}
      <circle cx={cx} cy={cy} r={size/2-2} fill="url(#glassBg)" />
      {/* 그리드 with 3D effect */}
      {[0.33,0.66,1].map((f,idx) => (
        <polygon
          key={idx}
          points={angles.map(a => [cx + r*f*Math.cos(a), cy + r*f*Math.sin(a)].join(",")).join(" ")}
          fill={idx===2?"rgba(255,255,255,0.15)":'none'}
          stroke="#e0f7ef"
          strokeWidth={idx===2?2:1}
          opacity={idx===2?0.2:0.12}
        />
      ))}
      {/* 축 with 3D effect */}
      {axisPoints.map(([x,y],i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e0f7ef" strokeWidth="1.5" opacity="0.25" />
      ))}
      {/* 점수 폴리곤 with 3D glow effect */}
      {allZero ? (
        <text x={cx} y={cy+5} textAnchor="middle" fontSize="15" fill="#30c59b" opacity="0.7" fontWeight="600">No analysis data</text>
      ) : (
        <g filter="url(#glow)">
        <polygon
          points={points.map(([x,y])=>x+","+y).join(" ")}
            fill="rgba(255,255,255,0.3)"
            fillOpacity="0.3"
            stroke="#30c59b"
            strokeWidth="3"
            strokeOpacity="0.8"
        />
        </g>
      )}
      {/* 축 라벨 */}
      {showLabels && labelPoints.map(([x, y], i) => (
        <text 
          key={i}
          x={x} 
          y={y + 2} 
          textAnchor="middle" 
          alignmentBaseline="middle" 
          fontSize="9" 
          fill="#30c59b" 
          fontWeight="600" 
          opacity="0.8"
          style={{ 
            textShadow: '0 1px 2px rgba(255,255,255,0.9)',
            zIndex: 10
          }}
        >
          {radarShortLabels[i]}
        </text>
      ))}
      {/* 축 점수 */}
      {showScores && scorePoints.map(([x, y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" alignmentBaseline="middle" fontSize={size > 120 ? 16 : 13} fill="#222" fontWeight="600" opacity="0.98">
          {scores[radarKeys[i]] !== undefined ? scores[radarKeys[i]] : 0}
        </text>
      ))}
      {/* 중앙 점수 */}
      {typeof totalScore === 'number' && (
        <g className="score-badge">
          <circle
            cx={cx}
            cy={cy}
            r={size > 120 ? 22 : 15}
            fill="url(#glassBg)"
            opacity={0.98}
          />
          <text
            x={cx}
            y={cy + (size > 120 ? 10 : 7)}
            textAnchor="middle"
            fontSize={size > 120 ? 32 : 26}
            fontWeight="500"
            fontFamily="SUIT, Apple SD Gothic Neo, Pretendard, sans-serif"
            fill="url(#mintGrad)"
            stroke="#fff"
            strokeWidth="1.2"
            paintOrder="stroke"
            style={{letterSpacing:'-1px'}}
          >
            {totalScore}
          </text>
        </g>
      )}
    </svg>
  );
}

// Move these utility functions above TossCandidateCard so they are in scope
const parsePortfolioEvidence = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') return null;
  try {
    const parsed = JSON.parse(analysisText);
    return parsed && parsed.version === 'portfolio-evidence-v1' ? parsed : null;
  } catch (_) {
    return null;
  }
};

const parseGithubEvidence = (analysisText) => {
  if (!analysisText || typeof analysisText !== 'string') return null;
  try {
    const parsed = JSON.parse(analysisText);
    return parsed && parsed.version === 'github-evidence-v1' ? parsed : null;
  } catch (_) {
    return null;
  }
};

const extractKeywords = (analysisText) => {
  if (!analysisText) return [];
  const structured = parsePortfolioEvidence(analysisText);
  if (structured) return Array.isArray(structured.technical_stack) ? structured.technical_stack.slice(0, 8) : [];
  const github = parseGithubEvidence(analysisText);
  if (github) return (github.keywords || []).slice(0, 8);
  const keywordMatch = analysisText.match(/핵심키워드:\s*([^\n]+)/);
  if (keywordMatch) {
    const keywords = keywordMatch[1].trim().split(',').map(k => k.trim());
    return keywords.filter(k => k.length > 0);
  }
  return [];
};

const extractStrengths = (analysisText) => {
  if (!analysisText) return [];
  const structured = parsePortfolioEvidence(analysisText);
  if (structured) return (structured.competencies || [])
    .filter(item => item && item.assessment && !/확인되지 않음|부족/.test(item.assessment))
    .map(item => `${item.name}: ${item.assessment}`)
    .slice(0, 4);
  const github = parseGithubEvidence(analysisText);
  if (github) return (github.strengths || []).slice(0, 4);
  const strengthMatch = analysisText.match(/강점:\s*([^\n]+)/);
  if (strengthMatch) {
    const strengths = strengthMatch[1].trim().split(',').map(s => s.trim());
    return strengths.filter(s => s.length > 0);
  }
  return [];
};

const extractWeaknesses = (analysisText) => {
  if (!analysisText) return [];
  const structured = parsePortfolioEvidence(analysisText);
  if (structured) return [...(structured.gaps || []), ...(structured.risk_flags || [])].slice(0, 5);
  const github = parseGithubEvidence(analysisText);
  if (github) return [...(github.gaps || []), ...(github.risk_flags || [])].slice(0, 5);
  const weaknessMatch = analysisText.match(/약점:\s*([^\n]+)/);
  if (weaknessMatch) {
    const weaknesses = weaknessMatch[1].trim().split(',').map(w => w.trim());
    return weaknesses.filter(w => w.length > 0);
  }
  return [];
};

const extractSuitableJobs = (analysisText) => {
  if (!analysisText) return [];
  const structured = parsePortfolioEvidence(analysisText);
  if (structured) return (structured.technical_stack || []).slice(0, 4);
  const github = parseGithubEvidence(analysisText);
  if (github) return (github.suitable_roles || []).slice(0, 4);
  const jobMatch = analysisText.match(/적합직무:\s*([^\n]+)/);
  if (jobMatch) {
    const jobs = jobMatch[1].trim().split(',').map(j => j.trim());
    return jobs.filter(j => j.length > 0);
  }
  return [];
};

const extractGrowthPotential = (analysisText) => {
  if (!analysisText) return '';
  const structured = parsePortfolioEvidence(analysisText);
  if (structured) return structured.seniority_signal || '';
  const github = parseGithubEvidence(analysisText);
  if (github) return github.growth_signal || '';
  const growthMatch = analysisText.match(/성장가능성:\s*([^\n]+(?:\n[^\n]+)*)/);
  if (growthMatch) {
    return growthMatch[1].trim();
  }
  return '';
};
const extractScore = (analysisText) => {
  if (!analysisText) return 0;
  
  // 여러 패턴으로 점수 추출 시도
  const patterns = [
    /\bSCORE\s*:\s*(\d+(?:\.\d+)?)/i,
    /점수:\s*(\d+)점/,
    /총점:\s*(\d+)점/,
    /\(점수:\s*(\d+)점\)/,
    /평가점수:\s*(\d+)점/,
    /종합점수:\s*(\d+)점/
  ];
  
  for (const pattern of patterns) {
    const scoreMatch = analysisText.match(pattern);
    if (scoreMatch) {
      return parseInt(scoreMatch[1]);
    }
  }
  
  // 숫자만 있는 경우 (예: "85점")
  const simpleMatch = analysisText.match(/(\d+)점/);
  if (simpleMatch) {
    return parseInt(simpleMatch[1]);
  }
  
  return 0;
};

// Analysis records are stored in two shapes: direct ledgers and interview
// envelopes such as { analysis: {...}, score, transcripts }. Resolve both in
// one place so the decision lens and comparison table never downgrade a valid
// interview result to "insufficient evidence" just because of storage shape.
const parseCandidateAnalysis = (analysisText) => {
  let parsed = analysisText;
  if (typeof analysisText === 'string') {
    try {
      parsed = JSON.parse(analysisText);
    } catch (_) {
      return { root: null, envelope: null };
    }
  }
  if (!parsed || typeof parsed !== 'object') return { root: null, envelope: null };
  const root = parsed.analysis && typeof parsed.analysis === 'object' ? parsed.analysis : parsed;
  return { root, envelope: parsed };
};

const getAnalysisPayload = (candidate, analysisResult) => {
  const analysisText = analysisResult?.analysisData || candidate?.portfolioAnalysis || candidate?.analysis || '';
  const { root: payload, envelope } = parseCandidateAnalysis(analysisText);
  const candidateScore = Number(candidate?.analysisScore ?? candidate?.parsed_score);
  const fallbackScore = Number.isFinite(candidateScore) && candidateScore > 0 ? candidateScore : extractScore(analysisText);
  const rawScore = payload?.score_calibration?.calibrated_score ?? payload?.score ?? envelope?.score ?? (Number.isFinite(fallbackScore) && fallbackScore > 0 ? fallbackScore : null);
  const score = rawScore === null || rawScore === undefined || rawScore === '' ? NaN : Number(rawScore);
  const coverageRaw = payload?.evidence_coverage ?? payload?.evidenceCoverage;
  const coverageNumber = Number(coverageRaw);
  const coverage = Number.isFinite(coverageNumber) ? Math.round(Math.max(0, Math.min(100, coverageNumber <= 1 ? coverageNumber * 100 : coverageNumber))) : null;
  const confidenceRaw = Number(payload?.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? Math.round(Math.max(0, Math.min(100, confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw))) : null;
  const directEvidence = Array.isArray(payload?.evidence) ? payload.evidence : Array.isArray(payload?.verified_evidence) ? payload.verified_evidence : [];
  const dimensionEvidence = Array.isArray(payload?.dimensions) ? payload.dimensions.flatMap(dimension => Array.isArray(dimension?.evidence) ? dimension.evidence : []) : [];
  const evidence = [...directEvidence, ...dimensionEvidence].reduce((unique, item) => {
    if (!item) return unique;
    const key = item.evidence_id || `${item.source || 'evidence'}:${item.claim || ''}:${item.quote || ''}`;
    if (!unique.some(existing => existing.__evidenceKey === key)) {
      unique.push({ ...item, __evidenceKey: key });
    }
    return unique;
  }, []);
  const groundedEvidence = evidence.filter(item => item && (
    item.verification_state === 'verified' ||
    item.verification_state === 'grounded'
  ));
  const hasStructuredEvidence = ['github-evidence-v1', 'portfolio-evidence-v1', 'interview-evidence-v1'].includes(payload?.version);
  const decision = payload?.decision || (hasStructuredEvidence && coverage !== null && coverage >= 70 ? 'review' : 'not_enough_evidence');
  return {
    analysisText,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    coverage,
    confidence,
    evidenceCount: groundedEvidence.length,
    decision,
    hasStructuredEvidence,
    gaps: Array.isArray(payload?.gaps) ? payload.gaps : []
  };
};

const DecisionLens = ({ candidates, aiAnalysisResults }) => {
  const rows = candidates.map(candidate => {
    const result = aiAnalysisResults.find(item => item.githubSearchResultId === candidate.githubSearchResultId);
    return { candidate, ...getAnalysisPayload(candidate, result) };
  });
  const scored = rows.filter(row => row.score !== null);
  const grounded = rows.filter(row => row.hasStructuredEvidence && row.evidenceCount > 0);
  const needsReview = rows.filter(row => row.coverage === null || row.coverage < 70 || row.decision === 'not_enough_evidence');
  const ranked = [...rows].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)).slice(0, 3);
  if (!rows.length) return null;

  const badge = (label, value, tone) => (
    <div style={{ flex: '1 1 150px', minWidth: 145, padding: '14px 16px', borderRadius: 14, background: tone.background, border: `1px solid ${tone.border}` }}>
      <div style={{ color: tone.label, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#172033', fontSize: 24, fontWeight: 850, marginTop: 3 }}>{value}</div>
    </div>
  );

  return (
    <section aria-labelledby="decision-lens-title" style={{ margin: '0 0 2rem', padding: '1.35rem', borderRadius: 22, background: 'linear-gradient(135deg, #102c25 0%, #174438 100%)', color: '#ecfdf5', boxShadow: '0 14px 34px rgba(15, 41, 35, 0.16)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ color: '#86efac', fontSize: 11, fontWeight: 850, letterSpacing: '0.12em' }}>EVIDENCE LEDGER · DECISION LENS</div>
          <h2 id="decision-lens-title" style={{ color: '#fff', margin: '6px 0 5px', fontSize: '1.35rem' }}>Review evidence before the score</h2>
          <p style={{ margin: 0, color: '#c7f9df', lineHeight: 1.55, fontSize: 13 }}>Scores set review priority. Candidates with limited evidence are routed to the next verification step instead of being rejected automatically.</p>
        </div>
        <span style={{ padding: '7px 11px', borderRadius: 999, background: 'rgba(167,243,208,.13)', border: '1px solid rgba(167,243,208,.3)', color: '#d1fae5', fontSize: 12, fontWeight: 800 }}>AI-assisted decision support</span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        {badge('Analyzed', `${scored.length}/${rows.length}`, { background: '#ecfdf5', border: '#a7f3d0', label: '#047857' })}
        {badge('Grounded evidence', `${grounded.length}`, { background: '#eff6ff', border: '#bfdbfe', label: '#1d4ed8' })}
        {badge('Needs review', `${needsReview.length}`, { background: '#fffbeb', border: '#fde68a', label: '#b45309' })}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)' }}>
        <div style={{ color: '#bbf7d0', fontSize: 11, fontWeight: 850, letterSpacing: '0.06em', marginBottom: 8 }}>REVIEW PRIORITY</div>
        <div style={{ display: 'grid', gap: 7 }}>
          {ranked.map((row, index) => {
            const name = row.candidate.githubLogin || row.candidate.login || 'Unknown candidate';
            const status = row.coverage === null ? 'Evidence check needed' : row.coverage < 70 ? `${row.coverage}% coverage · Verify further` : `${row.coverage}% evidence coverage`;
            return <div key={`${name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}><span style={{ color: '#fff', fontWeight: 750 }}>{index + 1}. {name}</span><span style={{ color: '#d1fae5' }}>{row.score === null ? 'Score pending' : `${row.score}`} · {status}</span></div>;
          })}
        </div>
      </div>
    </section>
  );
};

const CandidateComparisonModal = ({ candidates, aiAnalysisResults, selectedLogins, onClose }) => {
  const selectedCandidates = candidates.filter(candidate => selectedLogins.includes(candidate.githubLogin || candidate.login)).slice(0, 3);
  const rows = selectedCandidates.map(candidate => {
    const analysisResult = aiAnalysisResults.find(item => item.githubSearchResultId === candidate.githubSearchResultId);
    return { candidate, ...getAnalysisPayload(candidate, analysisResult) };
  });
  const dimensions = [...new Set(rows.flatMap(row => {
    const { root } = parseCandidateAnalysis(row.analysisText);
    return Array.isArray(root?.dimensions) ? root.dimensions.map(item => item.name).filter(Boolean) : [];
  }))].slice(0, 6);

  if (!rows.length) return null;
  const decisionLabel = { strong_match: 'Strong match', review: 'Review recommended', not_enough_evidence: 'Insufficient evidence' };
  const getDimension = (row, name) => {
    const { root } = parseCandidateAnalysis(row.analysisText);
    return Array.isArray(root?.dimensions) ? root.dimensions.find(item => item.name === name) : null;
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={event => event.stopPropagation()} style={{ maxWidth: 1180, width: '95vw', maxHeight: '90vh', overflow: 'auto' }}>
        <ModalCloseBtn onClick={onClose}><FaTimes /></ModalCloseBtn>
        <div style={{ padding: '2rem 2rem 1rem' }}>
          <div style={{ color: '#0f766e', fontSize: 11, fontWeight: 850, letterSpacing: '0.1em' }}>EVIDENCE LEDGER · COMPARISON</div>
          <h2 style={{ margin: '0.4rem 0 0.35rem', color: '#172033' }}>Compare candidates by evidence, not just score</h2>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.55 }}>Use score to set review order, then inspect evidence coverage and open verification gaps before making a final decision.</p>
        </div>
        <div style={{ padding: '0 2rem 2rem', overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(720, rows.length * 260) }}>
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${rows.length}, minmax(220px, 1fr))`, gap: 1, background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: 16, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Decision lens</div>
              {rows.map(row => <div key={row.candidate.githubLogin || row.candidate.login} style={{ padding: 16, background: '#fff', color: '#172033', fontWeight: 850, fontSize: 16 }}>{row.candidate.githubLogin || row.candidate.login || '이름 미확인'}</div>)}
              <div style={{ padding: 14, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Adjusted score</div>
              {rows.map(row => <div key={`score-${row.candidate.githubLogin || row.candidate.login}`} style={{ padding: 14, background: '#fff', color: '#0f766e', fontSize: 25, fontWeight: 900 }}>{row.score === null ? 'Pending' : `${row.score}/100`}</div>)}
              <div style={{ padding: 14, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Decision status</div>
              {rows.map(row => <div key={`decision-${row.candidate.githubLogin || row.candidate.login}`} style={{ padding: 14, background: '#fff' }}><span style={{ display: 'inline-block', borderRadius: 999, padding: '5px 9px', background: row.decision === 'strong_match' ? '#dcfce7' : row.decision === 'not_enough_evidence' ? '#fef3c7' : '#dbeafe', color: row.decision === 'strong_match' ? '#166534' : row.decision === 'not_enough_evidence' ? '#92400e' : '#1d4ed8', fontSize: 12, fontWeight: 800 }}>{decisionLabel[row.decision] || 'Needs review'}</span></div>)}
              <div style={{ padding: 14, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Evidence coverage</div>
              {rows.map(row => <div key={`coverage-${row.candidate.githubLogin || row.candidate.login}`} style={{ padding: 14, background: '#fff', color: row.coverage !== null && row.coverage >= 70 ? '#047857' : '#b45309', fontWeight: 800 }}>{row.coverage === null ? 'Check needed' : `${row.coverage}%`} {row.evidenceCount ? `· ${row.evidenceCount} evidence items` : ''}</div>)}
              {dimensions.map(dimension => <React.Fragment key={dimension}>
                <div style={{ padding: 14, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>{dimension}</div>
                {rows.map(row => { const item = getDimension(row, dimension); return <div key={`${dimension}-${row.candidate.githubLogin || row.candidate.login}`} style={{ padding: 14, background: '#fff', color: '#334155', fontSize: 13 }}><strong>{item?.score ?? '—'}</strong>{item?.max ? `/${item.max}` : ''}<div style={{ marginTop: 4, color: '#64748b', lineHeight: 1.45 }}>{item?.evidence?.find(evidence => evidence.verification_state === 'grounded')?.claim || 'No grounded evidence'}</div></div>; })}
              </React.Fragment>)}
              <div style={{ padding: 14, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 800 }}>Next verification</div>
              {rows.map(row => <div key={`gap-${row.candidate.githubLogin || row.candidate.login}`} style={{ padding: 14, background: '#fff', color: '#475569', fontSize: 13, lineHeight: 1.5 }}>{row.gaps.length ? row.gaps.slice(0, 2).join(' · ') : 'Verify real contribution and design decisions in a representative project.'}</div>)}
            </div>
          </div>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
};

function getStackArray(langs) {
  if (!langs) return [];
  if (Array.isArray(langs)) return langs;
  if (typeof langs === 'string') {
    return langs.split(/[\s,/]+/).filter(Boolean);
  }
  return [];
}

// 언어별 색상 반환 함수
function getLanguageColor(language, isDarker = false) {
  const colors = {
    'JavaScript': isDarker ? '#d97706' : '#f59e0b',
    'TypeScript': isDarker ? '#1d4ed8' : '#3b82f6',
    'Python': isDarker ? '#059669' : '#10b981',
    'Java': isDarker ? '#dc2626' : '#ef4444',
    'React': isDarker ? '#0891b2' : '#06b6d4',
    'Node.js': isDarker ? '#059669' : '#10b981',
    'Vue.js': isDarker ? '#059669' : '#10b981',
    'Angular': isDarker ? '#dc2626' : '#ef4444',
    'PHP': isDarker ? '#7c3aed' : '#8b5cf6',
    'Ruby': isDarker ? '#dc2626' : '#ef4444',
    'Go': isDarker ? '#0891b2' : '#06b6d4',
    'Rust': isDarker ? '#d97706' : '#f59e0b',
    'C++': isDarker ? '#1d4ed8' : '#3b82f6',
    'C#': isDarker ? '#7c3aed' : '#8b5cf6',
    'Swift': isDarker ? '#f59e0b' : '#fbbf24',
    'Kotlin': isDarker ? '#7c3aed' : '#8b5cf6',
    'Dart': isDarker ? '#0891b2' : '#06b6d4',
    'Flutter': isDarker ? '#0891b2' : '#06b6d4',
    'Django': isDarker ? '#059669' : '#10b981',
    'Spring': isDarker ? '#059669' : '#10b981',
    'Express': isDarker ? '#059669' : '#10b981',
    'Laravel': isDarker ? '#dc2626' : '#ef4444',
    'ASP.NET': isDarker ? '#7c3aed' : '#8b5cf6',
    'Flask': isDarker ? '#059669' : '#10b981',
    'FastAPI': isDarker ? '#059669' : '#10b981',
    'GraphQL': isDarker ? '#dc2626' : '#ef4444',
    'MongoDB': isDarker ? '#059669' : '#10b981',
    'PostgreSQL': isDarker ? '#1d4ed8' : '#3b82f6',
    'MySQL': isDarker ? '#d97706' : '#f59e0b',
    'Redis': isDarker ? '#dc2626' : '#ef4444',
    'Docker': isDarker ? '#0891b2' : '#06b6d4',
    'Kubernetes': isDarker ? '#1d4ed8' : '#3b82f6',
    'AWS': isDarker ? '#d97706' : '#f59e0b',
    'Azure': isDarker ? '#1d4ed8' : '#3b82f6',
    'GCP': isDarker ? '#dc2626' : '#ef4444',
    'Git': isDarker ? '#dc2626' : '#ef4444',
    'Linux': isDarker ? '#d97706' : '#f59e0b',
    'HTML': isDarker ? '#dc2626' : '#ef4444',
    'CSS': isDarker ? '#1d4ed8' : '#3b82f6',
    'Sass': isDarker ? '#7c3aed' : '#8b5cf6',
    'Less': isDarker ? '#1d4ed8' : '#3b82f6',
    'Webpack': isDarker ? '#0891b2' : '#06b6d4',
    'Babel': isDarker ? '#f59e0b' : '#fbbf24',
    'Jest': isDarker ? '#dc2626' : '#ef4444',
    'Cypress': isDarker ? '#059669' : '#10b981',
    'Selenium': isDarker ? '#059669' : '#10b981',
    'Jenkins': isDarker ? '#d97706' : '#f59e0b',
    'GitHub Actions': isDarker ? '#7c3aed' : '#8b5cf6',
    'CI/CD': isDarker ? '#0891b2' : '#06b6d4'
  };
  
  return colors[language] || (isDarker ? '#6b7280' : '#9ca3af');
}

// 기술 스택 데이터를 더 안정적으로 가져오는 함수
function getCandidateLanguages(candidate) {
  // 여러 가능한 필드에서 언어 정보를 가져옴
  const languages = candidate.candidateLanguages || 
                   candidate.languages || 
                   candidate.language || 
                   candidate.techStack ||
                   candidate.skills ||
                   candidate.candidateLanguage ||
                   [];
  
  if (Array.isArray(languages)) {
    const filtered = languages.filter(lang => lang && typeof lang === 'string');
    if (filtered.length > 0) return filtered;
  }
  
  if (typeof languages === 'string') {
    const split = languages.split(/[\s,/]+/).filter(Boolean);
    if (split.length > 0) return split;
  }
  
  // 분석 텍스트에서 언어 추출 시도
  if (candidate.portfolioAnalysis || candidate.analysis) {
    const analysisText = candidate.portfolioAnalysis || candidate.analysis;
    const languageMatches = analysisText.match(/(JavaScript|Python|Java|React|Node\.js|TypeScript|Vue\.js|Angular|PHP|Ruby|Go|Rust|C\+\+|C#|Swift|Kotlin|Dart|Flutter|Django|Spring|Express|Laravel|Ruby on Rails|ASP\.NET|Flask|FastAPI|GraphQL|MongoDB|PostgreSQL|MySQL|Redis|Docker|Kubernetes|AWS|Azure|GCP|Git|Linux|HTML|CSS|Sass|Less|Webpack|Babel|Jest|Cypress|Selenium|Jenkins|GitHub Actions|CI\/CD)/gi);
    if (languageMatches) {
      return [...new Set(languageMatches.map(lang => lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()))];
    }
  }
  
  // 확인 가능한 언어가 없으면 추정하지 않는다.
  return [];
}
// Improved parseComponentScores: more flexible patterns
function parseComponentScores(analysisText, candidate) {
  // Prefer direct fields if available
  if (candidate && ['followerScore', 'repoScore', 'languageScore', 'activityScore', 'projectQualityScore', 'technicalDepthScore'].some(key => typeof candidate[key] === 'number')) {
    return {
      '팔로워 수': candidate.followerScore || 0,
      '공개 저장소 수': candidate.repoScore || 0,
      '언어 다양성': candidate.languageScore || 0,
      '최근 활동성': candidate.activityScore || 0,
      '프로젝트 품질': candidate.projectQualityScore || 0,
      '기술적 깊이': candidate.technicalDepthScore || 0,
    };
  }
  
  if (!analysisText) return {};
  
  // 새 분석 결과에서 점수 추출 시도
  const parsedScores = parseNaturalLanguageScores(analysisText);
  if (parsedScores && Object.keys(parsedScores).length > 0) {
    return {
      '팔로워 수': parsedScores['팔로워 수'] || 0,
      '공개 저장소 수': parsedScores['공개 저장소 수'] || 0,
      '언어 다양성': parsedScores['언어 다양성'] || 0,
      '최근 활동성': parsedScores['최근 활동성'] || 0,
      '프로젝트 품질': parsedScores['프로젝트 품질'] || 0,
      '기술적 깊이': parsedScores['기술적 깊이'] || 0,
    };
  }
  
  const result = {};
  // Flexible regex: allow optional :, space, etc
  const regex = /(팔로워 ?수|공개 ?저장소 ?수|언어 ?다양성|최근 ?활동성|프로젝트 ?품질|기술적 ?깊이)[:\s]*([0-9]+)점/g;
  let match;
  while ((match = regex.exec(analysisText)) !== null) {
    result[match[1].replace(/ /g,"")] = parseInt(match[2], 10);
  }
  return result;
}

// Parse scores from natural language ai_analysis_data.analysis_data
function parseNaturalLanguageScores(text) {
  if (!text) return null;
  try {
    const structured = JSON.parse(text);
    if (structured?.version === 'github-evidence-v1' && Array.isArray(structured.dimensions)) {
      const dimensionScores = Object.fromEntries(structured.dimensions.map(item => [item.name, item.score || 0]));
      return {
        '팔로워 수': dimensionScores['팔로워 수'] || 0,
        '공개 저장소 수': dimensionScores['공개 저장소 수'] || 0,
        '언어 다양성': dimensionScores['언어 다양성'] || dimensionScores['기술 스택'] || 0,
        '최근 활동성': dimensionScores['최근 활동성'] || dimensionScores['활동 신호'] || 0,
        '프로젝트 품질': dimensionScores['프로젝트 품질'] || 0,
        '기술적 깊이': dimensionScores['기술적 깊이'] || Math.min(20, (dimensionScores['문제 해결 깊이'] || 0) + (dimensionScores['커뮤니티·협업 신호'] || 0)),
        totalScore: Number(structured.score || 0),
      };
    }
  } catch (_) {
    // 구버전 자연어 분석은 아래 호환 파서로 처리한다.
  }
  let scoreSection = text;
  // Extract only the '점수 부여' section
  const scoreStart = text.indexOf('점수 부여');
  if (scoreStart !== -1) {
    // Find next numbered section (e.g., '\n5.') or end
    const after = text.slice(scoreStart);
    const nextSection = after.search(/\n\d+\./);
    scoreSection = after.slice(0, nextSection !== -1 ? nextSection : undefined);
  }
  const result = {};
  const lines = scoreSection.split('\n');
  const patterns = [
    { key: '팔로워 수', label: '팔로워 수' },
    { key: '공개 저장소 수', label: '공개 저장소 수' },
    { key: '언어 다양성', label: '언어 다양성' },
    { key: '최근 활동성', label: '최근 활동성' },
    { key: '프로젝트 품질', label: '프로젝트 품질' },
    { key: '기술적 깊이', label: '기술적 깊이' }
  ];
  patterns.forEach(({key, label}) => {
    let found = 0;
    for (const line of lines) {
      if (line.includes(label)) {
        // 1. Try to match '→ 숫자점'
        const arrowMatch = line.match(/→\s*(\d+)점/);
        if (arrowMatch) {
          found = parseInt(arrowMatch[1], 10);
          break;
        }
        // 2. Fallback: last number before '점'
        const matches = [...line.matchAll(/([0-9]+)\s*점/g)];
        if (matches.length > 0) {
          found = parseInt(matches[matches.length - 1][1], 10);
          break;
        }
      }
    }
    result[key] = found;
  });
  // 총점
  const totalMatch = scoreSection.match(/총점[^\n]*?(?:[=\-→])?\s*([0-9]+)점/g);
  if (totalMatch) {
    const last = totalMatch[totalMatch.length - 1];
    const num = last.match(/([0-9]+)점/);
    result.totalScore = num ? parseInt(num[1], 10) : null;
  }
  return result;
}

export default function CandidateList({ activeTab = 'all' }) {
  const { postId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState(location.state?.candidates || []);
  const [aiAnalysisResults, setAiAnalysisResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [postInfo, setPostInfo] = useState(null);
  const [loading, setLoading] = useState(!location.state?.candidates);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [modalScore, setModalScore] = useState(null);

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [compareSelected, setCompareSelected] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const [companyAdminId, setCompanyAdminId] = useState(null);

  // 1. 이메일 템플릿 정의 (CompanyDashboard에서 복사)
  const emailTemplates = {
    professional: {
      name: "Professional",
      description: "Clean and polished",
      preview: "🏢 Formal and focused",
      defaultGreeting: "Hello",
      defaultMessage: "We were impressed by your engineering work and would love to explore an opportunity with you.",
      color: "#2563eb",
      bgColor: "#eff6ff"
    },
    friendly: {
      name: "Friendly",
      description: "Warm and approachable",
      preview: "😊 Relaxed and personal",
      defaultGreeting: "Hi",
      defaultMessage: "I came across your GitHub profile and was genuinely impressed. Would you like to grow with our team?",
      color: "#059669",
      bgColor: "#ecfdf5"
    },
    modern: {
      name: "Modern",
      description: "Sleek and innovative style",
      preview: "🚀 Trendy and forward-thinking tone",
      defaultGreeting: "Hello",
      defaultMessage: "We're building the future of technology and would love to have you join our journey. Your skills perfectly match what we're looking for.",
      color: "#7c3aed",
      bgColor: "#f3e8ff"
    }
  };

  // 2. 템플릿 HTML 생성 함수 (CompanyDashboard에서 복사, postInfo 사용)
  const generateTemplateHtml = (candidate, templateKey, greeting, message) => {
    const escapeHtml = value => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    if (!candidate) {
      candidate = { githubLogin: 'candidate', candidateEmail: '' };
    }
    const postTitle = escapeHtml(postInfo?.postTitle || 'Open role');
    const postDescription = escapeHtml(postInfo?.postDescription || '');
    const githubLogin = escapeHtml(candidate.githubLogin || 'candidate');
    const companyName = escapeHtml(postInfo?.companyName || 'Our company');
    const postLocation = escapeHtml(postInfo?.postLocation || 'Remote');
    const postProgrammingLanguage = escapeHtml(postInfo?.postProgrammingLanguage || 'Java');
    const postSalaryStart = escapeHtml(postInfo?.postSalaryStart || '5000');
    const postSalaryEnd = escapeHtml(postInfo?.postSalaryEnd || '6000');
    greeting = escapeHtml(greeting);
    message = escapeHtml(message);
    const postStartDate = postInfo?.postPostedDate ? formatDate(postInfo.postPostedDate) : '';
    const postEndDate = postInfo?.postExpiryDate ? formatDate(postInfo.postExpiryDate) : '';
    const recruitmentPeriod = postStartDate && postEndDate ? `${postStartDate} ~ ${postEndDate}` : 'Open until filled';
    if (templateKey === 'professional') {
      return `<div style="font-family:Arial, sans-serif; background-color:#f8fafc; padding:20px;"><div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding:30px; text-align:center;"><h1 style="color:white; margin:0; font-size:28px; font-weight:bold;">${companyName}</h1><p style="color:#e0e7ff; margin:10px 0 0 0; font-size:14px;">Engineering opportunity</p></div><div style="padding:30px;"><h2 style="color:#1e293b; margin:0 0 20px 0; font-size:24px;">${greeting} ${githubLogin},</h2><p style="color:#475569; font-size:16px; line-height:1.6; margin:0 0 25px 0;">${message}</p><div style="background:#f1f5f9; border-radius:8px; padding:20px; margin:25px 0;"><h3 style="color:#2563eb; margin:0 0 15px 0; font-size:20px;">📋 ${postTitle}</h3><p style="color:#475569; margin:0 0 15px 0; line-height:1.6;">${postDescription}</p><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:14px;"><div><strong>Stack:</strong> ${postProgrammingLanguage}</div><div><strong>Location:</strong> ${postLocation}</div><div><strong>Salary:</strong> ${postSalaryStart} ~ ${postSalaryEnd}</div><div><strong>Period:</strong> ${recruitmentPeriod}</div></div></div><div style="text-align:center; margin:30px 0;"><a href="{{invitationLink}}" style="background:#2563eb; color:white; text-decoration:none; padding:15px 30px; border-radius:8px; font-weight:bold; display:inline-block; font-size:16px;">View opportunity</a></div><p style="color:#64748b; font-size:14px; margin:0;">Best regards,<br/>${companyName} Recruiting</p></div></div></div>`;
    } else if (templateKey === 'friendly') {
      return `<div style="font-family:Arial, sans-serif; background-color:#f0fdf4; padding:20px;"><div style="max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; border:3px solid #22c55e;"><div style="background:linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding:25px; text-align:center;"><h1 style="color:white; margin:0; font-size:26px;">🌟 ${companyName} 🌟</h1><p style="color:#bbf7d0; margin:10px 0 0 0;">We are looking for our next teammate!</p></div><div style="padding:25px;"><h2 style="color:#166534; margin:0 0 20px 0; font-size:22px;">😊 ${greeting} ${githubLogin}!</h2><p style="color:#374151; font-size:16px; line-height:1.7; margin:0 0 20px 0;">${message}</p><div style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius:12px; padding:20px; margin:20px 0; border-left:4px solid #22c55e;"><h3 style="color:#22c55e; margin:0 0 15px 0; font-size:18px;">🎯 ${postTitle}</h3><p style="color:#374151; margin:0 0 15px 0; line-height:1.6;">${postDescription}</p><div style="background:white; border-radius:8px; padding:15px; margin:15px 0;"><p style="margin:5px 0; color:#059669;"><strong>💻 Stack:</strong> ${postProgrammingLanguage}</p><p style="margin:5px 0; color:#059669;"><strong>📍 Location:</strong> ${postLocation}</p><p style="margin:5px 0; color:#059669;"><strong>💰 Salary:</strong> ${postSalaryStart} ~ ${postSalaryEnd}</p><p style="margin:5px 0; color:#059669;"><strong>📅 Period:</strong> ${recruitmentPeriod}</p></div></div><div style="text-align:center; margin:25px 0;"><a href="{{invitationLink}}" style="background:#22c55e; color:white; text-decoration:none; padding:12px 25px; border-radius:25px; font-weight:bold; display:inline-block; font-size:16px;">🚀 Explore the role</a></div><p style="color:#6b7280; font-size:14px; margin:0; text-align:center;">💝 The ${companyName} team</p></div></div></div>`;
    } else { // modern
      // The template contains escaped SVG attribute quotes inside a string literal.
      // eslint-disable-next-line no-useless-escape
      return `<div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#0f0f0f; padding:20px;"><div style="max-width:600px; margin:0 auto; background:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius:20px; overflow:hidden; border:1px solid #7c3aed;"><div style="background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding:30px; text-align:center; position:relative;"><div style="position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>');"></div><h1 style="color:white; margin:0; font-size:24px; font-weight:300; position:relative; z-index:1;">${companyName}</h1><p style="color:#c4b5fd; margin:10px 0 0 0; font-size:12px; position:relative; z-index:1; text-transform:uppercase; letter-spacing:2px;">NEXT GENERATION TECH</p></div><div style="padding:30px; color:#e5e7eb;"><h2 style="color:#f3f4f6; margin:0 0 20px 0; font-size:20px; font-weight:300;">${greeting} ${githubLogin},</h2><p style="color:#d1d5db; font-size:15px; line-height:1.8; margin:0 0 25px 0; font-weight:300;">${message}</p><div style="background:rgba(124, 58, 237, 0.1); border:1px solid #7c3aed; border-radius:12px; padding:20px; margin:25px 0;"><h3 style="color:#a855f7; margin:0 0 15px 0; font-size:18px; font-weight:400;">${postTitle}</h3><p style="color:#d1d5db; margin:0 0 15px 0; line-height:1.7; font-weight:300;">${postDescription}</p><div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:15px; margin:15px 0;"><div style="background:rgba(168, 85, 247, 0.1); border-radius:8px; padding:10px; text-align:center;"><div style="color:#a855f7; font-size:12px; margin-bottom:5px;">STACK</div><div style="color:#f3f4f6; font-weight:500; font-size:14px;">${postProgrammingLanguage}</div></div><div style="background:rgba(168, 85, 247, 0.1); border-radius:8px; padding:10px; text-align:center;"><div style="color:#a855f7; font-size:12px; margin-bottom:5px;">LOCATION</div><div style="color:#f3f4f6; font-weight:500; font-size:14px;">${postLocation}</div></div><div style="background:rgba(168, 85, 247, 0.1); border-radius:8px; padding:10px; text-align:center;"><div style="color:#a855f7; font-size:12px; margin-bottom:5px;">SALARY</div><div style="color:#f3f4f6; font-weight:500; font-size:14px;">${postSalaryStart}~${postSalaryEnd}</div></div><div style="background:rgba(168, 85, 247, 0.1); border-radius:8px; padding:10px; text-align:center;"><div style="color:#a855f7; font-size:12px; margin-bottom:5px;">PERIOD</div><div style="color:#f3f4f6; font-weight:500; font-size:14px;">${recruitmentPeriod}</div></div></div></div><div style="text-align:center; margin:30px 0;"><a href="{{invitationLink}}" style="background:linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color:white; text-decoration:none; padding:15px 35px; border-radius:30px; font-weight:500; display:inline-block; font-size:14px; text-transform:uppercase; letter-spacing:1px; border:1px solid #7c3aed;">JOIN US</a></div><div style="text-align:center; color:#9ca3af; font-size:12px; margin:0; opacity:0.8;">${companyName} • Engineering Team</div></div></div></div>`;
    }
  };

  // 3. 모달 상태 추가
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkCustomGreeting, setBulkCustomGreeting] = useState('');
  const [bulkCustomMessage, setBulkCustomMessage] = useState('');
  const [bulkSelectedTemplate, setBulkSelectedTemplate] = useState('professional');
  const [bulkEmailSending, setBulkEmailSending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  // 4. 모달 열기 함수
  const openBulkEmailModal = () => {
    const postTitle = postInfo?.postTitle || 'Engineering opportunity';
    const companyName = postInfo?.companyName || 'Our company';
    setBulkSelectedTemplate('professional');
    setBulkCustomGreeting(emailTemplates.professional.defaultGreeting);
    setBulkCustomMessage(emailTemplates.professional.defaultMessage);
    setBulkEmailSubject(`[${companyName}] ${postTitle} - Special invitation`);
    setShowBulkEmailModal(true);
  };

  // 5. 템플릿 변경 핸들러
  const handleBulkTemplateChange = (templateKey) => {
    setBulkSelectedTemplate(templateKey);
    const template = emailTemplates[templateKey];
    setBulkCustomGreeting(template.defaultGreeting);
    setBulkCustomMessage(template.defaultMessage);
  };

  // 6. 메일 전송 함수 (템플릿 기반)
  const handleBulkMailSend = async () => {
    if (!bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()) {
      setActionFeedback({ type: 'error', message: 'Please enter a subject, greeting, and message.' });
      return;
    }
    if (selected.length === 0) return;
    if (!companyAdminId) {
      setActionFeedback({ type: 'error', message: 'We could not verify the company administrator. Refresh the page and try again.' });
      return;
    }
    const candidatesToSend = candidates.filter(c => selected.includes(c.githubLogin || c.login) && c.candidateEmail);
    if (candidatesToSend.length === 0) {
      setActionFeedback({ type: 'error', message: 'Select candidates with email addresses.' });
      return;
    }
    setActionFeedback({ type: '', message: '' });
    setBulkEmailSending(true);
    try {
      // 템플릿 HTML 생성 (플레이스홀더)
      const htmlTemplate = generateTemplateHtml(
        { githubLogin: "{{githubLogin}}", candidateEmail: "{{candidateEmail}}" },
        bulkSelectedTemplate,
        bulkCustomGreeting,
        bulkCustomMessage
      );
      const res = await authenticatedFetch(apiUrl('/api/invitations/send-bulk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: postId,
          companyAdminId: companyAdminId,
          candidates: candidatesToSend.map(c => ({ githubLogin: c.githubLogin || c.login, candidateEmail: c.candidateEmail })),
          customEmailSubject: bulkEmailSubject,
          customEmailContent: htmlTemplate
        })
      });
      if (res.ok) {
        setActionFeedback({ type: 'success', message: `Email sent to ${candidatesToSend.length} candidate(s).` });
        setShowBulkEmailModal(false);
        setBulkEmailSubject('');
        setBulkCustomGreeting('');
        setBulkCustomMessage('');
        setBulkSelectedTemplate('professional');
        setBulkEmailSending(false);
        navigate('/company/dashboard');
      } else {
        setActionFeedback({ type: 'error', message: 'Email delivery failed.' });
        setBulkEmailSending(false);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: 'A server error prevented email delivery.' });
      setBulkEmailSending(false);
    }
  };

  // 실제 데이터 fetch (네가 쓰던 코드 그대로!)
  useEffect(() => {
    setLoadError('');
    // 공고 정보 조회
    authenticatedFetch(apiUrl(`/api/postings/info/${postId}`))
      .then(res => {
        if (!res.ok) throw new Error('공고 정보 조회 실패');
        return res.json();
      })
      .then(data => setPostInfo(data))
      .catch(() => setPostInfo(null));

    // 후보자 데이터 조회 (DB에서)
    const fetchCandidates = async () => {
      try {
        const response = await authenticatedFetch(apiUrl(`/api/github-search/by-post/${postId}`));
        if (!response.ok) throw new Error('후보자 데이터 조회 실패');
        const candidatesData = await response.json();

        // AI 분석 결과도 함께 조회
        const aiResponse = await authenticatedFetch(apiUrl(`/api/ai-analysis-results/post/${postId}`));
        let aiAnalysisData = [];
        if (aiResponse.ok) aiAnalysisData = await aiResponse.json();
        setAiAnalysisResults(aiAnalysisData);

        const aiAnalysisMap = {};
        aiAnalysisData.forEach(ai => {
          if (ai.githubSearchResultId) aiAnalysisMap[ai.githubSearchResultId] = ai;
        });

        const mappedCandidates = candidatesData.map(candidate => {
          const aiAnalysis = aiAnalysisMap[candidate.githubSearchResultId];
          let portfolioAnalysis = '';
          let candidateLanguages = '';
          if (aiAnalysis && aiAnalysis.analysisData) {
            portfolioAnalysis = aiAnalysis.analysisData;
            candidateLanguages = candidate.candidateLanguages || candidate.languages || '';
          } else {
            portfolioAnalysis = 'AI 분석 결과 없음';
          }
          return {
            score: candidate.analysisScore || 0,
            portfolioAnalysis: portfolioAnalysis,
            candidateLanguages: candidateLanguages,
            profileUrl: candidate.githubProfileUrl,
            githubSearchResultId: candidate.githubSearchResultId,
            ...candidate,
            candidateEmail: candidate.candidateEmail === 'not_found@example.com' ? null : candidate.candidateEmail
          };
        });

        // 이메일 있는 사람을 먼저, 없는 사람을 나중에 정렬
        const emailFirst = mappedCandidates.filter(c => Boolean(c.candidateEmail));
        const noEmail = mappedCandidates.filter(c => !c.candidateEmail);
        setCandidates([...emailFirst, ...noEmail]);
        setLoading(false);
      } catch (error) {
        setLoadError('후보자 목록을 불러오지 못했습니다. 백엔드 연결 상태를 확인한 뒤 다시 시도해 주세요.');
        setCandidates([]);
        setLoading(false);
      }
    };

    // 후보자가 이미 state로 넘어온 경우
    if (location.state?.candidates) {
      setLoading(false);
      setCandidates(location.state.candidates);
      return;
    }
    fetchCandidates();
  }, [postId, location.state, reloadToken]);

  // 2. Add useEffect to update companyAdminId when postInfo changes
  useEffect(() => {
    if (postInfo && postInfo.companyAdminId) setCompanyAdminId(postInfo.companyAdminId);
  }, [postInfo]);

  const toggleSelect = (login) => {
    setSelected(prev =>
      prev.includes(login) ? prev.filter(l => l !== login) : [...prev, login]
    );
  };

  const toggleCompare = (login) => {
    setCompareSelected(prev => {
      if (prev.includes(login)) return prev.filter(item => item !== login);
      if (prev.length >= 3) return prev;
      return [...prev, login];
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const openAnalysisModal = (analysis, score, candidate) => {
    // 점수 추출 개선
    let finalScore = typeof score === 'number' && score > 0 ? score : extractScore(analysis);
    if (typeof finalScore !== 'number' || finalScore <= 0) finalScore = null;
    
    setSelectedAnalysis(analysis);
    setModalScore(finalScore);
    setSelectedCandidate(candidate);
    setShowAnalysisModal(true);
  };
  const closeAnalysisModal = () => {
    setShowAnalysisModal(false);
    setSelectedAnalysis(null);
    setModalScore(0);
    setSelectedCandidate(null);
  };

  const comparableScores = candidates
    .map(candidate => {
      const value = candidate?.analysisScore ?? candidate?.score ?? candidate?.aiAnalysis?.analysisScore;
      return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
    })
    .filter(value => value !== null);
  const averageCandidateScore = comparableScores.length
    ? Math.round(comparableScores.reduce((sum, value) => sum + value, 0) / comparableScores.length)
    : null;
  const percentileScore = (percentile) => {
    if (!comparableScores.length) return null;
    const sorted = [...comparableScores].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((percentile / 100) * sorted.length) - 1);
    return sorted[Math.max(0, index)];
  };
  const top25CandidateScore = percentileScore(75);
  const top10CandidateScore = percentileScore(90);

  if (loading) {
    return <Wrapper><Navbar /><Container>Loading candidates...</Container></Wrapper>;
  }

  if (loadError) {
    return (
      <Wrapper>
        <Navbar />
        <Container>
          <div role="alert" style={{ maxWidth: 640, margin: '5rem auto', padding: '2.5rem 2rem', border: '1px solid #fecaca', borderRadius: 20, background: '#fff7f7', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h1 style={{ margin: 0, color: '#991b1b', fontSize: '1.35rem' }}>We could not load candidates</h1>
            <p style={{ color: '#7f1d1d', lineHeight: 1.6 }}>{loadError}</p>
            <button type="button" onClick={() => { setLoading(true); setReloadToken(value => value + 1); }} style={{ border: 0, borderRadius: 999, padding: '0.8rem 1.4rem', background: '#16b886', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        </Container>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <SEO 
        title={`${postInfo?.postTitle ? `${postInfo.postTitle} - Candidate review` : 'Candidate review'}`}
        description={`${postInfo?.postTitle ? `Review ${candidates.length} AI-ranked candidates for ${postInfo.postTitle}.` : 'Review AI-ranked developer candidates with traceable evidence.'}`}
        keywords={`${postInfo?.postTitle ? `${postInfo.postTitle}, candidate review, AI recruiting, GitHub developers` : 'candidate review, AI recruiting, GitHub developers'}`}
      />
      <Navbar />
      <Container>
        {actionFeedback.message && (
          <div
            role={actionFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: 12, background: actionFeedback.type === 'error' ? '#fff7f7' : '#effcf7', border: `1px solid ${actionFeedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`, color: actionFeedback.type === 'error' ? '#991b1b' : '#166534', fontWeight: 700 }}
          >
            {actionFeedback.message}
          </div>
        )}
        {/* 공고 정보 */}
        {postInfo && (
          <PostInfoCard>
            <PostInfoHeader>{postInfo.postTitle}</PostInfoHeader>
            <PostInfoGrid>
              <div><InfoLabel>Location</InfoLabel><InfoText>{postInfo.postLocation || 'Not specified'}</InfoText></div>
              <div><InfoLabel>Salary</InfoLabel><InfoText>{postInfo.postSalaryStart || '0'} – {postInfo.postSalaryEnd || '0'}</InfoText></div>
              <div><InfoLabel>Openings</InfoLabel><InfoText>{postInfo.postHeadcount || 0}</InfoText></div>
              <div><InfoLabel>Posted</InfoLabel><InfoText>{formatDate(postInfo.postPostedDate)}</InfoText></div>
            </PostInfoGrid>
            {postInfo.postDescription && (
              <PostDesc>
                <InfoLabel>Description</InfoLabel><InfoText>{postInfo.postDescription}</InfoText>
              </PostDesc>
            )}
          </PostInfoCard>
        )}

        {candidates.length > 0 && (
          <DecisionLens candidates={candidates} aiAnalysisResults={aiAnalysisResults} />
        )}

        {/* 후보자 헤더 */}
        <CandidatesHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.2rem' }}>
          <SectionTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', margin: 0 }}>
            <TargetIcon />Recommended candidates
            <b style={{ color: '#30c59b', fontWeight: 800, fontSize: '1.18em', margin: '0 0.1em' }}>{candidates.length}</b>
          </SectionTitle>
          {candidates.length > 0 && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <TossAnalysisButton
                onClick={() => setShowComparisonModal(true)}
                disabled={compareSelected.length < 2}
                style={{ width: 190, minWidth: 170, background: compareSelected.length >= 2 ? '#0f766e' : '#dbe5e3' }}
              >
                {compareSelected.length >= 2 ? `Compare (${compareSelected.length})` : 'Compare 2–3'}
              </TossAnalysisButton>
              <TossAnalysisButton
                onClick={openBulkEmailModal}
                disabled={selected.length === 0}
                style={{ width: 220, minWidth: 180 }}
              >
                {selected.length > 0 ? `Email (${selected.length})` : 'Email candidates'}
              </TossAnalysisButton>
            </div>
          )}
        </CandidatesHeader>

        {/* 포스터 가로 스크롤 */}
        {candidates.length === 0 ? (
          <PostDesc>No recommended candidates yet.<br />Candidates will appear when the search is complete.</PostDesc>
        ) : (
          <PosterScrollWrap>
            <PostersRow>
              {candidates.map((candidate, idx) => {
                // Find matching aiAnalysisResult by githubSearchResultId
                const analysisResult = aiAnalysisResults.find(
                  ai => ai.githubSearchResultId === candidate.githubSearchResultId
                );
                return (
                  <div key={candidate.githubLogin || idx} style={{ marginBottom: 24, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #e0f7ef44', padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                    {/* TossCandidateCard 등 기존 후보자 정보 렌더링 */}
                    <TossCandidateCard
                      candidate={candidate}
                      analysisResult={analysisResult}
                      selected={selected.includes(candidate.githubLogin || candidate.login)}
                      onClick={() => toggleSelect(candidate.githubLogin || candidate.login)}
                      openAnalysisModal={openAnalysisModal}
                      toggleSelect={toggleSelect}
                      compareSelected={compareSelected.includes(candidate.githubLogin || candidate.login)}
                      toggleCompare={toggleCompare}
                    />

                  </div>
                );
              })}
            </PostersRow>
          </PosterScrollWrap>
        )}

        {/* 메일 보내기 버튼 */}
        {/* The mail button is now moved to CandidatesHeader */}
      </Container>

      {showComparisonModal && (
        <CandidateComparisonModal
          candidates={candidates}
          aiAnalysisResults={aiAnalysisResults}
          selectedLogins={compareSelected}
          onClose={() => setShowComparisonModal(false)}
        />
      )}

      {/* --- AI 분석 모달 --- */}
      {showAnalysisModal && selectedAnalysis && selectedCandidate && (
        <ModalOverlay onClick={closeAnalysisModal}>
          <ModalCard onClick={e => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95vw' }}>
            <ModalCloseBtn onClick={closeAnalysisModal}>
              <FaTimes />
            </ModalCloseBtn>
            
            {/* 헤더 */}
            <ModalHeader>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                flexWrap: 'wrap',
                width: '100%'
              }}>
                <img
                  src={`https://github.com/${selectedCandidate.githubLogin || selectedCandidate.login}.png?size=80`}
                  alt={selectedCandidate.githubLogin || selectedCandidate.login}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '3px solid #e5e7eb',
                    marginRight: '10px'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '260px'
                  }}>
                    {selectedCandidate.githubLogin || selectedCandidate.login}
                  </h2>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '16px',
                    color: '#6b7280',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '260px'
                  }}>
                    {selectedCandidate.candidateEmail || selectedCandidate.email}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0,
                  marginLeft: '24px'
                }}>
                  {getCandidateLanguages(selectedCandidate).slice(0, 4).map((lang, index) => (
                    <span key={index} style={{
                      background: `linear-gradient(135deg, ${getLanguageColor(lang)} 0%, ${getLanguageColor(lang, true)} 100%)`,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.10)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.5px'
                    }}>
                      {lang}
                    </span>
                  ))}
                </div>
                <div style={{
                  marginLeft: 'auto',
                  minWidth: '120px',
                  textAlign: 'right',
                  fontSize: '48px',
                  fontWeight: '900',
                  color: '#10b981',
                  letterSpacing: '-2.5px',
                  alignSelf: 'center',
                  lineHeight: 1.1,
                  flexShrink: 0
                }}>
                  {modalScore === null ? 'Score pending' : `${modalScore} points`}
                </div>
              </div>
            </ModalHeader>

            {/* 스크롤 컨텐츠 */}
            <div style={{ padding: '0 32px 32px 32px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <EvidenceTrustPanel candidate={selectedCandidate} analysisText={selectedAnalysis} />
                <AIAnalysisSummary
                  analysis={selectedAnalysis}
                  score={modalScore ?? 0}
                />
                {/* 1. 종합 역량 분석 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* 왼쪽: 레이더 차트 */}
              <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Competency overview
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <RadarChartSVG 
                        scores={parseComponentScores(selectedAnalysis, selectedCandidate)}
                        size={200}
                        totalScore={modalScore ?? undefined}
                        showLabels={true}
                        showScores={false}
                      />
              </div>
                    {/* 점수 요약 */}
                    <div style={{ 
                      marginTop: '16px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                      {Object.entries(parseComponentScores(selectedAnalysis, selectedCandidate)).map(([key, value], index) => (
                        <div key={key} style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
                            {dimensionLabels[key] || key}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#059669' }}>
                            {value} points
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 오른쪽: 기술 스택 분포 */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Technology distribution
              </h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <LanguageDistributionChart 
                        candidate={selectedCandidate}
                        width={420}
                        height={320}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. 상세 분석 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* 항목별 점수 차트 */}
              <div style={{
                background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <ScoreBarChart 
                      scores={parseComponentScores(selectedAnalysis, selectedCandidate)}
                      maxScores={{
                        '팔로워 수': 10,
                        '공개 저장소 수': 15,
                        '언어 다양성': 15,
                        '최근 활동성': 20,
                        '프로젝트 품질': 20,
                        '기술적 깊이': 20
                      }}
                      height={420}
                      width={600}
                    />
                  </div>
                  {/* 적합 직무 */}
                  <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <SuitableJobsVisual 
                      jobs={extractSuitableJobs(selectedAnalysis)}
                      width={'100%'}
                      height={250}
                    />
                  </div>
                </div>

                {/* 3. 강점/약점 분석 및 성장 가능성 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* 강점/약점 분석 */}
                  <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <StrengthsWeaknesses analysisText={selectedAnalysis} />
                  </div>
                  {/* 성장 가능성 */}
                  <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <GrowthPotentialVisual 
                      growthText={extractGrowthPotential(selectedAnalysis)}
                      width={500}
                      height={250}
                    />
                  </div>
                </div>

                {/* 4. 비교 분석 섹션 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* 점수 분포 차트 */}
                  <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <ScoreDistributionChart 
                      currentScore={modalScore}
                      averageScore={averageCandidateScore}
                      top10Percent={top10CandidateScore}
                      top25Percent={top25CandidateScore}
                      width={500}
                      height={350}
                    />
                  </div>
                  
                  {/* 커밋 히트맵 */}
                  <div style={{ 
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                      Activity history
                    </h3>
                    <CommitHeatmap 
                      commits={Array.isArray(selectedCandidate?.commitHistory) ? selectedCandidate.commitHistory : []}
                      width={'100%'}
                      height={200}
                    />
                  </div>
                </div>

                {/* 5. 프로젝트 섹션 */}
                <div style={{ 
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: '800', color: '#1e40af', letterSpacing: '-1px', textAlign: 'center' }}>
                    Featured projects
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {(Array.isArray(selectedCandidate?.topRepos) ? selectedCandidate.topRepos :
                      Array.isArray(selectedCandidate?.repositories) ? selectedCandidate.repositories : []).map((project, index) => (
                      <div key={index} style={{
                padding: '20px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)',
                        boxShadow: '0 2px 12px rgba(80,120,255,0.07)',
                        border: 'none',
                        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.025)';
                          e.currentTarget.style.boxShadow = '0 8px 24px #60a5fa22';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 12px rgba(80,120,255,0.07)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.5px' }}>
                            {project.name}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fbbf24' }}>
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            <span style={{ fontSize: '15px', color: '#fbbf24', fontWeight: 700 }}>{project.stars}</span>
                            <span style={{ 
                              padding: '4px 12px', 
                              background: '#3b82f6', 
                              color: 'white', 
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '700',
                              letterSpacing: '-0.5px',
                              boxShadow: '0 1px 4px #3b82f622'
                            }}>
                              {project.language}
                            </span>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: '1.7', fontWeight: 600, letterSpacing: '-0.2px' }}>
                          {project.description}
                  </p>
                      </div>
                ))}
                {!(Array.isArray(selectedCandidate?.topRepos) && selectedCandidate.topRepos.length) &&
                 !(Array.isArray(selectedCandidate?.repositories) && selectedCandidate.repositories.length) && (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                    No featured project data was saved. Review the original GitHub profile for details.
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>

            {/* 푸터 */}
            <ModalActionBtn
              onClick={closeAnalysisModal}
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: '32px',
                fontSize: '1.08rem',
                padding: '0.85rem 2rem',
                borderRadius: '16px',
                minWidth: '120px',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #30c59b 0%, #10b981 100%)',
                boxShadow: '0 8px 32px rgba(48,197,155,0.18)',
                zIndex: 20,
                border: 'none',
                color: '#fff',
                outline: 'none',
                cursor: 'pointer',
                transition: 'background 0.18s, box-shadow 0.18s',
                display: 'block'
              }}
            >
                Done
            </ModalActionBtn>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* --- 대량 메일 보내기 모달 --- */}
      {showBulkEmailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop: '32px', paddingBottom: '32px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', boxShadow: '0 0 30px rgba(66, 153, 225, 0.3)', width: '800px', maxWidth: '98vw', minWidth: 0, overflow: 'hidden', position: 'relative'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
              margin: '0',
              padding: '2rem',
              borderRadius: '16px 16px 0 0',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(66, 153, 225, 0.3)'
            }}>
              <h2 style={{
                fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0,
                display: 'flex', alignItems: 'center', gap: '0.75rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
                Batch email ({selected.length})
              </h2>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
              {/* 안내 메시지 */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                padding: '1.2rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #f59e0b', marginTop: '1.5rem'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#92400e', margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2">
                    <path d="M22 2L11 13"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                  </svg>
                  ✨ Send a template-based batch email
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#a16207', lineHeight: '1.5' }}>
                  • <strong>Selected candidates</strong>: send to {selected.length} at once<br/>
                  • <strong>Personalization</strong>: each candidate's name is inserted automatically<br/>
                  • <strong>Professional design</strong>: choose from three branded templates
                </div>
              </div>
              {/* 선택된 후보자 목록 미리보기 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
                  📋 Recipients ({selected.length})
                </label>
                <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb', maxHeight: '100px', overflowY: 'auto' }}>
                  {candidates.filter(c => selected.includes(c.githubLogin || c.login)).map(candidate => (
                    <div key={candidate.githubLogin || candidate.login} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                      <span style={{ fontWeight: '600' }}>{candidate.githubLogin || candidate.login}</span>
                      <span style={{ color: '#6b7280' }}>({candidate.candidateEmail || candidate.email || '이메일 없음'})</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* 템플릿 선택 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '1rem' }}>
                  📧 Choose an email template
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                  {Object.entries(emailTemplates).map(([key, template]) => (
                    <div
                      key={key}
                      onClick={() => handleBulkTemplateChange(key)}
                      style={{
                        border: bulkSelectedTemplate === key ? `2px solid ${template.color}` : '2px solid #e5e7eb',
                        borderRadius: '10px', padding: '0.8rem', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: bulkSelectedTemplate === key ? template.bgColor : '#f9fafb', textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: bulkSelectedTemplate === key ? template.color : '#374151', marginBottom: '0.3rem' }}>{template.name}</div>
                      <div style={{ fontSize: '0.75rem', color: bulkSelectedTemplate === key ? template.color : '#6b7280', marginBottom: '0.4rem' }}>{template.preview}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{template.description}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 제목 입력 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
                  📝 Email subject
                </label>
                <input
                  type="text"
                  value={bulkEmailSubject}
                  onChange={(e) => setBulkEmailSubject(e.target.value)}
                placeholder="Enter an email subject"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = emailTemplates[bulkSelectedTemplate].color}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              {/* 인사말 입력 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
                  👋 Greeting
                </label>
                <input
                  type="text"
                  value={bulkCustomGreeting}
                  onChange={(e) => setBulkCustomGreeting(e.target.value)}
                placeholder="Enter a greeting (for example, Hello)"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = emailTemplates[bulkSelectedTemplate].color}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              {/* 메시지 입력 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
                  💬 Message
                </label>
                <textarea
                  value={bulkCustomMessage}
                  onChange={(e) => setBulkCustomMessage(e.target.value)}
                placeholder="Enter a personalized message"
                  rows={4}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem', resize: 'vertical', transition: 'border-color 0.2s', outline: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
                  onFocus={e => e.target.style.borderColor = emailTemplates[bulkSelectedTemplate].color}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              {/* 미리보기 */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, color: '#2d3748', fontSize: '1rem', display: 'block', marginBottom: '0.5rem' }}>
                  👀 Preview (first candidate)
                </label>
                <div style={{ border: '2px solid #e5e7eb', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9fafb', minHeight: '250px', maxHeight: '300px', overflowY: 'auto' }}>
                  {selected.length > 0 && (() => {
                    const firstSelected = candidates.find(c => selected[0] === (c.githubLogin || c.login));
                    return firstSelected && (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateTemplateHtml(
                            firstSelected,
                            bulkSelectedTemplate,
                            bulkCustomGreeting,
                            bulkCustomMessage
                          )
                        }}
                        style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '153.85%', fontSize: '11px' }}
                      />
                    );
                  })()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
                  Each candidate receives a message with their own name.
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', position: 'sticky', bottom: '0', backgroundColor: 'white', zIndex: 10,
              paddingBottom: '2rem',
              paddingRight: '2rem'
            }}>
              <button
                onClick={() => {
                  setShowBulkEmailModal(false);
                  setBulkEmailSubject('');
                  setBulkCustomGreeting('');
                  setBulkCustomMessage('');
                  setBulkSelectedTemplate('professional');
                }}
                style={{ background: '#e2e8f0', color: '#4a5568', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMailSend}
                disabled={bulkEmailSending || !bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()}
                style={{
                  background: (bulkEmailSending || !bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()) ? '#cbd5e0' : `linear-gradient(135deg, ${emailTemplates[bulkSelectedTemplate].color} 0%, ${emailTemplates[bulkSelectedTemplate].color}dd 100%)`,
                  color: (bulkEmailSending || !bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()) ? '#a0aec0' : 'white',
                  padding: '0.8rem 2rem', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: (bulkEmailSending || !bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: (bulkEmailSending || !bulkEmailSubject.trim() || !bulkCustomGreeting.trim() || !bulkCustomMessage.trim()) ? 'none' : `0 4px 12px ${emailTemplates[bulkSelectedTemplate].color}40`
                }}
                onMouseEnter={e => {
                  if (!bulkEmailSending && bulkEmailSubject.trim() && bulkCustomGreeting.trim() && bulkCustomMessage.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${emailTemplates[bulkSelectedTemplate].color}60`;
                  }
                }}
                onMouseLeave={e => {
                  if (!bulkEmailSending && bulkEmailSubject.trim() && bulkCustomGreeting.trim() && bulkCustomMessage.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${emailTemplates[bulkSelectedTemplate].color}40`;
                  }
                }}
              >
                {bulkEmailSending ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                    Send with {emailTemplates[bulkSelectedTemplate].name} ({selected.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}

// Toss-style Candidate Card (with hover state)
const TossCandidateCard = ({ candidate, analysisResult, selected, onClick, openAnalysisModal, toggleSelect, compareSelected, toggleCompare }) => {
  const analysisText = analysisResult?.analysisData || candidate.portfolioAnalysis || candidate.analysis || '';
  const analysisPayload = getAnalysisPayload(candidate, analysisResult);
  const score = analysisPayload.score ?? 0;
  const keywords = extractKeywords(analysisText);
  const langsArr = getStackArray(candidate.candidateLanguages || candidate.languages);
  const login = candidate.githubLogin || candidate.login;
  const avatarUrl = candidate.avatarUrl || (login ? `https://github.com/${login}.png?size=160` : undefined);
  const githubUrl = candidate.githubProfileUrl || candidate.candidateGithubUrl || (login ? `https://github.com/${login}` : undefined);
  const portfolioEvidence = parsePortfolioEvidence(analysisText);

  // 3D hover + animated graph + dynamic lighting
  const [, setHoverTransform] = React.useState('');
  const [graphTransform, setGraphTransform] = React.useState('');
  const handleMouseMove = e => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 18; // -9deg ~ +9deg
    const rotateX = ((y / rect.height) - 0.5) * -14; // -7deg ~ +7deg
    
    // Set 3D transform for card
    setHoverTransform(`rotateY(${rotateY}deg) rotateX(${rotateX}deg)`);
    
    // Enhanced 3D transform for graph with more dramatic effect
    setGraphTransform(`perspective(600px) rotateY(${rotateY * 1.5}deg) rotateX(${rotateX * 1.5}deg) scale(1.1) translateZ(30px)`);
    
    card.style.setProperty('--hover-rotateY', `${rotateY}deg`);
    card.style.setProperty('--hover-rotateX', `${rotateX}deg`);
    
    // Set dynamic lighting position
    const mouseXPercent = (x / rect.width) * 100;
    const mouseYPercent = (y / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${mouseXPercent}%`);
    card.style.setProperty('--mouse-y', `${mouseYPercent}%`);
  };
  const handleMouseLeave = e => {
    setHoverTransform('');
    setGraphTransform('');
    e.currentTarget.style.setProperty('--hover-rotateY', '0deg');
    e.currentTarget.style.setProperty('--hover-rotateX', '0deg');
    e.currentTarget.style.setProperty('--mouse-x', '50%');
    e.currentTarget.style.setProperty('--mouse-y', '50%');
  };

  const [, setIsHovered] = React.useState(false);

  // Use analysisResult.analysisData if present
  let radarScores, realScore;
  if (analysisResult && analysisResult.analysisData) {
    const parsed = parseNaturalLanguageScores(analysisResult.analysisData);
    radarScores = {
      '팔로워 수': parsed['팔로워 수'] || 0,
      '공개 저장소 수': parsed['공개 저장소 수'] || 0,
      '언어 다양성': parsed['언어 다양성'] || 0,
      '최근 활동성': parsed['최근 활동성'] || 0,
      '프로젝트 품질': parsed['프로젝트 품질'] || 0,
      '기술적 깊이': parsed['기술적 깊이'] || 0,
    };
    realScore = parsed.totalScore !== null ? parsed.totalScore : 0;
  } else {
    realScore = (candidate.aiAnalysis && typeof candidate.aiAnalysis.analysisScore === 'number')
      ? candidate.aiAnalysis.analysisScore
      : (typeof candidate.analysisScore === 'number' ? candidate.analysisScore : 0);
    radarScores = {
      '팔로워 수': candidate.followerScore || 0,
      '공개 저장소 수': candidate.repoScore || 0,
      '언어 다양성': candidate.languageScore || 0,
      '최근 활동성': candidate.activityScore || 0,
      '프로젝트 품질': candidate.projectQualityScore || 0,
      '기술적 깊이': candidate.technicalDepthScore || 0,
    };
  }

  // Never invent a score for an unprocessed candidate. A recruiter must be able
  // to distinguish a real model result from a pending or insufficient-evidence state.
  const isAllZero = radarLabels.every(label => (radarScores[label] || 0) === 0);
  const hasProfileSignals = Object.values(radarScores).some(value => typeof value === 'number' && value > 0);
  let displayScore = realScore;
  if (typeof displayScore !== 'number' || isNaN(displayScore)) {
    displayScore = Object.values(radarScores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
  }
  const hasVerifiedScore = analysisPayload.hasStructuredEvidence && analysisPayload.evidenceCount > 0 && !isAllZero && displayScore > 0;
  const safeRadarScores = hasVerifiedScore || hasProfileSignals ? radarScores : {};
  return (
    <TossCard
      key={login}
      selected={selected}
      onClick={() => toggleSelect(login)}
      onMouseMove={handleMouseMove}
      onMouseLeave={e => { handleMouseLeave(e); setIsHovered(false); }}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: '1.2rem', paddingBottom: '1rem',
        width: 340, minWidth: 340,
        overflow: 'visible',
        height: '480px'
      }}
    >
      {/* 프로필 사진을 카드 맨 위 중앙에 크게 배치 */}
      {avatarUrl && <Avatar src={avatarUrl} alt={login} style={{ margin: '0 auto 1.1rem auto', display: 'block' }} />}
      {/* 이름(깃허브ID) 중앙 정렬로 표시 */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0%', minHeight: 0 }}>
        <div style={{ marginBottom: '0.5rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#263249', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}>{candidate.candidateName || login || <span>&nbsp;</span>}</span>
          {login && candidate.candidateName && (
            <a href={githubUrl} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()} style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              @{login} · GitHub profile
            </a>
          )}
          <button
            type="button"
            aria-pressed={compareSelected}
            onClick={event => { event.stopPropagation(); toggleCompare(login); }}
            style={{ marginTop: 8, border: `1px solid ${compareSelected ? '#0f766e' : '#cbd5e1'}`, borderRadius: 999, padding: '5px 10px', background: compareSelected ? '#ccfbf1' : '#fff', color: compareSelected ? '#0f766e' : '#64748b', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            {compareSelected ? 'Added to comparison' : 'Add to comparison'}
          </button>
          {(typeof candidate.followers === 'number' || typeof candidate.publicRepos === 'number') && (
            <div style={{ display: 'flex', gap: 14, marginTop: 8, color: '#64748b', fontSize: 11, fontWeight: 700 }}>
              <span>{candidate.followers ?? 0} followers</span>
              <span>{candidate.publicRepos ?? candidate.repositoriesCount ?? 0} public repos</span>
            </div>
          )}
        </div>
        {/* TossMetaTag(이메일 있음/없음)는 완전히 제거 */}
        {/* 시각화 요소들로 대체 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1rem',
          width: '100%',
          padding: '0 0.5rem',
          flex: 1
        }}>
                  {/* 3D Radar Chart with Score */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          perspective: '1000px'
        }}>

            <div style={{ 
              transform: graphTransform, 
              transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              position: 'relative',
              zIndex: 3,
              transformStyle: 'preserve-3d'
            }}>
              {/* 3D Shadow Effect */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                width: '130px',
                height: '130px',
                background: 'rgba(0, 0, 0, 0.15)',
                borderRadius: '50%',
                filter: 'blur(12px)',
                zIndex: 1,
                transform: 'translateZ(-30px)',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }} />
              
              {/* Main Chart with 3D Effect */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                transform: 'translateZ(40px)',
                filter: 'drop-shadow(0 12px 24px rgba(48, 197, 155, 0.25))',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              }}>
                <RadarChartSVG 
                  scores={safeRadarScores}
                  size={130} 
                  totalScore={hasVerifiedScore ? displayScore : undefined}
                  showLabels={true}
                  showScores={false}
                />
              </div>
        </div>
          </div>

          {!hasVerifiedScore && (
            <div style={{
              color: '#64748b',
              fontSize: '0.78rem',
              textAlign: 'center',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '7px 12px'
            }}>
              Analysis pending · no verifiable GitHub evidence yet
            </div>
          )}

          {portfolioEvidence && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ color: '#0f766e', background: '#ccfbf1', borderRadius: '999px', padding: '4px 9px', fontSize: '0.72rem', fontWeight: 800 }}>
                Evidence coverage {portfolioEvidence.evidence_coverage ?? 0}%
              </span>
              <span style={{ color: '#475569', background: '#f1f5f9', borderRadius: '999px', padding: '4px 9px', fontSize: '0.72rem', fontWeight: 700 }}>
                Confidence {Math.round((portfolioEvidence.confidence ?? 0) * 100)}%
              </span>
            </div>
          )}
          
          {/* 기술 스택 시각화 */}
          {langsArr.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%'
            }}>
              <div style={{ fontSize: '12px', color: '#30c59b', fontWeight: '600' }}>
                Technology stack
              </div>
              <TechStackVisual languages={langsArr} size={100} />
            </div>
          )}
          
          {/* 핵심 키워드 시각화 */}
          {keywords.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              marginTop: '0.5rem'
            }}>
              <KeywordsVisual keywords={keywords} size={100} />
            </div>
          )}
        </div>
        <TossAnalysisButton style={{ width: '100%', marginTop: 'auto', marginBottom: 0 }} onClick={e => { e.stopPropagation(); openAnalysisModal((analysisResult && analysisResult.analysisData) ? analysisResult.analysisData : analysisText, score, candidate); }}>
          View full analysis
        </TossAnalysisButton>
      </div>
    </TossCard>
  );
};

// ============ 새로운 시각화 컴포넌트들 ============

// 항목별 점수 바 차트
const ScoreBarChart = ({ scores, maxScores, height = 420, width = 600 }) => {
  const categories = Object.keys(scores);
  const categoryLabels = {
    '팔로워 수': 'Followers',
    '공개 저장소 수': 'Public repositories',
    '언어 다양성': 'Language breadth',
    '최근 활동성': 'Recent activity',
    '프로젝트 품질': 'Project quality',
    '기술적 깊이': 'Technical depth'
  };
  // 세로 길이와 하단 여백을 더 넉넉하게
  const maxBarHeight = height - 200; // 상단+하단 여백 증가
  // 바 간격을 더 넓게, 바 너비는 자동 조정
  const barGap = 38;
  const barWidth = (width - 160 - (categories.length - 1) * barGap) / categories.length;

  return (
    <div style={{ 
      width, 
      height, 
      padding: '24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.8)'
    }}>
      <h3 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '20px', 
        fontWeight: '700', 
        color: '#1f2937',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        📊 Dimension scores
      </h3>
      
      <svg width={width - 48} height={height - 140}>
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#764ba2" stopOpacity="0.9"/>
          </linearGradient>
          <linearGradient id="barGradientHover" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="1"/>
            <stop offset="100%" stopColor="#764ba2" stopOpacity="1"/>
          </linearGradient>
          <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(102, 126, 234, 0.3)"/>
          </filter>
          <filter id="barShadowHover" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(102, 126, 234, 0.4)"/>
          </filter>
        </defs>
        
        {/* 배경 그리드 */}
        <g opacity="0.3">
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1={70}
              y1={maxBarHeight - (maxBarHeight * i / 4) + 30}
              x2={width - 108}
              y2={maxBarHeight - (maxBarHeight * i / 4) + 30}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
        </g>
        
        {/* Y축 라벨 */}
        {[0, 1, 2, 3, 4].map(i => (
          <g key={`y-label-${i}`}>
            <text
              x={60}
              y={maxBarHeight - (maxBarHeight * i / 4) + 34}
              fontSize="11"
              fontWeight="600"
              fill="#6b7280"
              textAnchor="end"
            >
              {Math.round((maxScores[Object.keys(maxScores)[0]] || 20) * i / 4)}
            </text>
          </g>
        ))}
        
        {categories.map((category, index) => {
          const score = scores[category] || 0;
          const maxScore = maxScores[category] || 20;
          const percentage = (score / maxScore) * 100;
          const barHeight = (maxBarHeight * percentage) / 100;
          const x = 80 + index * (barWidth + barGap);
          const y = maxBarHeight - barHeight + 30; // 상단에 30px 여백 추가
          
          return (
            <g key={category}>
              {/* 배경 바 */}
              <rect
                x={x}
                y={30}
                width={barWidth}
                height={maxBarHeight}
                fill="#f1f5f9"
                rx={8}
                opacity="0.6"
              />
              
              {/* 점수 바 */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx={8}
                filter="url(#barShadow)"
                style={{ 
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.fill = 'url(#barGradientHover)';
                  e.target.style.filter = 'url(#barShadowHover)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.fill = 'url(#barGradient)';
                  e.target.style.filter = 'url(#barShadow)';
                  e.target.style.transform = 'scale(1)';
                }}
              />
              
              {/* 점수 텍스트 */}
              <text
                x={x + barWidth / 2}
                y={y - 14}
                fontSize="12"
                fontWeight="700"
                fill="#667eea"
                textAnchor="middle"
                style={{ 
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  transition: 'all 0.3s ease'
                }}
              >
                {score}
              </text>
              
              {/* 카테고리 라벨 - 줄바꿈 처리 */}
              {(() => {
                const words = (categoryLabels[category] || category).split(' ');
                const lines = [];
                let currentLine = '';
                
                words.forEach(word => {
                  if ((currentLine + word).length <= 6) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                });
                if (currentLine) lines.push(currentLine);
                
                return lines.map((line, lineIndex) => (
                  <text
                    key={`label-${lineIndex}`}
                    x={x + barWidth / 2}
                    y={maxBarHeight + 50 + (lineIndex * 18)}
                    fontSize="11"
                    fontWeight={lineIndex === 0 ? "600" : "500"}
                    fill={lineIndex === 0 ? "#374151" : "#6b7280"}
                    textAnchor="middle"
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    {line}
                  </text>
                ));
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// 점수 분포 히스토그램
const ScoreDistributionChart = ({ currentScore, averageScore, top10Percent, top25Percent, width = 400, height = 200 }) => {
  const hasComparisonData = [currentScore, averageScore, top10Percent, top25Percent]
    .every(value => typeof value === 'number' && Number.isFinite(value));

  if (!hasComparisonData) {
    return (
      <div style={{ width: '100%', minWidth: 0, minHeight: height, padding: '32px', boxShadow: '0 6px 32px rgba(80,120,255,0.10)', borderRadius: '24px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '22px', fontWeight: '800', color: '#1e40af' }}>Candidate comparison</h3>
        <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>There is not enough comparable AI scoring data yet.<br />This view will use real candidate data as analyses accumulate.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minWidth: 0, height, padding: '32px', boxShadow: '0 6px 32px rgba(80,120,255,0.10)', borderRadius: '24px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}>
      <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: '800', color: '#1e40af', letterSpacing: '-1px', textAlign: 'center' }}>
        Candidate comparison
      </h3>
      <svg width={width - 64} height={height - 120} style={{ display: 'block', margin: '0 auto' }}>
        {/* 그래프 배경 */}
        <rect x={0} y={0} width={width - 64} height={height - 120} fill="url(#bgGradient)" rx={16} />
        <defs>
          <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2={height - 120}>
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#f0f4ff" stopOpacity="0.9"/>
          </linearGradient>
          <linearGradient id="curveGradient" x1="0" y1="0" x2={width - 64} y2={height - 120} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa"/>
            <stop offset="100%" stopColor="#1e40af"/>
          </linearGradient>
        </defs>
        {/* 분포 곡선 (부드러운 곡선) */}
        <path
          d={`M 0 ${height - 140} Q ${(width - 64) * 0.25} ${height - 200}, ${(width - 64) * 0.5} ${height - 160} Q ${(width - 64) * 0.75} ${height - 100}, ${width - 64} ${height - 140}`}
          fill="none"
          stroke="url(#curveGradient)"
          strokeWidth="4"
          filter="drop-shadow(0 2px 8px #60a5fa33)"
        />
        {/* 평균선 */}
        <line
          x1={(width - 64) * (averageScore / 100)}
          y1={0}
          x2={(width - 64) * (averageScore / 100)}
          y2={height - 120}
          stroke="#6366f1"
          strokeWidth="3"
          strokeDasharray="6,4"
        />
        <text
          x={(width - 64) * (averageScore / 100) + 8}
          y={24}
          fontSize="12"
          fill="#6366f1"
          fontWeight="700"
        >
          Average: {averageScore}
        </text>
        {/* 상위 25% 선 */}
        <line
          x1={(width - 64) * (top25Percent / 100)}
          y1={0}
          x2={(width - 64) * (top25Percent / 100)}
          y2={height - 120}
          stroke="#fbbf24"
          strokeWidth="2.5"
          strokeDasharray="4,3"
        />
        <text
          x={(width - 64) * (top25Percent / 100) + 8}
          y={44}
          fontSize="12"
          fill="#fbbf24"
          fontWeight="700"
        >
          Top 25%: {top25Percent}
        </text>
        {/* 상위 10% 선 */}
        <line
          x1={(width - 64) * (top10Percent / 100)}
          y1={0}
          x2={(width - 64) * (top10Percent / 100)}
          y2={height - 120}
          stroke="#f87171"
          strokeWidth="2.5"
          strokeDasharray="4,3"
        />
        <text
          x={(width - 64) * (top10Percent / 100) + 8}
          y={64}
          fontSize="12"
          fill="#f87171"
          fontWeight="700"
        >
          Top 10%: {top10Percent}
        </text>
        {/* 현재 점수 마커 */}
        <circle
          cx={(width - 64) * (currentScore / 100)}
          cy={height - 160}
          r="11"
          fill="#10b981"
          stroke="#fff"
          strokeWidth="4"
          filter="drop-shadow(0 2px 8px #10b98133)"
        />
        <text
          x={(width - 64) * (currentScore / 100)}
          y={height - 180}
          fontSize="15"
          fill="#10b981"
          fontWeight="900"
          textAnchor="middle"
        >
          {currentScore}
        </text>
        {/* X축 라벨 및 눈금 */}
        <text x={0} y={height - 90} fontSize="12" fill="#64748b">0</text>
        <text x={(width - 64) / 2} y={height - 90} fontSize="12" fill="#64748b" textAnchor="middle">50</text>
        <text x={width - 64} y={height - 90} fontSize="12" fill="#64748b" textAnchor="end">100</text>
        <line x1={0} y1={height - 110} x2={width - 64} y2={height - 110} stroke="#e0e7ef" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

// Legacy visualization retained for backwards-compatible imports.
// eslint-disable-next-line no-unused-vars
const TechStackWordCloud = ({ languages, width = 400, height = 200 }) => {
  if (!languages || languages.length === 0) return null;
  
  // 언어별 가중치 계산 (예시)
  const languageWeights = languages.reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});
  
  const maxWeight = Math.max(...Object.values(languageWeights));
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  
  return (
    <div style={{ width, height, padding: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
        Technology distribution
      </h3>
      <div style={{ 
        width: width - 40, 
        height: height - 60, 
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {Object.entries(languageWeights).map(([lang, weight], index) => {
          const fontSize = 12 + (weight / maxWeight) * 20;
          const opacity = 0.6 + (weight / maxWeight) * 0.4;
          
          return (
            <div
              key={lang}
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: '600',
                color: colors[index % colors.length],
                opacity,
                padding: '4px 8px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: `scale(${1 + (weight / maxWeight) * 0.2})`
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = `scale(${1.1 + (weight / maxWeight) * 0.2})`;
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = `scale(${1 + (weight / maxWeight) * 0.2})`;
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              {lang}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 실제 GitHub 데이터 기반 언어 분포 차트
const LanguageDistributionChart = ({ candidate, width = 300, height = 300 }) => {
  // GitHub 데이터에서 언어별 통계 추출
  const getLanguageStats = (candidate) => {
    // 백엔드에서 받은 skills_analysis 데이터 사용
    const skillsAnalysis = candidate.skills_analysis || candidate.skillsAnalysis || {};
    
    if (Object.keys(skillsAnalysis).length > 0) {
      // 실제 GitHub 데이터가 있는 경우
      return Object.entries(skillsAnalysis).map(([lang, stats]) => ({
        language: lang,
        count: stats.count,
        stars: stats.stars,
        size: stats.size,
        // 저장소 수와 스타 수를 종합한 가중치
        weight: (stats.count * 0.6) + (stats.stars * 0.4)
      })).sort((a, b) => b.weight - a.weight);
    }
    
    // If only a language list is available, preserve the language signal but do
    // not fabricate stars, repository size, or other GitHub measurements.
    const languages = getCandidateLanguages(candidate);
    return languages.map((lang, index) => ({
      language: lang,
      count: 1,
      stars: 0,
      size: 0,
      weight: languages.length - index // 순서대로 가중치 부여
    }));
  };
  
  const languageStats = getLanguageStats(candidate);
  const totalWeight = languageStats.reduce((sum, lang) => sum + lang.weight, 0);
  const colors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#06b6d4'
  ];
  
  let currentAngle = 0;
  const radius = Math.min(width, height) / 2 - 60;
  const centerX = width / 2;
  const centerY = height / 2;
  
  return (
    <div style={{ 
      width, 
      height, 
      position: 'relative',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <svg width={width - 40} height={height - 40}>
        {/* 파이 차트 배경 원 */}
        <circle
          cx={centerX - 20}
          cy={centerY - 20}
          r={radius + 10}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
          opacity="0.5"
        />
        
        {/* 파이 차트 그림자 효과 */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
          </filter>
        </defs>
        
        {languageStats.slice(0, 6).map((lang, index) => {
          const percentage = (lang.weight / totalWeight) * 100;
          const angle = (percentage / 100) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX - 20 + radius * Math.cos(startAngle);
          const y1 = centerY - 20 + radius * Math.sin(startAngle);
          const x2 = centerX - 20 + radius * Math.cos(endAngle);
          const y2 = centerY - 20 + radius * Math.sin(endAngle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${centerX - 20} ${centerY - 20}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          // 파이 조각 중앙에 텍스트 위치 계산
          const textAngle = startAngle + angle / 2;
          const textRadius = radius * 0.6; // 중앙에서 60% 거리
          const textX = centerX - 20 + textRadius * Math.cos(textAngle);
          const textY = centerY - 20 + textRadius * Math.sin(textAngle);
          
          return (
            <g key={lang.language}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="2"
                filter="url(#shadow)"
                style={{ 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.9';
                  e.target.style.transform = 'scale(1.08)';
                  e.target.style.filter = 'url(#shadow) brightness(1.15) drop-shadow(0 10px 20px rgba(0,0,0,0.25))';
                  e.target.style.strokeWidth = '4';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.filter = 'url(#shadow)';
                  e.target.style.strokeWidth = '2';
                }}
              />
              {/* 파이 조각 안에 언어 이름 */}
              <text
                x={textX}
                y={textY}
                fontSize="12"
                fontWeight="700"
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  pointerEvents: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {lang.language}
              </text>
            </g>
          );
        })}
        
        {/* 중앙 텍스트 */}
        <circle
          cx={centerX - 20}
          cy={centerY - 20}
          r="40"
          fill="white"
          opacity="0.95"
          filter="url(#shadow)"
        />
        <text
          x={centerX - 20}
          y={centerY - 25}
          fontSize="14"
          fontWeight="700"
          fill="#374151"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {languageStats.length} languages
        </text>
        <text
          x={centerX - 20}
          y={centerY - 10}
          fontSize="11"
          fontWeight="600"
          fill="#6b7280"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Languages
        </text>
      </svg>
    </div>
  );
};

// Legacy visualization retained for backwards-compatible imports.
// eslint-disable-next-line no-unused-vars
const LanguagePieChart = ({ languages, width = 300, height = 300 }) => {
  if (!languages || languages.length === 0) return null;
  
  const languageCount = languages.reduce((acc, lang) => {
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});
  
  const total = Object.values(languageCount).reduce((a, b) => a + b, 0);
  const colors = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
    '#ef4444', '#ec4899', '#84cc16', '#f97316', '#06b6d4'
  ];
  
  let currentAngle = 0;
  const radius = Math.min(width, height) / 2 - 80;
  const centerX = width / 2;
  const centerY = height / 2;
  
  return (
    <div style={{ 
      width, 
      height, 
      position: 'relative',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      <svg width={width - 40} height={height - 40}>
        {/* 파이 차트 배경 원 */}
        <circle
          cx={centerX - 20}
          cy={centerY - 20}
          r={radius + 15}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3"
          opacity="0.5"
        />
        
        {/* 파이 차트 그림자 효과 */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
          </filter>
        </defs>
        
        {Object.entries(languageCount).map(([lang, count], index) => {
          const percentage = (count / total) * 100;
          const angle = (percentage / 100) * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          return (
            <g key={lang}>
              <path
                d={pathData}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth="3"
                filter="url(#shadow)"
                style={{ transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.target.style.opacity = '0.8';
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.filter = 'url(#shadow) brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.opacity = '1';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.filter = 'url(#shadow)';
                }}
              />
            </g>
          );
        })}
        
        {/* 범례 */}
        <g transform={`translate(0, ${height - 80})`}>
          {Object.entries(languageCount).map(([lang, count], index) => (
            <g key={`legend-${lang}`} transform={`translate(${index * 90}, 0)`}>
              <rect
                x="0"
                y="0"
                width="16"
                height="16"
                fill={colors[index % colors.length]}
                rx="4"
                stroke="white"
                strokeWidth="1"
                filter="url(#shadow)"
              />
              <text
                x="24"
                y="12"
                fontSize="13"
                fontWeight="600"
                fill="#374151"
                textAnchor="start"
              >
                {lang}
              </text>
            </g>
          ))}
        </g>
        
        {/* 중앙 텍스트 */}
        <circle
          cx={centerX - 20}
          cy={centerY - 20}
          r="40"
          fill="white"
          opacity="0.9"
          filter="url(#shadow)"
        />
        <text
          x={centerX - 20}
          y={centerY - 25}
          fontSize="14"
          fontWeight="700"
          fill="#374151"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {total} languages
        </text>
        <text
          x={centerX - 20}
          y={centerY - 10}
          fontSize="12"
          fontWeight="600"
          fill="#6b7280"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Languages
        </text>
      </svg>
    </div>
  );
};

// 커밋 히트맵
const CommitHeatmap = ({ commits = [], width = 400, height = 120 }) => {
  // 52주 x 7일 히트맵. Never generate synthetic activity for missing data.
  const weeks = 52;
  const days = 7;
  const cells = [];
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < days; day++) {
      const commitCount = Number(commits[week * days + day] || 0);
      cells.push({ week, day, count: commitCount });
    }
  }
  // width가 '100%' 등 문자열일 경우, 실제로는 부모 div의 width에 맞춰 SVG가 그려지도록 함
  // SVG는 width 100%, height 140px로 고정, cellSize는 반응형
  const svgHeight = 140;
  const svgWidth = 520; // 최대 기준, 실제로는 100%로 렌더링
  const cellSize = Math.min(svgWidth / weeks, (svgHeight - 20) / days);
  const colors = ['#e0e7ef', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'];
  return (
    <div style={{ width: '100%', minWidth: 0, padding: '32px', boxShadow: '0 6px 32px rgba(80,120,255,0.10)', borderRadius: '24px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)' }}>
      <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: '800', color: '#1e40af', letterSpacing: '-1px', textAlign: 'center' }}>
        Activity history
      </h3>
      {!commits.length && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px' }}>
          Connect the original activity data to show a history here.
        </div>
      )}
      <div style={{ width: '100%', overflowX: 'auto', display: commits.length ? 'block' : 'none' }}>
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block', margin: '0 auto', background: 'none' }}>
          {cells.map(({ week, day, count }) => {
            const color = colors[Math.min(count, colors.length - 1)];
            return (
              <rect
                key={`${week}-${day}`}
                x={week * cellSize + 8}
                y={day * cellSize + 8}
                width={cellSize - 2}
                height={cellSize - 2}
                fill={color}
                rx={4}
                style={{ transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)' }}
              />
            );
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', fontSize: '13px', color: '#64748b', gap: '16px' }}>
        <span style={{ fontWeight: 600, color: '#64748b' }}>Less</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {colors.map((color, idx) => (
            <div key={color} style={{ width: '18px', height: '18px', backgroundColor: color, borderRadius: '4px', boxShadow: '0 1px 4px #64748b11', border: idx === 0 ? '1px solid #e0e7ef' : 'none' }}></div>
          ))}
        </div>
        <span style={{ fontWeight: 600, color: '#1d4ed8' }}>More</span>
      </div>
    </div>
  );
};

// 채용 AI의 판단 근거와 한계를 한눈에 보여주는 신뢰성 패널
const EvidenceTrustPanel = ({ candidate, analysisText }) => {
  let structured = null;
  try {
    const parsed = JSON.parse(analysisText || '{}');
    if (parsed && (Array.isArray(parsed.dimensions) || parsed.version === 'portfolio-evidence-v1')) structured = parsed;
  } catch (_) {
    // 기존 자연어 분석 결과도 계속 지원한다.
  }

  const evidenceCount = structured
    ? structured.version === 'portfolio-evidence-v1'
      ? (structured.evidence || []).filter(item => item.source === 'portfolio').length
      : structured.dimensions.reduce((count, dimension) => count + (dimension.evidence || []).length, 0)
    : null;
  const signals = [
    candidate?.githubProfileUrl || candidate?.profileUrl ? 'Original GitHub profile' : null,
    getCandidateLanguages(candidate || {}).length ? 'Language data' : null,
    candidate?.analysisScore !== undefined || candidate?.aiAnalysis?.analysisScore !== undefined ? 'AI analysis score' : null,
    structured?.version === 'portfolio-evidence-v1' ? 'Submission evidence verification' : structured ? 'Evidence and confidence by dimension' : 'Natural-language analysis'
  ].filter(Boolean);

  return (
    <section style={{
      background: 'linear-gradient(135deg, #0f2923 0%, #173e32 100%)',
      color: '#ecfdf5',
      borderRadius: '18px',
      padding: '22px 24px',
      boxShadow: '0 12px 28px rgba(15, 41, 35, 0.18)'
    }} aria-label="AI evidence and limitations">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: 800, letterSpacing: '0.08em' }}>ZOOP TRUST LAYER</div>
          <h3 style={{ margin: '6px 0 6px', fontSize: '1.25rem', color: '#fff' }}>AI decisions you can explain</h3>
          <p style={{ margin: 0, color: '#c7f9df', lineHeight: 1.6, fontSize: '0.9rem' }}>
            Scores never stand alone. We separate observed signals from information that still needs verification.
          </p>
        </div>
        <span style={{ background: '#34d399', color: '#063b2b', borderRadius: '999px', padding: '7px 12px', fontWeight: 800, fontSize: '0.78rem' }}>
          {structured ? `${evidenceCount} verified evidence item(s)` : 'Evidence review needed'}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
        {signals.map(signal => (
          <span key={signal} style={{ border: '1px solid rgba(167, 243, 208, 0.35)', background: 'rgba(167, 243, 208, 0.1)', borderRadius: '999px', padding: '6px 10px', fontSize: '0.78rem', color: '#d1fae5' }}>
            ✓ {signal}
          </span>
        ))}
      </div>
      {structured?.gaps?.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(253, 230, 138, 0.35)', borderRadius: '12px', color: '#fef3c7', fontSize: '0.84rem' }}>
          <strong>Information that still needs verification:</strong> {structured.gaps.join(', ')}
        </div>
      )}
      {structured?.version === 'portfolio-evidence-v1' && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <span style={{ color: '#d1fae5' }}>Source coverage {structured.evidence_coverage ?? 0}%</span>
          <span style={{ color: '#d1fae5' }}>Confidence {Math.round((structured.confidence ?? 0) * 100)}%</span>
          {(structured.evidence || []).filter(item => item.source === 'portfolio').slice(0, 2).map((item, index) => (
            <span key={index} style={{ width: '100%', color: '#bbf7d0', fontStyle: 'italic' }}>“{item.quote}”</span>
          ))}
        </div>
      )}
      {structured?.score_calibration && (
        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(219, 234, 254, 0.12)', border: '1px solid rgba(191, 219, 254, 0.35)', borderRadius: '10px', fontSize: '0.8rem', color: '#dbeafe' }}>
          <strong>Evidence-calibrated score</strong>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '5px' }}>
            <span>AI draft {structured.score_calibration.model_score ?? '-'}</span>
            <span>Verified {structured.score_calibration.calibrated_score ?? structured.score ?? '-'} points</span>
          </div>
          {structured.score_calibration.uncalibrated_dimensions?.length > 0 && (
            <div style={{ marginTop: '5px', color: '#fde68a' }}>
              Dimensions without grounded evidence: {structured.score_calibration.uncalibrated_dimensions.join(', ')}
            </div>
          )}
        </div>
      )}
      <div style={{ marginTop: '14px', color: '#a7f3d0', fontSize: '0.78rem' }}>
        AI supports decisions; the hiring owner should review source material and interview evidence before deciding.
      </div>
    </section>
  );
};

// 강점/약점 하이라이트 컴포넌트
const StrengthsWeaknesses = ({ analysisText }) => {
  const strengths = extractStrengths(analysisText);
  const weaknesses = extractWeaknesses(analysisText);
  
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
        Strengths & improvement areas
      </h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 강점 */}
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
            Strengths
          </h4>
          <div style={{ 
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #a7f3d0'
          }}>
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div key={index} style={{ 
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {strength}
                </div>
              ))
            ) : (
              <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                No strength data is available.
              </div>
            )}
          </div>
        </div>
        
        {/* 약점 */}
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%' }}></div>
            Improvement areas
          </h4>
          <div style={{ 
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #fca5a5'
          }}>
            {weaknesses.length > 0 ? (
              weaknesses.map((weakness, index) => (
                <div key={index} style={{ 
                  marginBottom: '8px',
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.5 21H20.5A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" stroke="#ef4444" strokeWidth="2"/>
                    <path d="M12 9V13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17H12.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {weakness}
                </div>
              ))
            ) : (
              <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                No improvement data is available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 적합 직무 표시 컴포넌트
const SuitableJobsVisual = ({ jobs, width = 300, height = 120 }) => {
  if (!jobs || jobs.length === 0) return null;
  
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
  
  return (
    <div style={{ width: '100%', minWidth: 0, height, padding: '32px', boxShadow: '0 6px 32px rgba(80,100,200,0.08)', borderRadius: '24px', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: '800', color: '#22223b', letterSpacing: '-1px' }}>
        Suitable roles
      </h3>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '22px',
        width: '100%'
      }}>
        {jobs.map((job, index) => (
          <div
            key={job}
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${colors[index % colors.length]}10 100%)`,
              border: `1.5px solid ${colors[index % colors.length]}55`,
              borderRadius: '20px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              minWidth: 0,
              boxSizing: 'border-box',
              boxShadow: '0 2px 12px rgba(80,100,200,0.07)',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              overflowWrap: 'break-word',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.025)';
              e.target.style.boxShadow = `0 8px 24px ${colors[index % colors.length]}22`;
              e.target.style.borderColor = colors[index % colors.length];
              e.target.style.background = `linear-gradient(135deg, ${colors[index % colors.length]}11 0%, #fff 100%)`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 2px 12px rgba(80,100,200,0.07)';
              e.target.style.borderColor = `${colors[index % colors.length]}55`;
              e.target.style.background = `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${colors[index % colors.length]}10 100%)`;
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: colors[index % colors.length],
              borderRadius: '50%',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: '18px',
              fontWeight: '800',
              color: colors[index % colors.length],
              minWidth: 0,
              overflowWrap: 'break-word',
              letterSpacing: '-0.5px',
              display: 'inline',
              background: 'none',
              whiteSpace: 'normal'
            }}>
              {job}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 성장 가능성 표시 컴포넌트
const GrowthPotentialVisual = ({ growthText, width = 400, height = 150 }) => {
  if (!growthText) return null;
  
  return (
    <div style={{ width: '100%', minWidth: 0, height, padding: '16px', boxShadow: '0 6px 32px rgba(255,180,60,0.10)', borderRadius: '24px', background: 'linear-gradient(135deg, #fffbe9 0%, #fef6e4 100%)' }}>
      <h3 style={{ margin: '0 0 32px 0', fontSize: '22px', fontWeight: '800', color: '#b45309', letterSpacing: '-1px', textAlign: 'center' }}>
        Growth potential
      </h3>
      <div style={{
        background: 'linear-gradient(135deg, #fff7d6 0%, #ffe6b7 100%)',
        borderRadius: '24px',
        padding: '40px',
        border: '1.5px solid #fbbf24',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 6px 32px rgba(255,180,60,0.13)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '180px'
      }}>
        <div style={{
          position: 'absolute',
          top: 'auto',
          bottom: '24px',
          right: '40px',
          width: '72px',
          height: '72px',
          background: '#fde68a',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 16px #fbbf2433',
          opacity: 0.18,
          zIndex: 0
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17L9 11L13 15L21 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 7V12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{
          margin: 0,
          fontSize: '18px',
          lineHeight: '1.8',
          color: '#b45309',
          fontWeight: '800',
          padding: '0 0 0 8px',
          letterSpacing: '-0.2px',
          minWidth: 0,
          overflowWrap: 'break-word',
          textAlign: 'center',
          zIndex: 1,
          position: 'relative'
        }}>
          {growthText}
        </p>
      </div>
    </div>
  );
};

export { parseCandidateAnalysis, getAnalysisPayload };

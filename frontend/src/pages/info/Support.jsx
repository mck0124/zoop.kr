import React, { useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import './CustomerServicePage.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; // Added Link import
import { apiUrl } from '../../api/config';

const ICON_SIZE = 32;

// 고객센터 캐릭터 SVG (헤드셋을 쓴 상담원)
function SupportMascot({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" style={{margin: '0 auto 18px auto', display: 'block'}}>
      <circle cx="48" cy="48" r="46" fill="#f6fff3" stroke="#22c55e" strokeWidth="4" />
      <ellipse cx="48" cy="54" rx="26" ry="24" fill="#fff" />
      <ellipse cx="48" cy="44" rx="20" ry="18" fill="#a3e635" />
      <ellipse cx="48" cy="44" rx="14" ry="12" fill="#fff" />
      <ellipse cx="48" cy="48" rx="10" ry="9" fill="#f6fff3" />
      <ellipse cx="40" cy="46" rx="2.2" ry="2.5" fill="#222" />
      <ellipse cx="56" cy="46" rx="2.2" ry="2.5" fill="#222" />
      <path d="M44 54c1.5 2 7.5 2 9 0" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 54c-2 0-4-2-4-4v-4c0-12 10-22 24-22s24 10 24 22v4c0 2-2 4-4 4" stroke="#22c55e" strokeWidth="2.5" fill="none" />
      <rect x="32" y="64" width="32" height="10" rx="5" fill="#a3e635" />
      <rect x="38" y="68" width="20" height="4" rx="2" fill="#fff" />
      <path d="M20 54v6a8 8 0 008 8h2" stroke="#22c55e" strokeWidth="2" fill="none" />
      <path d="M76 54v6a8 8 0 01-8 8h-2" stroke="#22c55e" strokeWidth="2" fill="none" />
      <rect x="18" y="60" width="8" height="6" rx="3" fill="#a3e635" />
      <rect x="70" y="60" width="8" height="6" rx="3" fill="#a3e635" />
    </svg>
  );
}

// LLM이 자동 생성한 FAQ 예시 (카테고리 포함)
const autoFaqExamples = [
  { q: '회원가입은 어떻게 하나요?', category: '회원가입/로그인' },
  { q: '비밀번호를 잊어버렸어요.', category: '회원가입/로그인' },
  { q: '지원 현황은 어디서 확인하나요?', category: '서비스 이용' },
  { q: '이력서/포트폴리오 등록 방법이 궁금해요.', category: '서비스 이용' },
  { q: '면접 일정은 어떻게 확인하나요?', category: '서비스 이용' }
];

const supportCategories = [
  '회원가입/로그인',
  '이력서 작성',
  '채용 공고 지원',
  '면접 일정/결과',
  '포인트/마일리지',
  '기업회원 문의',
];

// FAQ 데이터 (FaqPage.jsx와 동일하게 복사)
const faqData = [
  { category: '회원가입/로그인', question: '회원가입은 어떻게 하나요?(개인/기업별 안내)', answer: "홈페이지 우측 상단의 '회원가입' 버튼을 클릭 후, 이메일 또는 소셜 계정으로 가입할 수 있습니다." },
  { category: '회원가입/로그인', question: '비밀번호를 잊어버렸어요.', answer: "로그인 페이지에서 '비밀번호 찾기'를 클릭하면, 이메일을 통해 재설정할 수 있습니다." },
  { category: '서비스 이용', question: '[개인회원] 프로필/이력서는 어떻게 작성하나요?', answer: '고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '서비스 이용', question: '[개인회원] 구인 공고는 어떻게 확인하고 지원하나요?', answer: '고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '서비스 이용', question: '[기업회원] 채용 공고는 어떻게 등록하나요?', answer: '고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '서비스 이용', question: '[기업회원] 후보자 정보는 어떻게 검색하고 열람하나요?', answer: '고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '서비스 이용', question: '서비스 이용 중 오류가 발생했어요.', answer: '고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '기술관련', question: '어떤 브라우저를 지원하나요?', answer: '앱이나 웹사이트 오류 발생 시, 고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '기술관련', question: '모바일 환경에서 이용 가능한가요?', answer: '앱이나 웹사이트 오류 발생 시, 고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' },
  { category: '기술관련', question: '사이트 속도가 느려요.', answer: '앱이나 웹사이트 오류 발생 시, 고객센터에 문의해 주세요. 오류 화면을 캡처하면 더 빠른 처리가 가능합니다.' }
];

function Support() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedCategory, setMatchedCategory] = useState(null);
  const inputRef = useRef();

  // Keep search suggestions local. AI credentials must never be shipped to a browser.
  async function fetchSuggestions(prompt) {
    const normalized = prompt.trim().toLowerCase();
    return faqData
      .filter(item => `${item.question} ${item.category}`.toLowerCase().includes(normalized))
      .slice(0, 3)
      .map(item => item.question);
  }

  async function fetchOpenAISearch(query) {
    setAiLoading(true);
    setAiError("");
    setAiAnswer("");
    try {
      const res = await fetch(apiUrl('/api/ai/support'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 답변 요청 실패');
      setAiAnswer(data.answer || "관련 도움말을 찾지 못했습니다.");
    } catch (e) {
      setAiError("AI 답변 요청에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  // 자동완성 핸들러
  async function handleInputChange(e) {
    const value = e.target.value;
    setSearchValue(value);
    setAiAnswer("");
    setAiError("");
    // 카테고리 매칭
    const cat = getCategoryBySearch(value);
    setMatchedCategory(cat);
    if (value.trim().length > 0) {
      setShowSuggestions(true);
      const suggs = await fetchSuggestions(value);
      setSuggestions(suggs);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }

  function handleSuggestionClick(sugg) {
    setSearchValue(sugg);
    setShowSuggestions(false);
    inputRef.current && inputRef.current.blur();
  }

  function handleAISearch() {
    if (!searchValue.trim()) return;
    fetchOpenAISearch(searchValue);
  }

  const categoryKeywordMap = [
    { category: '회원가입/로그인', keywords: ['회원', '로그인', '가입'] },
    { category: '이력서 작성', keywords: ['이력서', '프로필'] },
    { category: '채용 공고 지원', keywords: ['지원', '공고'] },
    { category: '면접 일정/결과', keywords: ['면접'] },
    { category: '포인트/마일리지', keywords: ['포인트', '마일리지'] },
    { category: '기업회원 문의', keywords: ['기업'] },
  ];

  const getCategoryBySearch = (value) => {
    const lower = value.toLowerCase();
    for (const map of categoryKeywordMap) {
      if (map.keywords.some(k => lower.includes(k.toLowerCase()))) {
        return map.category;
      }
    }
    return null;
  };

  const goToFaq = (e) => {
    e.preventDefault();
    const matchedCategory = getCategoryBySearch(searchValue);
    if (matchedCategory) {
      navigate('/faq?category=' + encodeURIComponent(matchedCategory));
    } else {
      navigate('/faq');
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAISearch();
    }
  };
  const goToFaqCategory = (category) => {
    navigate(`/faq?category=${encodeURIComponent(category)}`);
  };
  return (
    <>
      <SEO
        title="고객센터 - ZOOP | 1:1 문의 및 지원"
        description="ZOOP 고객센터에서 1:1 문의, 기술 지원, 서비스 이용 안내를 받으세요. 빠르고 정확한 답변으로 도움을 드립니다."
        keywords="ZOOP 고객센터, 1:1문의, 기술지원, 서비스이용안내, 문의하기, 도움말"
        image="/support-banner.jpg"
        url="https://zoop.com/support"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "ZOOP 고객센터",
          "description": "ZOOP 서비스 이용에 대한 문의 및 지원",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@zoop.com",
            "availableLanguage": "Korean"
          }
        }}
      />
      <Navbar />
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(90deg, #22c55e 60%, #a3e635 100%)',
        color: '#fff',
        padding: '3.5rem 0 2.5rem 0',
        textAlign: 'center',
        borderRadius: '0 0 2.5rem 2.5rem',
        boxShadow: '0 4px 24px rgba(34,197,94,0.10)',
        marginBottom: 40
      }}>
        <SupportMascot size={96} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-1.5px' }}>고객센터</h1>
        <p style={{ fontSize: '1.18rem', margin: '1.2rem 0 0.5rem 0', fontWeight: 500, opacity: 0.97 }}>
          ZOOP 서비스 이용 중 궁금한 점이나 불편한 사항이 있으신가요?<br />
          언제든 문의해주시면 빠르게 답변드리겠습니다.
        </p>
        {/* 검색창 및 추천 태그 (사용자 요청 UI) */}
        <div className="search-section mt-4">
          <div className="search-bar-container">
            <div className="search-input-wrap">
              <input
                ref={inputRef}
                type="search"
                placeholder="🔍 궁금한 점을 검색해보세요."
                className="search-input"
                value={searchValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                aria-label="고객센터 질문 검색"
              />
              <button type="button" onClick={handleAISearch} disabled={!searchValue.trim() || aiLoading}>
                {aiLoading ? '답변 중…' : 'AI에게 질문'}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="support-suggestions" role="listbox" aria-label="추천 질문">
                {suggestions.map(suggestion => (
                  <button key={suggestion} type="button" onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="suggestion-tags">
            <Link className="tag-button" to="/faq#signup-login">비밀번호를 잊어버렸어요.</Link>
            <Link className="tag-button" to="/faq#signup-login">회원가입은 어떻게 하나요?</Link>
            <Link className="tag-button" to="/faq#service-usage">프로필은 어떻게 작성하나요?</Link>
            <Link className="tag-button" to="/faq#service-usage">채용공고는 어떻게 등록하나요?</Link>
            <br />
            <Link className="tag-button" to="/faq#service-usage">구인공고는 어떻게 확인하고 지원하나요?</Link>
            <Link className="tag-button" to="/faq#service-usage">후보자 정보 검색</Link>
          </div>
        </div>
        {/* AI 답변 결과 */}
        {aiAnswer && (
          <div style={{ marginTop: 18, background: '#e6fcf6', border: '1.5px solid #30C59B', borderRadius: 14, padding: '22px 20px', color: '#17806d', fontWeight: 500, fontSize: '1.13rem', boxShadow: '0 2px 12px rgba(48,197,155,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#30C59B', marginBottom: 8, fontSize: '1.08rem' }}>AI 답변</div>
            {aiAnswer}
          </div>
        )}
        {/* FAQ 예상 답변 항상 노출 */}
        {matchedCategory && (
          <div style={{ marginTop: 18, background: '#fff', border: '1.5px solid #30C59B', borderRadius: 14, padding: '22px 20px', color: '#17806d', fontWeight: 500, fontSize: '1.13rem', boxShadow: '0 2px 12px rgba(48,197,155,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#30C59B', marginBottom: 8, fontSize: '1.08rem' }}>예상 답변 ({matchedCategory})</div>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
              {faqData.filter(faq => faq.category === matchedCategory).map((item, idx) => (
                <li key={idx} style={{ marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, color: '#30C59B', marginBottom: 4, fontSize: '1.05rem' }}>Q. {item.question}</div>
                  <div style={{ color: '#17806d', fontWeight: 500, fontSize: '1.01rem', background: '#f6fff3', borderRadius: 8, padding: '10px 14px', marginTop: 2 }}>{item.answer}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {aiError && !matchedCategory && <div style={{ color: '#30C59B', marginTop: 12, fontWeight: 600 }}>{aiError}</div>}
        {/* LLM FAQ 예시 버튼 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 18 }}>
          {autoFaqExamples.map((ex, i) => (
            <button
              key={ex.q}
              onClick={() => goToFaqCategory(ex.category)}
              style={{
                background: 'linear-gradient(90deg, #a3e635 60%, #22c55e 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 18,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.01rem',
                cursor: 'pointer',
                boxShadow: '0 1.5px 8px rgba(163,230,53,0.08)',
                transition: 'background 0.18s',
                marginBottom: 2
              }}
            >
              {ex.q}
            </button>
          ))}
        </div>
        {/* 고객센터 카테고리 버튼 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 10 }}>
          {supportCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => goToFaqCategory(cat)}
              style={{
                background: '#fff',
                color: '#22c55e',
                border: '1.5px solid #a3e635',
                borderRadius: 18,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '1.01rem',
                cursor: 'pointer',
                boxShadow: '0 1.5px 8px rgba(163,230,53,0.08)',
                transition: 'background 0.18s',
                marginBottom: 2
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 32,
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 12px 60px 12px',
      }}>
        {/* Contact Card */}
        <div style={{
          flex: '1 1 320px',
          minWidth: 320,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 2px 16px rgba(34,197,94,0.07)',
          padding: '2.2rem 2rem 2rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/mail.svg" alt="이메일" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>이메일</span>
          </div>
          <a href="mailto:support@zoop.com" style={{ color: '#16a34a', fontWeight: 600, fontSize: '1.08rem', textDecoration: 'none' }}>support@zoop.com</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/bell.svg" alt="전화" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>전화</span>
          </div>
          <a href="tel:1588-1234" style={{ color: '#16a34a', fontWeight: 600, fontSize: '1.08rem', textDecoration: 'none' }}>1588-1234</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/sparkle.svg" alt="운영시간" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>운영 시간</span>
          </div>
          <span style={{ color: '#64748b', fontWeight: 500, fontSize: '1.05rem' }}>평일 10:00 ~ 18:00<br />(점심시간 12:30 ~ 13:30)</span>
        </div>
        {/* FAQ Card */}
        <div style={{
          flex: '1 1 320px',
          minWidth: 320,
          background: '#f6fff3',
          borderRadius: 18,
          boxShadow: '0 2px 16px rgba(34,197,94,0.05)',
          padding: '2.2rem 2rem 2rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/message-circle.svg" alt="FAQ" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>자주 묻는 질문</span>
          </div>
          <div style={{ color: '#4d7c0f', fontWeight: 500, fontSize: '1.05rem', marginBottom: 8 }}>
            궁금한 점은 FAQ 페이지도 참고해 주세요.
          </div>
          <a href="/faq" target="_blank" rel="noopener noreferrer" style={{
            background: 'linear-gradient(90deg, #22c55e 70%, #a3e635 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.08rem',
            borderRadius: 8,
            padding: '0.7rem 1.5rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(34,197,94,0.08)',
            marginTop: 6,
            display: 'inline-block',
            transition: 'background 0.2s',
          }}>FAQ 바로가기</a>
        </div>
      </div>
    </>
  );
}

export default Support;

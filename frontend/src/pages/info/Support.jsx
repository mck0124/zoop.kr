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
  { q: 'How do I create an account?', category: 'Account and login' },
  { q: 'I forgot my password.', category: 'Account and login' },
  { q: 'Where can I check my applications?', category: 'Using ZOOP' },
  { q: 'How do I add a resume or portfolio?', category: 'Using ZOOP' },
  { q: 'Where can I find my interview schedule?', category: 'Using ZOOP' }
];

const supportCategories = [
  'Account and login',
  'Resume and portfolio',
  'Job applications',
  'Interview schedule and results',
  'Credits and rewards',
  'Company accounts',
];

// FAQ 데이터 (FaqPage.jsx와 동일하게 복사)
const faqData = [
  { category: 'Account and login', question: 'How do I create an account?', answer: "Select Sign up in the top navigation and choose candidate or company. You can use email or a supported social account." },
  { category: 'Account and login', question: 'I forgot my password.', answer: "Select Forgot password on the login page and follow the email verification steps." },
  { category: 'Using ZOOP', question: 'How do I build my profile or resume?', answer: 'Open your candidate dashboard and complete the profile, resume, and portfolio sections. Contact support if a file fails to upload.' },
  { category: 'Using ZOOP', question: 'How do I find and apply to jobs?', answer: 'Browse Careers, open a job posting, review the role details, and submit the requested portfolio or application materials.' },
  { category: 'Using ZOOP', question: 'How do I create a job post?', answer: 'Company users can create a post from the company dashboard, then define the role, evidence to look for, and interview flow.' },
  { category: 'Using ZOOP', question: 'How do I search candidates?', answer: 'Company users can review candidates from the dashboard and open the evidence ledger for each analysis.' },
  { category: 'Using ZOOP', question: 'Something went wrong.', answer: 'Try refreshing the page first. If the issue continues, include the page, time, and a screenshot when contacting support.' },
  { category: 'Technical support', question: 'Which browsers are supported?', answer: 'Use a current version of Chrome, Safari, Firefox, or Edge. If an issue persists, contact support with your browser version.' },
  { category: 'Technical support', question: 'Can I use ZOOP on mobile?', answer: 'Most candidate flows are mobile-friendly. For video interviews and uploads, a desktop browser may provide a more reliable experience.' },
  { category: 'Technical support', question: 'The site feels slow.', answer: 'Check your connection, refresh the page, and retry the action. Send support the affected page and approximate time if it continues.' }
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
      if (!res.ok) throw new Error(data.error || 'The AI support request failed.');
      setAiAnswer(data.answer || "No matching help article was found.");
    } catch (e) {
      setAiError("We could not get an AI support answer.");
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
    { category: 'Account and login', keywords: ['account', 'login', 'sign up', 'password'] },
    { category: 'Resume and portfolio', keywords: ['resume', 'profile', 'portfolio'] },
    { category: 'Job applications', keywords: ['apply', 'application', 'job'] },
    { category: 'Interview schedule and results', keywords: ['interview'] },
    { category: 'Credits and rewards', keywords: ['credit', 'reward'] },
    { category: 'Company accounts', keywords: ['company', 'employer'] },
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
        title="Support - ZOOP | Help and AI guidance"
        description="Get guide-grounded support, product help, and AI answers from ZOOP."
        keywords="ZOOP support, AI help, recruiting platform help, product guide"
        image="/support-banner.jpg"
        url="https://zoop.com/support"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "ZOOP support",
          "description": "Help and support for using ZOOP",
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-1.5px' }}>Support</h1>
        <p style={{ fontSize: '1.18rem', margin: '1.2rem 0 0.5rem 0', fontWeight: 500, opacity: 0.97 }}>
          Have a question or something not working as expected?<br />
          Search the guide or ask ZOOP AI for a grounded answer.
        </p>
        {/* 검색창 및 추천 태그 (사용자 요청 UI) */}
        <div className="search-section mt-4">
          <div className="search-bar-container">
            <div className="search-input-wrap">
              <input
                ref={inputRef}
                type="search"
                placeholder="🔍 Search for a question or feature"
                className="search-input"
                value={searchValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                aria-label="Search support questions"
              />
              <button type="button" onClick={handleAISearch} disabled={!searchValue.trim() || aiLoading}>
                {aiLoading ? 'Thinking…' : 'Ask ZOOP AI'}
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="support-suggestions" role="listbox" aria-label="Suggested questions">
                {suggestions.map(suggestion => (
                  <button key={suggestion} type="button" onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="suggestion-tags">
            <Link className="tag-button" to="/faq#signup-login">I forgot my password</Link>
            <Link className="tag-button" to="/faq#signup-login">How do I create an account?</Link>
            <Link className="tag-button" to="/faq#service-usage">How do I build my profile?</Link>
            <Link className="tag-button" to="/faq#service-usage">How do I create a job post?</Link>
            <br />
            <Link className="tag-button" to="/faq#service-usage">How do I find and apply to jobs?</Link>
            <Link className="tag-button" to="/faq#service-usage">How do I search candidates?</Link>
          </div>
        </div>
        {/* AI 답변 결과 */}
        {aiAnswer && (
          <div style={{ marginTop: 18, background: '#e6fcf6', border: '1.5px solid #30C59B', borderRadius: 14, padding: '22px 20px', color: '#17806d', fontWeight: 500, fontSize: '1.13rem', boxShadow: '0 2px 12px rgba(48,197,155,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#30C59B', marginBottom: 8, fontSize: '1.08rem' }}>AI answer</div>
            {aiAnswer}
          </div>
        )}
        {/* FAQ 예상 답변 항상 노출 */}
        {matchedCategory && (
          <div style={{ marginTop: 18, background: '#fff', border: '1.5px solid #30C59B', borderRadius: 14, padding: '22px 20px', color: '#17806d', fontWeight: 500, fontSize: '1.13rem', boxShadow: '0 2px 12px rgba(48,197,155,0.08)' }}>
            <div style={{ fontWeight: 700, color: '#30C59B', marginBottom: 8, fontSize: '1.08rem' }}>Suggested answer ({matchedCategory})</div>
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
            <img src="/icons/mail.svg" alt="Email" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>Email</span>
          </div>
          <a href="mailto:support@zoop.com" style={{ color: '#16a34a', fontWeight: 600, fontSize: '1.08rem', textDecoration: 'none' }}>support@zoop.com</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/bell.svg" alt="Phone" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>Phone</span>
          </div>
          <a href="tel:1588-1234" style={{ color: '#16a34a', fontWeight: 600, fontSize: '1.08rem', textDecoration: 'none' }}>1588-1234</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/icons/sparkle.svg" alt="Hours" width={ICON_SIZE} height={ICON_SIZE} />
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>Hours</span>
          </div>
          <span style={{ color: '#64748b', fontWeight: 500, fontSize: '1.05rem' }}>Weekdays 10:00–18:00<br />(Lunch 12:30–13:30)</span>
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
            <span style={{ fontWeight: 700, fontSize: '1.18rem', color: '#22c55e' }}>Frequently asked questions</span>
          </div>
          <div style={{ color: '#4d7c0f', fontWeight: 500, fontSize: '1.05rem', marginBottom: 8 }}>
            Browse the FAQ page for common questions.
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
          }}>Open FAQ</a>
        </div>
      </div>
    </>
  );
}

export default Support;

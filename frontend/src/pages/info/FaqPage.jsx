import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import './FaqPage.css';
import '../info/Notice.css';
import { useLocation } from 'react-router-dom';

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

// 사이드바 카테고리 목록
const categories = [
  '회원가입/로그인',
  '서비스 이용',
  '기술관련',
  '기타',
  '1:1문의/문의하기',
  '이용약관 및 개인정보처리방침',
  '사용가이드/매뉴얼',
  '연락처 정보'
];

// SVG 아이콘 컴포넌트 (단색, 미니멀)
// Q: HelpCircleIcon (Feather style)
const QIcon = ({size=22, color='#30C59B'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3" />
    <circle cx="12" cy="17" r="1" />
  </svg>
);
// A: CheckCircleIcon (Feather style)
const ArrowIcon = ({open, size=22, color='#888', activeColor='#22c55e'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.35s'}}>
    <path d="M7 10l5 5 5-5" stroke={open ? activeColor : color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function FaqPage() {
  const location = useLocation();
  const [openIdx, setOpenIdx] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('회원가입/로그인');

  // 쿼리 파라미터로 카테고리 선택
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    if (cat && categories.includes(cat)) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('회원가입/로그인');
    }
  }, [location.search]);

  // 선택된 카테고리의 FAQ만 필터링
  const filteredFaqData = faqData.filter(faq => faq.category === selectedCategory);

  return (
    <>
      <SEO
        title="자주 묻는 질문 - ZOOP | FAQ"
        description="ZOOP 서비스 이용에 대한 자주 묻는 질문과 답변을 확인하세요. AI 채용, GitHub 분석, 면접 프로세스 등에 대한 상세한 정보를 제공합니다."
        keywords="ZOOP FAQ, 자주묻는질문, AI채용질문, GitHub분석질문, AI면접질문, 채용플랫폼질문, IT채용질문"
        image="/faq-banner.jpg"
        url="https://zoop.com/faq"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqData.map((faq, index) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        }}
      />
      <Navbar />
      <section
        className="notice-hero"
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          padding: '6rem 0 4rem 0',
          boxSizing: 'border-box',
        }}
      >
        <div className="notice-hero-content">
          <h1 className="notice-hero-title">자주 묻는 질문</h1>
          <p className="notice-hero-desc">
            서비스 이용 중 궁금한 점을 빠르게 확인하세요.<br />
            회원가입, 이용 방법, 기술 지원 등 자주 묻는 질문을 안내합니다.
          </p>
        </div>
      </section>
      {/* Set body background for FAQ page only */}
      <style>{`
        @keyframes faqCardFadeIn {
          to { opacity: 1; }
        }
        body { background: #fff !important; }
      `}</style>
      <div style={{
        maxWidth: 1040,
        margin: '0 auto',
        background: '#fff',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
          padding: '2rem',
          maxWidth: 900,
          margin: '56px auto 3rem auto',
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          gap: 48,
          justifyContent: 'center',
          alignItems: 'flex-start',
          opacity: 0,
          animation: 'faqCardFadeIn 0.7s ease 0.1s forwards'
        }}>
          {/* 카테고리 */}
          <aside style={{
            minWidth: 180,
            maxWidth: 220,
            flex: '0 0 200px',
            marginBottom: 24,
            padding: '40px 0 40px 0',
            background: 'none',
            borderRight: '1px solid #e6fcf6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}>
            <div style={{
              fontWeight: 700,
              color: '#30C59B',
              marginBottom: 16,
              fontSize: '1.1rem'
            }}>카테고리</div>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: selectedCategory === category ? 'linear-gradient(90deg, #30C59B 60%, #22c55e 100%)' : 'none',
                  color: selectedCategory === category ? '#fff' : '#444',
                  fontWeight: selectedCategory === category ? 700 : 500,
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 6,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.18s, color 0.18s',
                  outline: 'none',
                  ...(selectedCategory !== category ? {
                    ':hover': {
                      background: '#e6fcf6',
                      color: '#30C59B',
                      fontWeight: 700
                    }
                  } : {})
                }}
                onMouseOver={e => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.background = '#e6fcf6';
                    e.currentTarget.style.color = '#30C59B';
                    e.currentTarget.style.fontWeight = 700;
                  }
                }}
                onMouseOut={e => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#444';
                    e.currentTarget.style.fontWeight = 500;
                  }
                }}
              >
                {category}
              </button>
            ))}
          </aside>
          {/* FAQ 리스트 */}
          <main style={{ flex: 1, minWidth: 0, maxWidth: 700, padding: '40px 0' }}>
            {filteredFaqData.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {filteredFaqData.map((item, idx) => (
                  <li key={item.question} style={{
                    background: openIdx === idx ? '#f6fff9' : '#fff',
                    border: openIdx === idx ? '1.5px solid #30C59B' : '1px solid #f1f3f5',
                    borderRadius: 16,
                    boxShadow: openIdx === idx ? '0 4px 18px rgba(48,197,155,0.10)' : '0 1.5px 8px rgba(48,197,155,0.06)',
                    marginBottom: 28,
                    transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                    overflow: 'hidden'
                  }}>
                    <button
                      onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1.3rem 1.5rem',
                        fontSize: '1.13rem',
                        fontWeight: 700,
                        color: '#30C59B',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <QIcon size={22} color="#30C59B" />
                      <span style={{ marginLeft: 12, flex: 1, color: '#222', fontWeight: 600 }}>{item.question}</span>
                      <ArrowIcon open={openIdx === idx} size={22} color="#888" activeColor="#22c55e" />
                    </button>
                    <div className={`notice-card-detail${openIdx === idx ? ' open' : ''}`} style={{padding: openIdx === idx ? '1.5rem' : 0, marginTop: openIdx === idx ? '1rem' : 0}}>
                      {openIdx === idx && (
                        <div className="notice-card-summary" style={{color: '#17806d', fontWeight: 500}}>{item.answer}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{
                color: '#888',
                fontSize: '1.13rem',
                background: '#f6fff9',
                borderRadius: 16,
                padding: '2.2rem 2.2rem',
                marginTop: 32,
                border: '1.5px solid #30C59B',
                textAlign: 'center'
              }}>
                해당 카테고리의 FAQ가 없습니다.
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default FaqPage;

import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Index.css';
import Navbar from '../components/Navbar';

const RADAR_WIDTH = 1100;
const RADAR_HEIGHT = 480;
const CENTER_X = RADAR_WIDTH / 2;
const CENTER_Y = RADAR_HEIGHT / 2;
const MIN_R = 90;
const MAX_R = 580;
const WAVE_COUNT = 3;
const WAVE_SPEED = 1.07;
const WAVE_DISTANCE = 160;
const WAVE_STROKE = 2.1;

export default function Index() {
  const navigate = useNavigate();
  const [mountTime] = useState(() => performance.now());

  // 메인페이지 로드 시 Navbar 스타일 강제 재적용
  useEffect(() => {
    const navbar = document.querySelector('.zoop-navbar');
    if (navbar) {
      // Navbar 스타일 강제 재적용
      navbar.style.display = 'grid';
      navbar.style.gridTemplateColumns = '1fr auto 1fr';
      navbar.style.alignItems = 'center';
      navbar.style.padding = '0.8rem 2.5rem';
      navbar.style.position = 'absolute';
      navbar.style.top = '0';
      navbar.style.left = '0';
      navbar.style.width = '100%';
      navbar.style.backgroundColor = 'transparent';
      navbar.style.boxShadow = 'none';
      navbar.style.zIndex = '10';
      navbar.style.transition = 'background-color 0.3s ease, backdrop-filter 0.3s ease';
    }

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.style.display = 'flex';
      navLinks.style.justifyContent = 'center';
      navLinks.style.gap = '1.5rem';
      navLinks.style.justifySelf = 'center';
    }
  }, []);

  // subtitle fade-in - 확실한 스크롤 효과
  useEffect(() => {
    const checkVisibility = () => {
      const subtitle = document.getElementById('subtitle-section');
      if (!subtitle) return;
      
      const rect = subtitle.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // 화면의 80% 지점에 도달하면 나타남
      const triggerPoint = windowHeight * 0.8;
      const isVisible = rect.top < triggerPoint;
      
      if (isVisible) {
        subtitle.classList.add('visible');
      }
    };

    // 스크롤 이벤트 리스너
    const handleScroll = () => {
      requestAnimationFrame(checkVisibility);
    };

    // 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 초기 체크 (페이지 로드 후)
    const initialCheck = () => {
      setTimeout(checkVisibility, 100);
      setTimeout(checkVisibility, 500);
      setTimeout(checkVisibility, 1000);
    };
    
    initialCheck();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 항상 일정 간격/개수로 파장 렌더링
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let rafId;
    function animate() {
      const elapsed = (performance.now() - mountTime) / (1000 / 60);
      setTick(elapsed);
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [mountTime]);

  // 파장은 무한히 증가하는 mainR 기준, 끊김 없음!
  const waveCycle = MAX_R - MIN_R + WAVE_DISTANCE;
  const mainR = MIN_R + ((tick * WAVE_SPEED) % waveCycle);
  const waves = [];
  for (let i = 0; i < WAVE_COUNT; i++) {
    let r = mainR - i * WAVE_DISTANCE;
    if (r < MIN_R) r += waveCycle;
    waves.push({ r, idx: i });
  }

  // 사선 회전 angle
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let rafId;
    function animateLine() {
      setAngle(a => a + 0.002);
      rafId = requestAnimationFrame(animateLine);
    }
    rafId = requestAnimationFrame(animateLine);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const getOpacity = r => {
    const t = (r - MIN_R) / (MAX_R - MIN_R);
    return t >= 1 ? 0 : Math.max(0.01, 0.32 * (1 - t));
  };

  return (
    <div className="zoop-index-wrapper">
      <Navbar />

      {/* 메인 배너 */}
      <section className="hero-section">
        <img src="/zoop_main_banner.png" alt="banner" className="hero-image" />
        <div className="hero-text">
          <h1>채용의 모든 것<br />ZOOP에서 쉽고 간편하게</h1>
          <button
            className="cta-button"
            onClick={() => navigate('/auth/applicant/signup')}
          >
            👉 3초만에 가입하고 인재 찾기
          </button>
        </div>
      </section>

      {/* 서브타이틀 */}
      <section className="subtitle-section" id="subtitle-section">
        <div className="subtitle-content">
          <p>내 커리어를 한 번에 업데이트하고 한 곳에서 관리하세요.</p>
          <p>이제껏 경험 못 했던 쉽고 편리한 스카우트 서비스,</p>
          <p>줍과 함께라면 당신의 미래가 새로워질 거예요.</p>
        </div>
      </section>

      {/* 존재이유/파장 레이더 */}
      <section className="reason-section-custom">
        <div className="radar-canvas-container" style={{ overflow: 'hidden' }}>
          <svg
            width={RADAR_WIDTH}
            height={RADAR_HEIGHT}
            viewBox={`0 0 ${RADAR_WIDTH} ${RADAR_HEIGHT}`}
            style={{ position: "absolute", left: 0, top: 0 }}
          >
            {/* 파장: 무한 증식, 끊김 없음 */}
            {waves.map((w) => (
              <circle
                key={w.idx + '-' + w.r}
                cx={CENTER_X}
                cy={CENTER_Y}
                r={w.r}
                fill="none"
                stroke="#28e3ab"
                strokeWidth={WAVE_STROKE}
                style={{
                  opacity: getOpacity(w.r),
                  filter: "blur(0.9px)",
                  transition: "opacity 0.25s, r 0.16s"
                }}
              />
            ))}
            {/* 빛줄기(사다리꼴) */}
            <defs>
              <linearGradient id="beam-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <g style={{ transformOrigin: `${CENTER_X}px ${CENTER_Y}px`, transform: `rotate(${angle * 180 / Math.PI}deg)` }}>
              <polygon
                points={`
                  ${CENTER_X - 12},${CENTER_Y}
                  ${CENTER_X + 580 * Math.cos(0.0 - 0.023)},${CENTER_Y + 350 * Math.sin(0.0 - 0.023)}
                  ${CENTER_X + 580 * Math.cos(0.0 + 0.023)},${CENTER_Y + 350 * Math.sin(0.0 + 0.023)}
                  ${CENTER_X + 12},${CENTER_Y}
                `}
                fill="url(#beam-gradient)"
                style={{
                  filter: "blur(1.5px)"
                }}
              />
              {/* 회전하는 얇은 수직 레이더선 */}
              <line
                x1={CENTER_X}
                y1={CENTER_Y}
                x2={CENTER_X + 510}
                y2={CENTER_Y}
                stroke="#fff"
                strokeWidth="2"
                opacity="0.40"
                style={{ filter: "blur(0.3px)" }}
              />
            </g>
          </svg>
          {/* 중앙 컨텐츠(텍스트는 그대로 중앙, index_1만 왼쪽!) */}
          <div className="radar-center-content">
            <img
              src="/index/index_1.png"
              alt="사람"
              style={{
                width: 74,
                display: "block",
                position: "relative",
                top: "-36px",
                transform: "translateX(-250px)", 
                marginLeft: "auto",
                marginRight: "auto"
              }}
            />
            <div>
              <h2 style={{ fontSize: "2.36rem", fontWeight: 700, margin: 0 }}>
                모두를 연결하는 <span style={{ color: "#2fd7a4" }}>ZOOP</span>
              </h2>
              <div style={{ fontSize: "1.23rem", margin: "65px 0 0 0", color: "#363636" }}>
                기술과 연결되는<br />더 가까운 내일
              </div>
            </div>
          </div>
          {/* 네 귀퉁이 아이콘 (사이즈 업) */}
          <img src="/index/index_2.png" alt="mail" className="radar-icon radar-icon-topright" style={{ width: 75, height: 75 }}/>
          <img src="/index/index_3.png" alt="building" className="radar-icon radar-icon-bottomleft" style={{ width: 63, height: 63 }}/>
          <img src="/index/index_4.png" alt="zoop-card" className="radar-icon radar-icon-bottomright" style={{ width: 83, height: 83 }}/>
        </div>
      </section>

      {/* 기존 footer */}
      <footer className="footer-section">
        <div className="footer-grid">
          <div>
            <strong>서비스</strong>
            <p>공지사항</p>
            <p>자주 묻는 질문</p>
            <p>공동인증서 관리</p>
            <p>계정 일시잠금</p>
            <p>고객센터</p>
            <p>개인(신용)정보 이용·제공 내역 조회</p>
            <p>브랜드 리소스센터</p>
            <p>줍의 개인정보 보호</p>
            <p>줍유스카드</p>
          </div>
          <div>
            <strong>회사</strong>
            <p>회사 소개</p>
            <p>줍스토리</p>
            <p>줍페이먼츠</p>
            <p>줍인슈어런스</p>
            <p>줍증권</p>
            <p>줍세이프</p>
            <p>줍플레이스</p>
            <p>줍인컴</p>
            <p>채용</p>
            <p>기술 블로그</p>
            <p>블로그</p>
            <p>공고</p>
          </div>
          <div>
            <strong>문의</strong>
            <p>사업 제휴</p>
            <p>줍쇼핑 입점문의</p>
            <p>광고 문의</p>
            <p>인증 사업 문의</p>
            <p>마케팅 · PR</p>
            <p>IR</p>
          </div>
          <div>
            <strong>고객센터</strong>
            <p>전화: 1599-4905 (24시간 연중무휴)</p>
            <p>이메일(고객전용): support@zoop.im</p>
            <p>이메일(외부기관전용): safe@zoop.im</p>
            <p>민원 접수</p>
            <p>민원 접수(비즈니스 고객)</p>
          </div>
        </div>
        <div className="footer-bottom">
          <strong>(주)줍스튜디오</strong>
          <p>ZOOP AI Recruiting Platform · KOSA Capstone Prototype</p>
          <p>본 서비스는 기술 시연을 위한 프로젝트입니다.</p>
          <div className="footer-terms">
            <p><strong>서비스 이용약관</strong></p>
            <p><strong>개인정보 처리방침</strong></p>
            <p><strong>위치기반서비스 이용약관</strong></p>
            <p><strong>전자금융거래약관</strong></p>
          </div>
          <div className="footer-icons">
            <span>📘</span> <span>🐦</span> <span>📸</span> <span>🔗</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

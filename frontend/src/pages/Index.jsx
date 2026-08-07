import React, { useEffect, useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import './Index.css';
import Navbar from '../components/Navbar';
import { useLanguage } from '../context/LanguageContext';

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

const LEDGER_DEMO = {
  evidence: {
    label: '근거 원문',
    title: 'AI가 읽은 문장과 판단을 연결합니다',
    body: '“장애율을 낮추기 위해 재시도 큐와 멱등성 키를 도입했습니다.”',
    meta: 'EVID-7A31 · portfolio · 후보자 원문 확인',
  },
  gaps: {
    label: '확인할 빈틈',
    title: '모르는 것을 아는 척하지 않습니다',
    body: '실제 본인 기여도와 운영 환경의 정량적 결과는 제출물만으로 확인할 수 없습니다.',
    meta: '검토 보류 · 다음 질문으로 연결',
  },
  counterfactual: {
    label: '판단 변경 실험',
    title: '어떤 증거가 판단을 바꾸는지 보여줍니다',
    body: '대표 프로젝트의 장애 대응 로그와 본인 기여를 확인하면 예상 점수가 달라집니다.',
    meta: '검증 행동 · 결정 영수증에 기록',
  },
};

const LEDGER_DEMO_COPY = {
  en: {
    evidence: { label: 'Verified evidence', title: 'Connects the exact source to the decision', body: '“We introduced a retry queue and idempotency keys to reduce incident rates.”', meta: 'EVID-7A31 · portfolio · source verified' },
    gaps: { label: 'Open question', title: 'Does not pretend to know the unknown', body: 'Actual ownership and measurable results in production cannot be verified from the submission alone.', meta: 'Review pending · turns into a follow-up question' },
    counterfactual: { label: 'Decision experiment', title: 'Shows what evidence could change the decision', body: 'Incident response logs and the candidate’s actual contribution could change the expected score.', meta: 'Verification action · recorded in the decision receipt' },
  },
  ko: LEDGER_DEMO,
  zh: {
    evidence: { label: '已验证证据', title: '把原文与判断连接起来', body: '“为了降低故障率，我们引入了重试队列和幂等键。”', meta: 'EVID-7A31 · 作品集 · 原文已验证' },
    gaps: { label: '待确认信息', title: '不对未知信息假装确定', body: '仅凭提交材料无法确认候选人的实际贡献和生产环境中的量化结果。', meta: '等待复核 · 转化为下一道问题' },
    counterfactual: { label: '判断变化实验', title: '展示哪些证据可以改变判断', body: '确认代表项目的故障处理记录和本人贡献后，预期分数可能发生变化。', meta: '验证行动 · 记录在决策凭证中' },
  },
};

const HOME_COPY = {
  en: {
    hero: <>Everything hiring needs<br />made simple with ZOOP</>,
    applicant: 'Start as a candidate', company: 'Find talent as a company',
    subtitle: ['Keep your career up to date in one place.', 'Discover a simpler, more convenient way to get scouted.', 'With ZOOP, your next step starts here.'],
    evidenceTitle: <>Not hiring chosen by AI,<br /><em>hiring you can verify.</em></>,
    evidenceBody: <>We separate evidence found in portfolios and public technical activity,<br />then suggest the next question that could change the decision.</>,
    evidenceAria: 'How ZOOP AI makes decisions',
    evidenceCards: [
      ['01', 'Mine evidence from the source', 'Find the exact lines in submissions and public repositories, then preserve their evidence ID and fingerprint.', 'Source verified'],
      ['02', 'Break decisions into dimensions', 'Separate skills, problem solving, and project relevance while calculating both scores and uncertainty.', 'Evidence coverage'],
      ['03', 'Connect to the next verification', 'Suggest missing signals and interview questions that could change the decision.', 'Verification action'],
    ],
    footnote: 'Job-irrelevant personal attributes are excluded · Every AI decision can be saved as a decision receipt',
    demoTitle: <>We show the <em>decision process</em>,<br />not just a score.</>,
    demoBody: 'This sample explains the feature. It does not evaluate a real candidate; it shows how ZOOP handles evidence and uncertainty together.',
    demoAria: 'Evidence Ledger sample', sample: 'Sample decision', verified: 'Raised after verification', review: 'Review recommended', revert: 'Revert to before verification', simulate: 'Simulate verification',
    centerTitle: <>Connecting everyone with <span>ZOOP</span></>, centerBody: <>A closer tomorrow,<br />connected by technology</>,
    footer: { service: 'Service', notice: 'Notices', faq: 'FAQ', support: 'Support', report: 'Report an issue', company: 'Company', about: 'About us', careers: 'Careers', login: 'Log in', applicantSignup: 'Candidate sign up', companySignup: 'Company sign up', contact: 'Contact', general: 'General inquiries', partnership: 'Partnerships', help: 'Help center', center: 'Customer support', phone: 'Phone: +82 1599-4905 (24/7)', customerEmail: 'Customer email: support@zoop.im', externalEmail: 'External agency email: safe@zoop.im', civil: 'Submit a complaint', businessCivil: 'Business complaint', terms: 'Terms of service', privacy: 'Privacy policy', prototype: 'This service is a project for demonstrating technology.' }
  },
  ko: {
    hero: <>채용의 모든 것<br />ZOOP에서 쉽고 간편하게</>, applicant: '구직자로 시작하기', company: '기업으로 인재 찾기',
    subtitle: ['내 커리어를 한 번에 업데이트하고 한 곳에서 관리하세요.', '이제껏 경험 못 했던 쉽고 편리한 스카우트 서비스,', '줍과 함께라면 당신의 미래가 새로워질 거예요.'],
    evidenceTitle: <>AI가 고르는 채용이 아니라,<br /><em>검증할 수 있는 채용</em>을 만듭니다.</>, evidenceBody: <>포트폴리오와 공개 기술 활동에서 확인된 근거만 분리해 보여주고,<br />판단을 바꿀 수 있는 다음 질문까지 제안합니다.</>, evidenceAria: 'ZOOP AI 판단 흐름', evidenceCards: [['01', '원문에서 근거 채굴', '제출물·공개 저장소의 실제 문장을 찾아 근거 ID와 원문 지문을 남깁니다.', '원문 확인'], ['02', '판단을 차원별로 분해', '기술·문제 해결·프로젝트 관련성을 나누고, 점수와 불확실성을 함께 계산합니다.', '근거 커버리지'], ['03', '다음 검증까지 연결', '판단을 바꿀 수 있는 미확인 신호와 면접 질문을 자동으로 제안합니다.', '검증 행동 제안']], footnote: '직무와 무관한 개인정보는 평가에서 제외합니다 · 모든 AI 판단은 저장 가능한 결정 영수증으로 남습니다', demoTitle: <>점수 하나가 아니라,<br /><em>판단의 과정</em>을 보여드립니다.</>, demoBody: '아래는 기능을 설명하기 위한 샘플입니다. 실제 후보자를 평가하지 않으며, ZOOP의 AI가 어떻게 근거와 불확실성을 함께 다루는지 보여줍니다.', demoAria: 'Evidence Ledger 샘플 보기', sample: '샘플 판단', verified: '검증 후 상향', review: '검토 권장', revert: '검증 전 상태로 되돌리기', simulate: '검증 완료를 시뮬레이션하기', centerTitle: <>모두를 연결하는 <span>ZOOP</span></>, centerBody: <>기술과 연결되는<br />더 가까운 내일</>, footer: { service: '서비스', notice: '공지사항', faq: '자주 묻는 질문', support: '고객센터', report: '서비스 신고', company: '회사', about: '회사 소개', careers: '채용', login: '로그인', applicantSignup: '구직자 회원가입', companySignup: '기업 회원가입', contact: '문의', general: '일반 문의', partnership: '사업 제휴', help: '도움말 보기', center: '고객센터', phone: '전화: 1599-4905 (24시간 연중무휴)', customerEmail: '이메일(고객전용): support@zoop.im', externalEmail: '이메일(외부기관전용): safe@zoop.im', civil: '민원 접수', businessCivil: '민원 접수(비즈니스 고객)', terms: '서비스 이용약관', privacy: '개인정보 처리방침', prototype: '본 서비스는 기술 시연을 위한 프로젝트입니다.' }
  },
  zh: {
    hero: <>招聘所需的一切<br />ZOOP 让它变得简单</>, applicant: '以候选人身份开始', company: '以企业身份寻找人才', subtitle: ['在一个地方更新并管理你的职业经历。', '体验更简单、更便捷的人才推荐服务。', '与 ZOOP 一起，开启你的下一步。'], evidenceTitle: <>不是由 AI 直接决定招聘，<br /><em>而是让招聘可以被验证。</em></>, evidenceBody: <>我们只展示从作品集和公开技术活动中确认的证据，<br />并提出可能改变判断的下一个问题。</>, evidenceAria: 'ZOOP AI 判断流程', evidenceCards: [['01', '从原文中提取证据', '找到提交材料和公开仓库中的原文，并保留证据 ID 与指纹。', '原文已验证'], ['02', '拆解判断维度', '分别分析技能、解决问题和项目相关性，同时计算分数与不确定性。', '证据覆盖率'], ['03', '连接下一步验证', '自动提出可能改变判断的未确认信号和面试问题。', '验证行动']], footnote: '排除与岗位无关的个人信息 · 每个 AI 判断都可以保存为决策凭证', demoTitle: <>我们展示的不是一个分数，<br /><em>而是完整的判断过程。</em></>, demoBody: '以下是功能示例，不会评估真实候选人，只展示 ZOOP 如何同时处理证据与不确定性。', demoAria: 'Evidence Ledger 示例', sample: '示例判断', verified: '验证后上调', review: '建议复核', revert: '恢复验证前状态', simulate: '模拟完成验证', centerTitle: <>连接每一个人的 <span>ZOOP</span></>, centerBody: <>由技术连接的<br />更近的明天</>, footer: { service: '服务', notice: '公告', faq: '常见问题', support: '客户支持', report: '报告问题', company: '公司', about: '关于我们', careers: '招聘', login: '登录', applicantSignup: '候选人注册', companySignup: '企业注册', contact: '联系', general: '一般咨询', partnership: '商务合作', help: '帮助中心', center: '客户支持', phone: '电话：+82 1599-4905（全天候）', customerEmail: '客户邮箱：support@zoop.im', externalEmail: '机构邮箱：safe@zoop.im', civil: '提交投诉', businessCivil: '商务客户投诉', terms: '服务条款', privacy: '隐私政策', prototype: '本服务是用于技术演示的项目。' }
  }
};

export default function Index() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = HOME_COPY[language] || HOME_COPY.en;
  const ledgerDemo = LEDGER_DEMO_COPY[language] || LEDGER_DEMO_COPY.en;
  const [demoView, setDemoView] = useState('evidence');
  const [demoValidated, setDemoValidated] = useState(false);

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

  // 한 번의 프레임 루프에서 두 애니메이션 상태를 함께 갱신한다.
  // 매 프레임마다 React를 다시 그리지 않도록 30fps로 제한하고,
  // 사용자가 모션 감소를 요청한 경우 애니메이션을 생략한다.
  const [tick, setTick] = useState(0);
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let animationFrame;
    let lastPaint = 0;
    const animate = (timestamp) => {
      if (timestamp - lastPaint >= 1000 / 30) {
        setTick(timestamp / (1000 / 60));
        setAngle(timestamp * 0.00012);
        lastPaint = timestamp;
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // 파장은 무한히 증가하는 mainR 기준으로 계산한다.
  const waveCycle = MAX_R - MIN_R + WAVE_DISTANCE;
  const mainR = MIN_R + ((tick * WAVE_SPEED) % waveCycle);
  const waves = [];
  for (let i = 0; i < WAVE_COUNT; i++) {
    let r = mainR - i * WAVE_DISTANCE;
    if (r < MIN_R) r += waveCycle;
    waves.push({ r, idx: i });
  }

  const getOpacity = r => {
    const t = (r - MIN_R) / (MAX_R - MIN_R);
    return t >= 1 ? 0 : Math.max(0.01, 0.32 * (1 - t));
  };

  return (
    <div className="zoop-index-wrapper">
      <Navbar />

      {/* 메인 배너 */}
      <section className="hero-section">
        <img src="/zoop_main_banner.png" alt="ZOOP AI recruiting platform" className="hero-image" />
        <div className="hero-text">
          <h1>{copy.hero}</h1>
          <div className="cta-actions" aria-label="Choose your account type">
            <button className="cta-button" onClick={() => navigate('/auth/applicant/signup')}>
              {copy.applicant} <span aria-hidden="true">→</span>
            </button>
            <button className="cta-button secondary" onClick={() => navigate('/auth/company/signup/process')}>
              {copy.company} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* 서브타이틀 */}
      <section className="subtitle-section" id="subtitle-section">
        <div className="subtitle-content">
          {copy.subtitle.map(line => <p key={line}>{line}</p>)}
        </div>
      </section>

      {/* ZOOP의 핵심 AI 차별점: 점수보다 근거를 먼저 보여주는 채용 원장 */}
      <section className="evidence-intro-section" aria-labelledby="evidence-intro-title">
        <div className="evidence-intro-heading">
          <span className="evidence-kicker">ZOOP EVIDENCE LEDGER</span>
          <h2 id="evidence-intro-title">{copy.evidenceTitle}</h2>
          <p>{copy.evidenceBody}</p>
        </div>
        <div className="evidence-flow" role="list" aria-label={copy.evidenceAria}>
          {copy.evidenceCards.map(([number, title, body, chip], index) => <React.Fragment key={number}>
          <article className="evidence-flow-card" role="listitem">
            <span className="evidence-flow-number">{number}</span>
            <div className="evidence-flow-icon" aria-hidden="true">{index === 0 ? '⌁' : index === 1 ? '◌' : '↗'}</div>
            <h3>{title}</h3><p>{body}</p>
            <span className={`evidence-chip ${index === 0 ? 'verified' : index === 2 ? 'action' : 'neutral'}`}>{chip}</span>
          </article>
          {index < copy.evidenceCards.length - 1 && <div className="evidence-flow-arrow" aria-hidden="true">→</div>}
          </React.Fragment>)}
        </div>
        <div className="evidence-intro-footnote">
          <span aria-hidden="true">✦</span> {copy.footnote}
        </div>
      </section>

      {/* 로그인 없이도 핵심 AI 차별점을 체험하는 공개 데모 */}
      <section className="ledger-demo-section" aria-labelledby="ledger-demo-title">
        <div className="ledger-demo-heading">
          <span className="evidence-kicker">TRY THE LEDGER</span>
          <h2 id="ledger-demo-title">{copy.demoTitle}</h2>
          <p>{copy.demoBody}</p>
        </div>
        <div className="ledger-demo-card">
          <div className="ledger-demo-tabs" role="tablist" aria-label={copy.demoAria}>
            {Object.entries(ledgerDemo).map(([key, item]) => (
              <button
                type="button"
                role="tab"
                aria-selected={demoView === key}
                aria-controls="ledger-demo-panel"
                id={`ledger-tab-${key}`}
                className={demoView === key ? 'active' : ''}
                key={key}
                onClick={() => setDemoView(key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="ledger-demo-panel" role="tabpanel" id="ledger-demo-panel" aria-live="polite" aria-labelledby={`ledger-tab-${demoView}`}>
            <div className="ledger-demo-score">
              <span className="ledger-demo-score-label">{copy.sample}</span>
              <strong>{demoValidated ? '82' : '72'}<small>/100</small></strong>
              <span className={demoValidated ? 'ledger-demo-status verified' : 'ledger-demo-status'}>{demoValidated ? copy.verified : copy.review}</span>
            </div>
            <div className="ledger-demo-copy">
              <span className="ledger-demo-label">{ledgerDemo[demoView].label}</span>
              <h3>{ledgerDemo[demoView].title}</h3>
              <p>{ledgerDemo[demoView].body}</p>
              <code>{ledgerDemo[demoView].meta}</code>
              {demoView === 'counterfactual' && (
                <button type="button" className="ledger-demo-action" onClick={() => setDemoValidated(value => !value)}>
                  {demoValidated ? copy.revert : copy.simulate}
                </button>
              )}
            </div>
          </div>
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
              alt=""
              aria-hidden="true"
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
                {copy.centerTitle}
              </h2>
              <div style={{ fontSize: "1.23rem", margin: "65px 0 0 0", color: "#363636" }}>
                {copy.centerBody}
              </div>
            </div>
          </div>
          {/* 네 귀퉁이 아이콘 (사이즈 업) */}
          <img src="/index/index_2.png" alt="" aria-hidden="true" className="radar-icon radar-icon-topright" style={{ width: 75, height: 75 }}/>
          <img src="/index/index_3.png" alt="" aria-hidden="true" className="radar-icon radar-icon-bottomleft" style={{ width: 63, height: 63 }}/>
          <img src="/index/index_4.png" alt="" aria-hidden="true" className="radar-icon radar-icon-bottomright" style={{ width: 83, height: 83 }}/>
        </div>
      </section>

      {/* 기존 footer */}
      <footer className="footer-section">
        <div className="footer-grid">
          <div>
            <strong>{copy.footer.service}</strong>
            <Link to="/notice">{copy.footer.notice}</Link>
            <Link to="/faq">{copy.footer.faq}</Link>
            <Link to="/support">{copy.footer.support}</Link>
            <Link to="/report">{copy.footer.report}</Link>
          </div>
          <div>
            <strong>{copy.footer.company}</strong>
            <Link to="/about">{copy.footer.about}</Link>
            <Link to="/careers">{copy.footer.careers}</Link>
            <Link to="/auth/login">{copy.footer.login}</Link>
            <Link to="/auth/applicant/signup">{copy.footer.applicantSignup}</Link>
            <Link to="/auth/company/signup/process">{copy.footer.companySignup}</Link>
          </div>
          <div>
            <strong>{copy.footer.contact}</strong>
            <a href="mailto:support@zoop.im">{copy.footer.general}</a>
            <a href="mailto:partnership@zoop.im">{copy.footer.partnership}</a>
            <Link to="/support">{copy.footer.help}</Link>
          </div>
          <div>
            <strong>{copy.footer.center}</strong>
            <p>{copy.footer.phone}</p>
            <p>{copy.footer.customerEmail}</p>
            <p>{copy.footer.externalEmail}</p>
            <p>{copy.footer.civil}</p>
            <p>{copy.footer.businessCivil}</p>
          </div>
        </div>
        <div className="footer-bottom">
          <strong>(주)줍스튜디오</strong>
          <p>ZOOP AI Recruiting Platform · KOSA Capstone Prototype</p>
            <p>{copy.footer.prototype}</p>
            <div className="footer-terms" aria-label="정책 안내">
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/privacy">{copy.footer.privacy}</Link>
          </div>
          <div className="footer-icons">
            <span>📘</span> <span>🐦</span> <span>📸</span> <span>🔗</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

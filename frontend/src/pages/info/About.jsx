import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { useNavigate } from 'react-router-dom';
import './About.css';
import { useLanguage } from '../../context/LanguageContext';

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: custom => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.3,
      duration: 0.6,
      ease: 'easeOut'
    }
  })
};

const slideVariants = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut'
    }
  }
};

const counterVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, type: 'spring', stiffness: 100 } }
};

const TEXT = {
  ko: {
    hero: "채용, 그 이상의 자동화를 만듭니다",
    slide1: "이제, 채용은 더 빠르고 간단해야 합니다",
    words: [
      { text: '연결은', isEmphasized: true },
      { text: '자동으로,', isEmphasized: false },
      { text: '제안은', isEmphasized: true },
      { text: '즉시,', isEmphasized: false },
      { text: '채용은', isEmphasized: true },
      { text: '손쉽게', isEmphasized: false }
    ],
    fillerWords: ['자동으로,', '즉시,', '손쉽게'],
    slide3: ['채용의', '새로운', '기준,', 'ZOOP에서', '시작됩니다'],
    statsTitle: "ZOOP AI가 판단하는 방식",
    stats: [
      { key: "evidence", value: "6", label: "GitHub 신호를 근거로 분석" },
      { key: "dimensions", value: "4", label: "직무 적합도 평가 차원" },
      { key: "workflow", value: "1", label: "분석에서 면접까지 연결" }
    ],
    processTitle: "채용의 모든 과정을 자동화",
    processSteps: [
      { step: "Step 1", title: "조건 입력", desc: "기업이 원하는 인재의 조건을 간단히 입력하세요. 직무, 기술, 경험 등을 자유롭게 설정 가능합니다." },
      { step: "Step 2", title: "AI 분석 & 매칭", desc: "ZOOP의 AI가 전 세계 인재 풀에서 최적의 후보자를 찾아 자동으로 연락합니다." },
      { step: "Step 3", title: "AI 면접", desc: "AI가 1차 면접을 진행해 후보자의 역량을 심층 분석하고 결과를 제공합니다." }
    ],
    testimonialTitle: "다른 채용 AI와 ZOOP이 다른 이유",
    testimonials: [
      { text: "후보자 점수만 보여주지 않고, 어떤 GitHub 신호가 판단에 사용됐는지 설명합니다.", author: "근거 기반 매칭" },
      { text: "확인하지 못한 정보는 추측으로 채우지 않고, 불확실성과 추가 검증 포인트로 남깁니다.", author: "불확실성 공개" },
      { text: "포트폴리오 분석 결과가 개인화된 면접 질문과 기업의 검증 흐름으로 이어집니다.", author: "분석에서 면접까지" }
    ],
    ctaTitle: "채용의 미래, 지금 시작하세요",
    ctaDesc: "ZOOP과 함께라면 기업의 채용이 더 빠르고, 더 스마트해집니다.",
    ctaButton: "지금 시작하기"
  },
  en: {
    hero: "Beyond Automation for Recruitment",
    slide1: "Now, recruitment should be faster and simpler.",
    words: [
      { text: 'Connection', isEmphasized: true },
      { text: 'Automated,', isEmphasized: false },
      { text: 'Suggestion', isEmphasized: true },
      { text: 'Instant,', isEmphasized: false },
      { text: 'Hiring', isEmphasized: true },
      { text: 'Easy', isEmphasized: false }
    ],
    fillerWords: ['Automated,', 'Instant,', 'Easy'],
    slide3: ['Recruitment', 'Redefined,', 'Starts', 'with', 'ZOOP'],
    statsTitle: "How ZOOP AI Makes a Decision",
    stats: [
      { key: "evidence", value: "6", label: "GitHub evidence signals" },
      { key: "dimensions", value: "4", label: "fit dimensions" },
      { key: "workflow", value: "1", label: "connected hiring workflow" }
    ],
    processTitle: "Automating Every Step of Hiring",
    processSteps: [
      { step: "Step 1", title: "Input Requirements", desc: "Easily enter your ideal candidate’s requirements. Freely set role, skills, and experience." },
      { step: "Step 2", title: "AI Analysis & Matching", desc: "ZOOP’s AI automatically contacts optimal candidates from a global talent pool." },
      { step: "Step 3", title: "AI Interview", desc: "AI conducts the first interview, thoroughly analyzing the candidate and providing results." }
    ],
    testimonialTitle: "What Makes ZOOP Different",
    testimonials: [
      { text: "ZOOP explains which GitHub signals influenced a candidate score instead of showing an opaque number.", author: "Evidence-first matching" },
      { text: "Missing evidence is surfaced as uncertainty and follow-up checks, never silently invented.", author: "Uncertainty made visible" },
      { text: "Portfolio analysis flows into personalized interview questions and recruiter verification.", author: "From analysis to interview" }
    ],
    ctaTitle: "Start the Future of Hiring Today",
    ctaDesc: "With ZOOP, your company’s recruitment is faster and smarter.",
    ctaButton: "Start Now"
  },
  zh: {
    hero: "不止于招聘自动化",
    slide1: "招聘应该更快，也更简单",
    words: [
      { text: '连接', isEmphasized: true }, { text: '自动完成，', isEmphasized: false },
      { text: '推荐', isEmphasized: true }, { text: '即时发生，', isEmphasized: false },
      { text: '招聘', isEmphasized: true }, { text: '更轻松', isEmphasized: false }
    ],
    fillerWords: ['自动完成，', '即时发生，', '更轻松'],
    slide3: ['招聘的', '新标准，', '从', 'ZOOP', '开始'],
    statsTitle: "ZOOP AI 如何做出判断",
    stats: [
      { key: "evidence", value: "6", label: "GitHub 证据信号" },
      { key: "dimensions", value: "4", label: "岗位匹配维度" },
      { key: "workflow", value: "1", label: "从分析到面试的流程" }
    ],
    processTitle: "自动化招聘的每一步",
    processSteps: [
      { step: "Step 1", title: "输入条件", desc: "轻松输入理想候选人的条件，自由设置岗位、技能和经验。" },
      { step: "Step 2", title: "AI 分析与匹配", desc: "ZOOP AI 从全球人才池中找到合适候选人并自动联系。" },
      { step: "Step 3", title: "AI 面试", desc: "AI 完成第一轮面试，深入分析能力并提供结果。" }
    ],
    testimonialTitle: "ZOOP 与其他招聘 AI 的不同",
    testimonials: [
      { text: "ZOOP 不只展示分数，还会解释哪些 GitHub 信号影响了判断。", author: "以证据为先的匹配" },
      { text: "无法确认的信息会被标记为不确定性，而不是被悄悄猜测。", author: "透明的不确定性" },
      { text: "作品集分析会转化为个性化面试问题和招聘方的验证流程。", author: "从分析到面试" }
    ],
    ctaTitle: "现在开启招聘的未来",
    ctaDesc: "与 ZOOP 一起，让企业招聘更快、更智能。",
    ctaButton: "立即开始"
  }
};

export default function About() {
  const navigate = useNavigate();

  const { language: lang, setLanguage: setLang } = useLanguage();

  const slideRef1 = useRef(null);
  const slideRef2 = useRef(null);
  const slideRef3 = useRef(null);
  const statsRef = useRef(null);
  const processRef = useRef(null);
  const testimonialRef = useRef(null);
  const ctaRef = useRef(null);

  const slideInView1 = useInView(slideRef1, { margin: '-40% 0px -40% 0px' });
  const slideInView2 = useInView(slideRef2, { margin: '-40% 0px -40% 0px' });
  const slideInView3 = useInView(slideRef3, { margin: '-40% 0px -40% 0px' });
  const statsInView = useInView(statsRef, { margin: '-20% 0px -20% 0px' });
  const processInView = useInView(processRef, { margin: '-20% 0px -20% 0px' });
  const testimonialInView = useInView(testimonialRef, { margin: '-20% 0px -20% 0px' });
  const ctaInView = useInView(ctaRef, { margin: '-20% 0px -20% 0px' });

  const words = TEXT[lang].words;
  const fillerWords = TEXT[lang].fillerWords;
  const [planeX, setPlaneX] = useState(0);

  useEffect(() => {
    if (!slideInView2) return;
    const controls = animate(0, 105, {
      duration: 1.5,
      onUpdate: latest => setPlaneX(latest),
      ease: 'easeInOut'
    });
    return () => controls.stop();
  }, [slideInView2]);

  const revealThresholds = [15, 45, 80];

  return (
    <>
      {/* SEO 컴포넌트 */}
      <SEO
        title="회사 소개 - ZOOP | AI 기반 채용 플랫폼"
        description="ZOOP는 AI 기술을 활용하여 개발자와 기업을 연결하는 혁신적인 채용 플랫폼입니다. GitHub 기반 포트폴리오 분석과 AI 면접으로 정확한 매칭을 제공합니다."
        keywords="ZOOP, 회사소개, AI채용, 개발자채용, GitHub분석, AI면접, 채용플랫폼, IT채용"
        image="/about_banner.jpg"
        url="https://zoop.com/about"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ZOOP",
          "url": "https://zoop.com",
          "logo": "https://zoop.com/logo_zoop.png",
          "description": "AI 기반 채용 플랫폼",
          "foundingDate": "2024",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "서울",
            "addressRegion": "강남구",
            "addressCountry": "KR"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@zoop.com"
          },
          "sameAs": [
            "https://github.com/zoop",
            "https://linkedin.com/company/zoop"
          ]
        }}
      />

      <Navbar onLangChange={setLang} hideAuth={true} />
      <section className="hero-banner" style={{
        position: 'relative'
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        >
          <source src="/info/about_video.mp4" type="video/mp4" />
        </video>
        <div className="overlay">
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {TEXT[lang].hero}
          </motion.h1>
        </div>
        <div className="particles-auto" />
      </section>

      <section className="scroll-unlock-section">
        <motion.div className="scroll-slide" ref={slideRef1} variants={slideVariants} initial="hidden" animate={slideInView1 ? 'visible' : 'hidden'}>
          <motion.h2 className="fade-text white-text" variants={slideVariants}>
            {TEXT[lang].slide1}
          </motion.h2>
        </motion.div>

        <motion.div className="scroll-slide" ref={slideRef2} initial="hidden" animate={slideInView2 ? 'visible' : 'hidden'} style={{ position: 'relative' }}>
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${planeX}%`,
              transform: 'translate(-50%, -50%) rotate(45deg)',
              zIndex: 2
            }}
          >
            <svg className="plane-effect" style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 255, 213, 0.5))' }} width="50" height="50" viewBox="0 0 24 24" fill="none">
              <path d="M2 12L22 2L12 22L8 14L2 12Z" fill="rgba(0, 255, 213, 0.9)" stroke="#00ffd5" strokeWidth="2" />
            </svg>
          </motion.div>

          <motion.h2 className="fade-text white-text" style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'nowrap',
            position: 'relative',
            zIndex: 1,
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0) ${planeX}%, white ${planeX + 10}%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {words.map((word, i) => {
              const isFiller = fillerWords.includes(word.text);
              const thresholdIndex = fillerWords.indexOf(word.text);
              const shouldShow = isFiller ? planeX > revealThresholds[thresholdIndex] : true;
              const customDelay = word.isEmphasized ? Math.floor(i / 2) : i / 2;

              return (
                <motion.span
                  key={i}
                  initial="hidden"
                  animate={slideInView2 && shouldShow ? 'visible' : 'hidden'}
                  variants={word.isEmphasized ? wordVariants : {
                    hidden: { opacity: 0, y: 30, scale: 0.8 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.4, type: 'spring', stiffness: 300 }
                    }
                  }}
                  custom={customDelay}
                  style={{ display: 'inline-block' }}
                  className={word.isEmphasized ? 'highlighted-word' : ''}
                >
                  {word.text}
                </motion.span>
              );
            })}
          </motion.h2>
        </motion.div>

        <motion.div className="scroll-slide last" ref={slideRef3}>
          <motion.h2
            className="fade-text white-text"
            initial={{ opacity: 0, y: 40 }}
            animate={slideInView3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              fontWeight: 700,
              fontSize: '2.8rem',
              background: 'linear-gradient(90deg, #ffffff, #00ffd5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 50px rgba(0, 255, 213, 0.6)',
              display: 'flex',
              gap: '0.6rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              textAlign: 'center'
            }}
          >
            {TEXT[lang].slide3.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={slideInView3 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.2 + 0.2, duration: 0.6, ease: 'easeOut' }}
                style={{ display: 'inline-block' }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>
        </motion.div>
      </section>

      <section className="stats-section" ref={statsRef}>
        <div className="stats-overlay">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {TEXT[lang].statsTitle}
          </motion.h2>
          <div className="stats-grid">
            <motion.div variants={counterVariants} initial="hidden" animate={statsInView ? 'visible' : 'hidden'}>
              <h3>{TEXT[lang].stats[0].value}</h3>
              <p>{TEXT[lang].stats[0].label}</p>
            </motion.div>
            <motion.div variants={counterVariants} initial="hidden" animate={statsInView ? 'visible' : 'hidden'}>
              <h3>{TEXT[lang].stats[1].value}</h3>
              <p>{TEXT[lang].stats[1].label}</p>
            </motion.div>
            <motion.div variants={counterVariants} initial="hidden" animate={statsInView ? 'visible' : 'hidden'}>
              <h3>{TEXT[lang].stats[2].value}</h3>
              <p>{TEXT[lang].stats[2].label}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="process-section" ref={processRef}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={processInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {TEXT[lang].processTitle}
        </motion.h2>
        <div className="process-steps">
          {TEXT[lang].processSteps.map((step, idx) => (
            <motion.div key={idx} className="process-card" variants={cardVariants} initial="hidden" animate={processInView ? 'visible' : 'hidden'}>
              <span>{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="testimonial-section" ref={testimonialRef}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={testimonialInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {TEXT[lang].testimonialTitle}
        </motion.h2>
        <div className="testimonial-carousel">
          {TEXT[lang].testimonials.map((t, idx) => (
            <motion.div key={idx} className="testimonial-card" variants={cardVariants} initial="hidden" animate={testimonialInView ? 'visible' : 'hidden'}>
              <p>{t.text}</p>
              <span>{t.author}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="cta-section" ref={ctaRef} aria-labelledby="cta-heading">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 50 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 id="cta-heading">{TEXT[lang].ctaTitle}</h2>
          <p>{TEXT[lang].ctaDesc}</p>
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,255,213,0.5)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate('/auth/applicant/signup')}
          >
            {TEXT[lang].ctaButton}
          </motion.button>
        </motion.div>
      </section>
    </>
  );
}

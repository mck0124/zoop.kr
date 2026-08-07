import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';

const POLICY_CONTENT = {
  terms: {
    title: '서비스 이용약관',
    description: 'ZOOP 서비스 이용에 필요한 기본 약관을 안내합니다.',
    sections: [
      ['제1조 목적', '이 약관은 ZOOP이 제공하는 채용 정보, 포트폴리오 분석, AI 면접 및 관련 서비스의 이용 조건과 절차를 안내합니다.'],
      ['제2조 서비스의 성격', 'ZOOP은 채용 의사결정을 돕는 정보와 분석을 제공합니다. AI 분석 결과는 참고 자료이며, 최종 채용·지원·면접 결정은 이용자가 직접 내립니다.'],
      ['제3조 이용자의 책임', '이용자는 본인이 제출하거나 조회할 권한이 있는 정보만 등록해야 하며, 타인의 개인정보·비공개 저장소·저작물을 무단으로 제출해서는 안 됩니다.'],
      ['제4조 AI 분석 안내', 'AI 분석은 입력된 자료의 범위와 품질에 따라 달라질 수 있습니다. ZOOP은 근거, 불확실성, 추가 확인이 필요한 항목을 가능한 한 함께 표시합니다.'],
      ['제5조 서비스 변경 및 문의', '서비스 기능은 품질 개선을 위해 변경될 수 있습니다. 이용약관에 대한 문의는 support@zoop.im으로 접수해 주세요.'],
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    description: 'ZOOP이 개인정보를 어떻게 수집·이용·보호하는지 안내합니다.',
    sections: [
      ['1. 수집하는 정보', '회원가입과 서비스 이용을 위해 이름, 이메일, 연락처, 로그인 정보, 지원서·이력서·포트폴리오 및 면접 답변이 수집될 수 있습니다.'],
      ['2. 이용 목적', '수집한 정보는 회원 인증, 채용공고 지원, 후보자 매칭, AI 분석 제공, 면접 진행, 알림 및 고객지원 목적으로만 이용합니다.'],
      ['3. AI 처리 원칙', 'AI는 직무 관련 기술·프로젝트·답변 근거를 중심으로 분석하며, 이름·성별·나이·사진·출신 학교 등 직무와 무관한 속성을 평가 근거로 사용하지 않도록 설계되어 있습니다.'],
      ['4. 보관 및 파기', '개인정보는 이용 목적이 달성되거나 이용자가 삭제를 요청하면 관련 법령과 서비스 운영에 필요한 범위 내에서 지체 없이 파기합니다.'],
      ['5. 이용자 권리 및 문의', '이용자는 자신의 정보 조회·수정·삭제를 요청할 수 있습니다. 개인정보 관련 문의는 safe@zoop.im으로 접수해 주세요.'],
    ],
  },
};

export default function PolicyPage() {
  const { pathname } = useLocation();
  const policy = pathname.includes('privacy') ? POLICY_CONTENT.privacy : POLICY_CONTENT.terms;

  return (
    <>
      <SEO title={`${policy.title} - ZOOP`} description={policy.description} url={`https://zoop.com/${pathname.includes('privacy') ? 'privacy' : 'terms'}`} />
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 96px', color: '#1f2937' }}>
        <Link to="/" style={{ color: '#198f70', fontWeight: 700, textDecoration: 'none' }}>← ZOOP 홈</Link>
        <header style={{ margin: '34px 0 42px' }}>
          <p style={{ margin: 0, color: '#30c59b', fontSize: 13, fontWeight: 800, letterSpacing: '0.12em' }}>ZOOP POLICY</p>
          <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.05em' }}>{policy.title}</h1>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>{policy.description}</p>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: 13 }}>시행일: 2026년 8월 7일 · 기술 시연 프로젝트 기준</p>
        </header>
        <div style={{ display: 'grid', gap: 14 }}>
          {policy.sections.map(([heading, body]) => (
            <section key={heading} style={{ padding: '24px 26px', border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 19, color: '#0f766e' }}>{heading}</h2>
              <p style={{ margin: 0, lineHeight: 1.8, color: '#475569' }}>{body}</p>
            </section>
          ))}
        </div>
        <nav aria-label="정책 페이지 이동" style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: pathname.includes('terms') ? '#0f766e' : '#64748b', fontWeight: 700 }}>서비스 이용약관</Link>
          <Link to="/privacy" style={{ color: pathname.includes('privacy') ? '#0f766e' : '#64748b', fontWeight: 700 }}>개인정보 처리방침</Link>
        </nav>
      </main>
    </>
  );
}

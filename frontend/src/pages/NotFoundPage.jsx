import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  en: { code: '404', title: 'Page not found', body: 'This page may have moved or the link may be incomplete.', action: 'Back to home' },
  ko: { code: '404', title: '페이지를 찾을 수 없습니다', body: '페이지가 이동했거나 주소가 올바르지 않을 수 있습니다.', action: '홈으로 돌아가기' },
  zh: { code: '404', title: '找不到页面', body: '页面可能已移动，或链接不完整。', action: '返回首页' },
};

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.en;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: 'linear-gradient(145deg, #f8fffc, #eefaf7)' }}>
      <section aria-labelledby="not-found-title" style={{ maxWidth: 520, width: '100%', padding: '3rem 2rem', borderRadius: 28, background: '#fff', textAlign: 'center', boxShadow: '0 24px 70px rgba(18, 130, 96, 0.12)' }}>
        <div style={{ color: '#18b88a', fontSize: '4.5rem', fontWeight: 900, letterSpacing: '-0.08em' }}>{copy.code}</div>
        <h1 id="not-found-title" style={{ margin: '0.5rem 0 0.75rem', color: '#12352c', fontSize: '1.7rem' }}>{copy.title}</h1>
        <p style={{ margin: 0, color: '#5d716b', lineHeight: 1.7 }}>{copy.body}</p>
        <button type="button" onClick={() => navigate('/')} style={{ marginTop: '1.75rem', border: 0, borderRadius: 999, padding: '0.85rem 1.4rem', background: '#18c696', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{copy.action}</button>
      </section>
    </main>
  );
}

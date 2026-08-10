import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';

const POLICY_CONTENT = {
  terms: {
    title: 'Terms of service',
    description: 'The basic terms for using ZOOP recruiting, portfolio, and interview services.',
    sections: [
      ['1. Purpose', 'These terms explain how to use ZOOP job information, portfolio analysis, AI interview, and related services.'],
      ['2. Nature of the service', 'ZOOP provides information and analysis to support hiring decisions. AI results are reference material; users make the final hiring, application, and interview decisions.'],
      ['3. User responsibilities', 'Only submit information you own or are authorized to access. Do not submit another person’s private information, private repositories, or copyrighted work without permission.'],
      ['4. AI analysis notice', 'AI analysis depends on the scope and quality of the supplied material. ZOOP aims to show evidence, uncertainty, and items that require further verification.'],
      ['5. Changes and contact', 'Features may change as the service improves. Contact support@zoop.im with questions about these terms.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    description: 'How ZOOP collects, uses, and protects personal information.',
    sections: [
      ['1. Information we collect', 'We may collect your name, email, contact details, login information, applications, resumes, portfolios, and interview answers to provide the service.'],
      ['2. How we use it', 'We use this information for authentication, job applications, candidate matching, AI analysis, interviews, notifications, and customer support.'],
      ['3. AI processing principles', 'AI focuses on job-related skills, projects, and answer evidence. It is designed to exclude names, gender, age, photos, school, and other job-irrelevant attributes from evaluation.'],
      ['4. Retention and deletion', 'We delete personal information when its purpose is fulfilled or deletion is requested, subject to applicable law and necessary service operations.'],
      ['5. Your rights and contact', 'You may request access to, correction of, or deletion of your information. Contact safe@zoop.im with privacy questions.'],
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
        <Link to="/" style={{ color: '#198f70', fontWeight: 700, textDecoration: 'none' }}>← ZOOP home</Link>
        <header style={{ margin: '34px 0 42px' }}>
          <p style={{ margin: 0, color: '#30c59b', fontSize: 13, fontWeight: 800, letterSpacing: '0.12em' }}>ZOOP POLICY</p>
          <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-0.05em' }}>{policy.title}</h1>
          <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>{policy.description}</p>
          <p style={{ margin: '12px 0 0', color: '#94a3b8', fontSize: 13 }}>Effective: August 7, 2026 · Technology demonstration project</p>
        </header>
        <div style={{ display: 'grid', gap: 14 }}>
          {policy.sections.map(([heading, body]) => (
            <section key={heading} style={{ padding: '24px 26px', border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 19, color: '#0f766e' }}>{heading}</h2>
              <p style={{ margin: 0, lineHeight: 1.8, color: '#475569' }}>{body}</p>
            </section>
          ))}
        </div>
        <nav aria-label="Policy navigation" style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: pathname.includes('terms') ? '#0f766e' : '#64748b', fontWeight: 700 }}>Terms of service</Link>
          <Link to="/privacy" style={{ color: pathname.includes('privacy') ? '#0f766e' : '#64748b', fontWeight: 700 }}>Privacy policy</Link>
        </nav>
      </main>
    </>
  );
}

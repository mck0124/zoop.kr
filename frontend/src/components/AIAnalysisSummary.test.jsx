import { render, screen } from '@testing-library/react';
import AIAnalysisSummary from './AIAnalysisSummary';
import { LanguageProvider } from '../context/LanguageContext';

const renderAnalysis = (analysis, score) => (
  <LanguageProvider>
    <AIAnalysisSummary analysis={analysis} score={score} />
  </LanguageProvider>
);

test('renders the evidence ledger with verification metadata', () => {
  const analysis = JSON.stringify({
    summary: '제출물에서 확인된 API 설계 경험입니다.',
    evidence_coverage: 100,
    confidence: 0.9,
    decision: 'strong_match',
    evidence: [{
      evidence_id: 'evidence-1234',
      claim: '실제 API 운영 경험',
      quote: '트래픽을 처리하는 API를 운영했습니다.',
      source: 'portfolio',
      verification_state: 'verified',
    }],
    audit: {
      ledger_version: 'zoop-evidence-ledger-v1',
      policy_version: 'grounded-hiring-v1',
      source_type: 'portfolio_submission',
      source_fingerprint: 'abcdef1234567890',
      evidence_count: 1,
      source_integrity: {
        status: 'pass',
        instruction_signal_count: 0,
        note: 'No known instruction-like injection pattern was detected in the analyzed source.',
      },
    },
  });

  window.localStorage.setItem('zoopLanguage', 'ko');
  render(renderAnalysis(analysis, 86));

  expect(screen.getByText('Evidence Ledger')).toBeInTheDocument();
  expect(screen.getByText('근거 충분')).toBeInTheDocument();
  expect(screen.getByText('제출물에서 확인된 API 설계 경험입니다.')).toBeInTheDocument();
  expect(screen.getByText('후보자 원문 확인')).toBeInTheDocument();
  expect(screen.getByText(/Evidence ID evidence-1234/)).toBeInTheDocument();
  expect(screen.getByText('지시문형 주입 패턴 없음')).toBeInTheDocument();
  expect(screen.getByText('근거 커버리지 100%')).toBeInTheDocument();
  window.localStorage.removeItem('zoopLanguage');
});

test('does not render invalid numeric AI metadata as NaN', () => {
  render(renderAnalysis({ summary: 'legacy result', confidence: 'unknown', evidence_coverage: 'unknown' }, 'unknown'));

  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  expect(screen.getByText('legacy result')).toBeInTheDocument();
});

test('renders the evidence that could change a hiring decision', () => {
  render(renderAnalysis({
    summary: 'Review recommended',
    counterfactuals: [{
      missing_signal: 'Actual ownership of the deployment pipeline',
      validation_action: 'Ask for the repository change and incident timeline',
      expected_score_delta: 12,
    }],
  }));

  expect(screen.getByText('What could change this decision?')).toBeInTheDocument();
  expect(screen.getByText('Actual ownership of the deployment pipeline')).toBeInTheDocument();
  expect(screen.getByText(/Potential score change: \+12/)).toBeInTheDocument();
});

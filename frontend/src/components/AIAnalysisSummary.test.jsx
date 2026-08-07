import { render, screen } from '@testing-library/react';
import AIAnalysisSummary from './AIAnalysisSummary';

test('renders the evidence ledger with verification metadata', () => {
  const analysis = JSON.stringify({
    summary: '제출물에서 확인된 API 설계 경험입니다.',
    evidence_coverage: 100,
    confidence: 0.9,
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
    },
  });

  render(<AIAnalysisSummary analysis={analysis} score={86} />);

  expect(screen.getByText('Evidence Ledger')).toBeInTheDocument();
  expect(screen.getByText('제출물에서 확인된 API 설계 경험입니다.')).toBeInTheDocument();
  expect(screen.getByText('후보자 원문 확인')).toBeInTheDocument();
  expect(screen.getByText(/근거 ID evidence-1234/)).toBeInTheDocument();
  expect(screen.getByText('근거 커버리지 100%')).toBeInTheDocument();
});

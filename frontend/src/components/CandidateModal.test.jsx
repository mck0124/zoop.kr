jest.mock('react-pdf', () => ({
  Document: () => null,
  Page: () => null,
  pdfjs: { GlobalWorkerOptions: {} }
}));

import { buildEvidenceFusion } from './CandidateModal';

const source = (score, coverage = 90, fairness = 'pass') => ({
  analysisScore: score,
  analysisData: JSON.stringify({
    evidence_coverage: coverage,
    evidence: [{ verification_state: 'grounded', claim: 'Verified source signal' }],
    fairness_guard: { status: fairness }
  })
});

test('keeps aligned independent signals eligible for a strong match', () => {
  const fusion = buildEvidenceFusion({
    githubScore: source(84),
    portfolioAnalysis: source(82),
    interviewAnalysis: source(86)
  });

  expect(fusion.consistency.status).toBe('aligned');
  expect(fusion.decision).toBe('strong_match');
});

test('routes materially conflicting sources to review instead of averaging them away', () => {
  const fusion = buildEvidenceFusion({
    githubScore: source(95),
    portfolioAnalysis: source(44),
    interviewAnalysis: source(92)
  });

  expect(fusion.consistency.status).toBe('conflicting');
  expect(fusion.decision).toBe('review');
  expect(fusion.consistency.spread).toBe(51);
});

test('routes a fairness-audited source to human review', () => {
  const fusion = buildEvidenceFusion({
    githubScore: source(90, 95, 'review'),
    portfolioAnalysis: source(90),
    interviewAnalysis: source(90)
  });

  expect(fusion.fairnessReview).toBe(true);
  expect(fusion.decision).toBe('review');
});

test('does not hide a source decision-gate downgrade inside the fused score', () => {
  const github = source(94);
  const portfolio = source(93);
  portfolio.analysisData = JSON.stringify({
    evidence_coverage: 95,
    evidence: [{ verification_state: 'grounded', claim: 'Verified portfolio signal' }],
    decision_gate: {
      status: 'downgraded',
      final_decision: 'review',
      reasons: ['Source integrity requires review']
    }
  });
  const fusion = buildEvidenceFusion({
    githubScore: github,
    portfolioAnalysis: portfolio,
    interviewAnalysis: source(95)
  });

  expect(fusion.reviewSources).toEqual(['portfolio']);
  expect(fusion.decision).toBe('review');
});

test('builds a cross-source evidence matrix for comparable dimensions', () => {
  const withDimensions = (score, name, grounded = true) => ({
    analysisScore: score,
    analysisData: JSON.stringify({
      evidence_coverage: 90,
      dimensions: [{
        name,
        score,
        max: 100,
        evidence: grounded ? [{ verification_state: 'grounded' }] : [],
      }],
    }),
  });
  const fusion = buildEvidenceFusion({
    githubScore: withDimensions(80, 'Technical skills'),
    portfolioAnalysis: withDimensions(84, '기술 스택 일치도'),
    interviewAnalysis: withDimensions(78, '전문성'),
  });

  expect(fusion.evidenceMatrix).toEqual(expect.arrayContaining([
    expect.objectContaining({ key: 'technical', groundedSignals: 3, independentSignals: 3 }),
  ]));
});

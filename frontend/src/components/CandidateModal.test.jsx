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

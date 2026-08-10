import { getAnalysisPayload, parseCandidateAnalysis } from './CandidateList';

test('normalizes interview analysis envelopes for the evidence lens', () => {
  const envelope = {
    score: 81,
    analysis: {
      version: 'interview-evidence-v1',
      score: 68,
      evidence_coverage: 80,
      confidence: 0.8,
      decision: 'review',
      categories: []
    }
  };

  expect(parseCandidateAnalysis(JSON.stringify(envelope)).root.version).toBe('interview-evidence-v1');
  expect(getAnalysisPayload({}, { analysisData: JSON.stringify(envelope) })).toMatchObject({
    score: 68,
    coverage: 80,
    confidence: 80,
    decision: 'review',
    hasStructuredEvidence: true
  });
});

test('keeps the envelope score when the nested analysis has no score', () => {
  const payload = getAnalysisPayload({}, {
    analysisData: JSON.stringify({
      score: 74,
      analysis: { version: 'interview-evidence-v1', evidence_coverage: 40 }
    })
  });

  expect(payload.score).toBe(74);
  expect(payload.coverage).toBe(40);
});

test('does not count a GitHub evidence id without an explicit grounded state', () => {
  const payload = getAnalysisPayload({}, {
    analysisData: JSON.stringify({
      version: 'github-evidence-v1',
      score: 88,
      evidence_coverage: 50,
      evidence: [{ source: 'github', evidence_id: 'EVID-1', claim: 'Needs review', verification_state: 'needs_verification' }]
    })
  });

  expect(payload.evidenceCount).toBe(0);
});

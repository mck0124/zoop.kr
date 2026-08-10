import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../api/config';
import AIAnalysisSummary, { parseAIAnalysisData } from '../../components/AIAnalysisSummary';

export default function MatchingDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    candPortfolioId,
    jobCandidateId,
    analysisId,
  } = location.state || {};

  const [portfolio, setPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const getMatchEvidence = () => {
    if (!match) return null;
    const rawReason = match.matchReason || match.matchingReason;
    if (typeof rawReason !== 'string') return rawReason?.evidence || null;
    try {
      return JSON.parse(rawReason)?.evidence || null;
    } catch (_) {
      return null;
    }
  };

  const getEvidenceValue = (key, fallback) => {
    const evidence = getMatchEvidence();
    return evidence?.[key] ?? fallback;
  };

  const analysisPayload = parseAIAnalysisData(analysis?.analysisData ?? analysis);
  const analysisScore = analysisPayload?.score ?? analysis?.analysisScore;

  useEffect(() => {
    if (!candPortfolioId || !jobCandidateId || !analysisId) {
      setError('Required information is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setPortfolio(null);
    setAnalysis(null);
    setMatch(null);
    Promise.all([
      fetch(apiUrl(`/api/portfolios/${candPortfolioId}`)).then(r => r.ok ? r.json() : null),
      fetch(apiUrl(`/api/ai-analysis-results/${analysisId}`)).then(r => r.ok ? r.json() : null),
      fetch(apiUrl(`/api/portfolio-job-matches/job-candidate/${jobCandidateId}`)).then(r => r.ok ? r.json() : null),
    ]).then(([portfolioData, analysisData, matchData]) => {
      setPortfolio(portfolioData);
      setAnalysis(analysisData);
      setMatch(matchData);
      setLoading(false);
    }).catch(e => {
      setError('We could not load the match details.');
      setLoading(false);
    });
  }, [candPortfolioId, jobCandidateId, analysisId, reloadToken]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  if (error) return (
    <div role="alert" style={{ maxWidth: 560, margin: '5rem auto', padding: '2rem', textAlign: 'center', color: '#991b1b', background: '#fff7f7', border: '1px solid #fecaca', borderRadius: 18 }}>
      <p>{error}</p>
      {candPortfolioId && jobCandidateId && analysisId && (
        <button type="button" onClick={() => setReloadToken(value => value + 1)} style={{ marginRight: 8, border: 0, borderRadius: 999, padding: '0.7rem 1.2rem', background: '#16b886', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Try again</button>
      )}
      <button type="button" onClick={() => navigate(-1)} style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '0.7rem 1.2rem', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Go back</button>
    </div>
  );
  const matchEvidence = getMatchEvidence();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(48,197,155,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
      <h1 style={{ color: '#30c59b', fontWeight: 900, fontSize: '2rem', marginBottom: 32 }}>Match details</h1>
      {/* 이력서/포트폴리오 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>1. Resume and portfolio</h2>
        {portfolio ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
            <div><b>File:</b> {portfolio.originalFileName || 'Unnamed file'}</div>
            <div><b>Submitted:</b> {portfolio.portfolioSubmissionDate ? new Date(portfolio.portfolioSubmissionDate).toLocaleString('en-US') : '-'}</div>
            <div><b>Status:</b> {portfolio.portfolioAnalysisStatus || '-'}</div>
            <div style={{ marginTop: 8 }}>
              <a href={portfolio.portfolioFilePath} target="_blank" rel="noopener noreferrer" style={{ color: '#30c59b', textDecoration: 'underline', fontWeight: 700 }}>Download portfolio file</a>
            </div>
          </div>
        ) : <div style={{ color: '#888' }}>Portfolio information is unavailable.</div>}
      </section>
      {/* 분석 결과 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>2. AI analysis</h2>
        {analysis ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
            <AIAnalysisSummary analysis={analysis} score={analysisScore} title="Portfolio evidence analysis" />
          </div>
        ) : <div style={{ color: '#888' }}>Analysis is unavailable.</div>}
      </section>
      {/* 매칭 점수/이유 */}
      <section>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>3. Match score and rationale</h2>
        {match && (match.matchScore !== undefined || match.matchingScore !== undefined) ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
          <div><b>Match score:</b> <span style={{ color: '#f59e42', fontWeight: 700, fontSize: 20 }}>{match.matchScore ?? match.matchingScore}</span></div>
          <div style={{ marginTop: 10 }}><b>Rationale:</b></div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 15, marginTop: 6, color: '#475569', lineHeight: 1.6 }}>
              {matchEvidence?.summary || matchEvidence?.recommendation || match.matchReason || match.matchingReason || 'No match rationale is available.'}
            </div>
            {Array.isArray(matchEvidence?.dimensions) && matchEvidence.dimensions.length > 0 && (
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <strong style={{ color: '#166534' }}>Match evidence by dimension</strong>
                {matchEvidence.dimensions.map((dimension, index) => (
                  <div key={index} style={{ border: '1px solid #d1fae5', background: '#fff', borderRadius: 10, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <b>{dimension.name || 'Evaluation dimension'}</b>
                      <span style={{ color: '#047857', fontWeight: 800 }}>{Number(dimension.score || 0).toFixed(0)}/{dimension.max || 100}</span>
                    </div>
                    <div style={{ marginTop: 5, color: '#64748b', fontSize: 12 }}>Evidence support: {Math.round(Number(dimension.evidence_support || 0) * 100)}%</div>
                    {(dimension.evidence || []).slice(0, 2).map((item, evidenceIndex) => (
                      <div key={evidenceIndex} style={{ marginTop: 8, color: '#475569', fontSize: 13 }}>
                        <div>• {item.claim || 'No verified evidence'} <span style={{ color: item.verification_state === 'grounded' ? '#047857' : '#b45309', fontWeight: 700 }}>({item.verification_state || 'needs_verification'})</span></div>
                        {item.quote && <div style={{ marginTop: 4, padding: '5px 8px', borderLeft: '3px solid #86efac', background: '#f8fafc', color: '#64748b' }}>“{item.quote}”</div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {matchEvidence && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12 }}>
                  <b style={{ color: '#9a3412' }}>Why more verification is needed</b>
                    <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 13 }}>{(Array.isArray(matchEvidence.gaps) && matchEvidence.gaps.length ? matchEvidence.gaps : ['No open evidence gap is recorded.']).slice(0, 4).map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
                  <b style={{ color: '#1d4ed8' }}>Next verification action</b>
                    <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 13 }}>{(Array.isArray(matchEvidence.verification_plan) && matchEvidence.verification_plan.length ? matchEvidence.verification_plan : Array.isArray(matchEvidence.interview_focus) && matchEvidence.interview_focus.length ? matchEvidence.interview_focus : ['Verify ownership of a representative project.']).slice(0, 4).map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 12 }}>
                  <b style={{ color: '#6d28d9' }}>Evidence that could change the decision</b>
                  <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: 13 }}>
                    {(Array.isArray(getEvidenceValue('counterfactuals', null)) && getEvidenceValue('counterfactuals', null).length ? getEvidenceValue('counterfactuals', null) : [{ missing_signal: 'Actual ownership of a representative project', validation_action: 'Verify during the interview.' }]).slice(0, 3).map((item, i) => <li key={i}><b>{item.missing_signal}</b><br />{item.validation_action}</li>)}
                  </ul>
                </div>
                <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: 12, fontSize: 13 }}>
                  <b style={{ color: '#0e7490' }}>AI confidence</b>
                  <div style={{ marginTop: 8 }}>Evidence coverage: <strong>{getEvidenceValue('evidence_coverage', '-')}%</strong></div>
                  <div>Confidence: <strong>{getEvidenceValue('confidence', '-') === '-' ? '-' : `${Math.round(getEvidenceValue('confidence', 0) * 100)}%`}</strong></div>
                  <div>Fairness guard: <strong>Job-relevant information only</strong></div>
                </div>
              </div>
            )}
          </div>
        ) : <div style={{ color: '#888' }}>Match score and rationale are unavailable.</div>}
      </section>
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#30c59b', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 2.2rem', fontWeight: 700, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(48,197,155,0.08)' }}>
          Back to applications
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api/config';

export default function MatchingDetailModal({ open, onClose, candPortfolioId, postId }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobCandidateId, setJobCandidateId] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [selectedCounterfactuals, setSelectedCounterfactuals] = useState([]);

  useEffect(() => {
    if (!open) return;
    if (candPortfolioId == null || postId == null) {
      setError('Required information is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setMatch(null);
    // 후보자를 바꿔 열 때 이전 후보자의 초대 ID가 남지 않도록 초기화한다.
    setJobCandidateId(null);
    setSelectedCounterfactuals([]);
    
    // 매칭 정보와 함께 jobCandidateId도 가져오기
    Promise.all([
      fetch(apiUrl(`/api/portfolio-job-matches/portfolio/${candPortfolioId}/post/${postId}`))
        .then(r => r.ok ? r.json() : null),
      fetch(apiUrl(`/api/progress/${postId}/portfolio/${candPortfolioId}/job-candidate-id`))
        .then(r => r.ok ? r.json() : null)
        .catch(() => null) // jobCandidateId가 없을 수 있음
    ])
    .then(([matchData, jobCandidateResponse]) => {
      if (!matchData) {
        throw new Error('matching-result-not-found');
      }
      setMatch(matchData);
      if (jobCandidateResponse && jobCandidateResponse.jobCandidateId) {
        setJobCandidateId(jobCandidateResponse.jobCandidateId);
      }
      setLoading(false);
    })
    .catch(() => {
      setError('We could not load the matching result.');
      setLoading(false);
    });
  }, [open, candPortfolioId, postId]);

  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // 면접초대 함수
  const handleInterviewInvitation = async () => {
    if (!jobCandidateId) {
      alert('Candidate information is unavailable.');
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(apiUrl(`/api/progress/${jobCandidateId}/update-stage-2p`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        alert('Interview invitation sent.');
        onClose(); // 모달 닫기
      } else {
        const errorData = await response.text();
        alert(`Interview invitation failed: ${errorData}`);
      }
    } catch (error) {
      console.error('면접초대 전송 중 오류:', error);
      alert('An error occurred while sending the interview invitation.');
    } finally {
      setInviting(false);
    }
  };

  if (!open) return null;

  return (
    <div role="presentation" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.45)', zIndex: 2000, display:'flex', alignItems:'center', justifyContent:'center', padding: 12 }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="matching-detail-title" style={{ maxWidth: 800, width: '95vw', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(48,197,155,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', position:'relative' }} onClick={e => e.stopPropagation()}>
        <button type="button" aria-label="Close match details" onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'none', border:'none', fontSize:28, color:'#aaa', cursor:'pointer', fontWeight:700 }}>&times;</button>
        <h1 id="matching-detail-title" style={{ color: '#30c59b', fontWeight: 900, fontSize: '2rem', marginBottom: 32 }}>Match details</h1>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading match details...</div>
        ) : error ? (
          <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            {/* 매칭 점수/이유만 남김 */}
            <section>
              <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>Match score and rationale</h2>
              {(() => {
                const score = match?.matchScore ?? match?.MATCHING_SCORE ?? match?.matchingScore;
                const reason = match?.matchReason ?? match?.MATCHING_REASON ?? match?.matchingReason;
                let reasonPayload = null;
                try {
                  reasonPayload = JSON.parse(reason || '{}');
                } catch (_) {
                  reasonPayload = null;
                }
                const summary = reasonPayload?.summary || reason || 'No match rationale is available.';
                const dimensions = reasonPayload?.evidence?.dimensions || [];
                const gaps = reasonPayload?.evidence?.gaps || [];
                const interviewFocus = reasonPayload?.evidence?.interview_focus || [];
                const riskFlags = reasonPayload?.evidence?.risk_flags || [];
                const verificationPlan = reasonPayload?.evidence?.verification_plan || [];
                const counterfactuals = Array.isArray(reasonPayload?.evidence?.counterfactuals) ? reasonPayload.evidence.counterfactuals : [];
                const fairnessGuard = reasonPayload?.evidence?.fairness_guard || null;
                const decisionTrace = reasonPayload?.evidence?.decision_trace || [];
                const evidenceCoverage = reasonPayload?.evidence?.evidence_coverage;
                const confidence = reasonPayload?.evidence?.confidence;
                const audit = reasonPayload?.evidence?.audit;
                const calibration = reasonPayload?.evidence?.score_calibration;
                const selectedDelta = counterfactuals
                  .filter((_, index) => selectedCounterfactuals.includes(index))
                  .reduce((sum, item) => sum + Number(item.expected_score_delta || 0), 0);
                const projectedScore = Math.max(0, Math.min(100, Number(score || 0) + selectedDelta));
                return score !== undefined ? (
                  <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <span><b>Current match score:</b> <span style={{ color: '#f59e42', fontWeight: 700, fontSize: 20 }}>{score}</span></span>
                      {selectedCounterfactuals.length > 0 && <span style={{ color: '#6d28d9', fontWeight: 800 }}>Projected after verification: {projectedScore.toFixed(0)} points</span>}
                      <button
                        type="button"
                        onClick={() => {
                          const receipt = {
                            version: 'zoop-decision-receipt-v1',
                            generatedAt: new Date().toISOString(),
                            score,
                            projectedScore: selectedCounterfactuals.length > 0 ? projectedScore : null,
                            decision: reasonPayload?.decision || 'review',
                            summary,
                            dimensions,
                            gaps,
                            verificationPlan,
                            riskFlags,
                            fairnessGuard,
                            decisionTrace,
                            audit,
                          };
                          const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' }));
                          const anchor = document.createElement('a');
                          anchor.href = url;
                          anchor.download = `zoop-decision-receipt-${candPortfolioId}-${postId}.json`;
                          anchor.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={{ marginLeft: 'auto', border: '1px solid #a7f3d0', borderRadius: 999, background: '#ecfdf5', color: '#047857', padding: '7px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Save decision receipt
                      </button>
                    </div>
                    <div style={{ marginTop: 10 }}><b>Rationale:</b></div>
                    <pre style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 15, marginTop: 6, whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto' }}>{summary}</pre>
                    {calibration && (
                      <div style={{ marginTop: 12, padding: 12, background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, color: '#115e59', fontSize: 13 }}>
                        <strong>Evidence-calibrated score</strong>
                        <span style={{ marginLeft: 8 }}>AI draft {Number(calibration.model_score || 0).toFixed(0)} → evidence-grounded {Number(calibration.calibrated_score || 0).toFixed(0)} points</span>
                        <div style={{ marginTop: 5, color: '#0f766e' }}>{calibration.description || 'Only claims grounded in the candidate source are fully reflected in the score.'}</div>
                      </div>
                    )}
                    {dimensions.length > 0 && (
                      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                        <strong style={{ color: '#166534' }}>Evidence ledger</strong>
                        {dimensions.map((dimension, index) => (
                          <div key={`${dimension.name}-${index}`} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                              <b>{dimension.name}</b><span>{Number(dimension.score || 0).toFixed(0)}/{dimension.max}</span>
                            </div>
                            {dimension.model_score !== undefined && (
                              <div style={{ marginTop: 4, color: '#0f766e', fontSize: 11 }}>
                                AI draft {Number(dimension.model_score || 0).toFixed(0)} · evidence support {Math.round(Number(dimension.evidence_support || 0) * 100)}%
                              </div>
                            )}
                            {(dimension.evidence || []).slice(0, 2).map((item, evidenceIndex) => (
                              <div key={evidenceIndex} style={{ marginTop: 8, color: '#4b5563', fontSize: 14 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                  <span>· {item.claim || 'No verified evidence'}</span>
                                  <small style={{ color: item.verification_state === 'grounded' ? '#047857' : item.verification_state === 'context_only' ? '#1d4ed8' : '#b45309', fontWeight: 700 }}>
                                    {item.verification_state === 'grounded' ? 'Candidate source verified' : item.verification_state === 'context_only' ? 'Job context' : 'Needs verification'}
                                  </small>
                                </div>
                                {item.evidence_id && <small style={{ display: 'block', marginLeft: 12, marginTop: 2, color: '#9ca3af', fontFamily: 'monospace', fontSize: 10 }}>Evidence ID {item.evidence_id}</small>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12 }}>
                        <strong style={{ color: '#9a3412' }}>Why verification is pending</strong>
                        <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#7c2d12', fontSize: 13 }}>
                          {(gaps.length ? gaps : ['추가 확인이 필요한 정보가 없습니다.']).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
                        <strong style={{ color: '#1d4ed8' }}>Next verification action</strong>
                        <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#1e3a8a', fontSize: 13 }}>
                          {(verificationPlan.length ? verificationPlan : interviewFocus).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                    {riskFlags.length > 0 && (
                      <div style={{ marginTop: 12, color: '#475569', fontSize: 13 }}>
                        <b>주의 신호:</b> {riskFlags.slice(0, 4).join(' · ')}
                      </div>
                    )}
                    {(counterfactuals.length > 0 || fairnessGuard || decisionTrace.length > 0 || audit) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
                        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 12 }}>
                          <strong style={{ color: '#6d28d9' }}>Evidence that could change the decision</strong>
                          <p style={{ margin: '7px 0', color: '#5b21b6', fontSize: 12 }}>Select a verification item to simulate its expected impact.</p>
                          <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#4c1d95', fontSize: 13 }}>
                            {(counterfactuals.length ? counterfactuals : [{ missing_signal: 'No additional verification signal', validation_action: 'Review the original source material' }]).slice(0, 3).map((item, index) => (
                              <li key={index} style={{ marginBottom: 7, listStyle: 'none' }}>
                                <label style={{ display: 'flex', gap: 7, alignItems: 'flex-start', cursor: counterfactuals.length ? 'pointer' : 'default' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedCounterfactuals.includes(index)}
                                    disabled={!counterfactuals.length}
                                    onChange={() => setSelectedCounterfactuals(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index])}
                                  />
                                  <span><b>{item.missing_signal}</b><br /><span>{item.validation_action}</span>{item.expected_score_delta ? ` (${item.expected_score_delta > 0 ? '+' : ''}${item.expected_score_delta}점 가능)` : ''}</span>
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: 12 }}>
                          <strong style={{ color: '#0e7490' }}>AI confidence dashboard</strong>
                          <div style={{ marginTop: 10, color: '#164e63', fontSize: 13 }}>
                            <div>Evidence coverage: <b>{evidenceCoverage ?? '-'}%</b></div>
                            <div>Evidence confidence: <b>{confidence !== undefined ? `${Math.round(confidence * 100)}%` : '-'}</b></div>
                            {fairnessGuard && <div style={{ marginTop: 7 }}>Fairness guard: <b>{fairnessGuard.status === 'pass' ? 'Job-relevant signals only' : 'Review needed'}</b></div>}
                            {audit?.source_fingerprint && <div style={{ marginTop: 7, color: '#64748b', fontSize: 11 }}>Source fingerprint: <code>{audit.source_fingerprint.slice(0, 10)}…</code></div>}
                          </div>
                        </div>
                      </div>
                    )}
                    {decisionTrace.length > 0 && (
                      <div style={{ marginTop: 14, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                          <strong style={{ color: '#334155' }}>Decision trace</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
                          {decisionTrace.map((step, index) => <span key={index} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', color: '#475569', fontSize: 12 }}>{index + 1}. {step}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: '#888' }}>Match score and rationale are unavailable.</div>;
              })()}
            </section>

            {/* 면접초대 버튼 섹션 */}
            <section style={{ marginTop: 24 }}>
              <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>Interview management</h2>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 18 }}>
                <p style={{ margin: '0 0 16px 0', color: '#166534', fontSize: 14 }}>
                  Invite this candidate to an interview?
                </p>
                <button
                  onClick={handleInterviewInvitation}
                  disabled={inviting || !jobCandidateId}
                  style={{
                    background: jobCandidateId ? 'linear-gradient(135deg, #30c59b 0%, #22c55e 100%)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: jobCandidateId ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: jobCandidateId ? '0 4px 12px rgba(48, 197, 155, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                    if (jobCandidateId) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(48, 197, 155, 0.4)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (jobCandidateId) {
                      e.target.style.transform = 'none';
                      e.target.style.boxShadow = '0 4px 12px rgba(48, 197, 155, 0.3)';
                    }
                  }}
                >
                  {inviting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Sending interview invitation...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      Send interview invitation
                    </>
                  )}
                </button>
                {!jobCandidateId && (
                  <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '12px' }}>
                    * Candidate information is unavailable, so an invitation cannot be sent.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

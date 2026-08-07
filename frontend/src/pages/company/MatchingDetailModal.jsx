import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api/config';

export default function MatchingDetailModal({ open, onClose, candPortfolioId, postId }) {
  const [portfolio, setPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobCandidateId, setJobCandidateId] = useState(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (candPortfolioId == null || postId == null) {
      setError('필수 정보가 누락되었습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    
    // 매칭 정보와 함께 jobCandidateId도 가져오기
    Promise.all([
      fetch(apiUrl(`/api/portfolio-job-matches/portfolio/${candPortfolioId}/post/${postId}`))
        .then(r => r.ok ? r.json() : null),
      fetch(apiUrl(`/api/progress/${postId}/portfolio/${candPortfolioId}/job-candidate-id`))
        .then(r => r.ok ? r.json() : null)
        .catch(() => null) // jobCandidateId가 없을 수 있음
    ])
    .then(([matchData, jobCandidateResponse]) => {
      setMatch(matchData);
      if (jobCandidateResponse && jobCandidateResponse.jobCandidateId) {
        setJobCandidateId(jobCandidateResponse.jobCandidateId);
      }
      setLoading(false);
    })
    .catch(e => {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    });
  }, [open, candPortfolioId, postId]);

  // 면접초대 함수
  const handleInterviewInvitation = async () => {
    if (!jobCandidateId) {
      alert('후보자 정보를 찾을 수 없습니다.');
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
        alert('면접초대가 성공적으로 전송되었습니다.');
        onClose(); // 모달 닫기
      } else {
        const errorData = await response.text();
        alert(`면접초대 전송 실패: ${errorData}`);
      }
    } catch (error) {
      console.error('면접초대 전송 중 오류:', error);
      alert('면접초대 전송 중 오류가 발생했습니다.');
    } finally {
      setInviting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.45)', zIndex: 2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ maxWidth: 800, width: '95vw', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(48,197,155,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem', position:'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:18, right:18, background:'none', border:'none', fontSize:28, color:'#aaa', cursor:'pointer', fontWeight:700 }}>&times;</button>
        <h1 style={{ color: '#30c59b', fontWeight: 900, fontSize: '2rem', marginBottom: 32 }}>매칭 상세 결과</h1>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>{error}</div>
        ) : (
          <>
            {/* 매칭 점수/이유만 남김 */}
            <section>
              <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>매칭 점수 및 이유</h2>
              {(() => {
                const score = match?.matchScore ?? match?.MATCHING_SCORE ?? match?.matchingScore;
                const reason = match?.matchReason ?? match?.MATCHING_REASON ?? match?.matchingReason;
                let reasonPayload = null;
                try {
                  reasonPayload = JSON.parse(reason || '{}');
                } catch (_) {
                  reasonPayload = null;
                }
                const summary = reasonPayload?.summary || reason || '매칭 이유 정보 없음';
                const dimensions = reasonPayload?.evidence?.dimensions || [];
                const gaps = reasonPayload?.evidence?.gaps || [];
                const interviewFocus = reasonPayload?.evidence?.interview_focus || [];
                const riskFlags = reasonPayload?.evidence?.risk_flags || [];
                const verificationPlan = reasonPayload?.evidence?.verification_plan || [];
                const counterfactuals = reasonPayload?.evidence?.counterfactuals || [];
                const fairnessGuard = reasonPayload?.evidence?.fairness_guard || null;
                const decisionTrace = reasonPayload?.evidence?.decision_trace || [];
                const evidenceCoverage = reasonPayload?.evidence?.evidence_coverage;
                const confidence = reasonPayload?.evidence?.confidence;
                return score !== undefined ? (
                  <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
                    <div><b>매칭 점수:</b> <span style={{ color: '#f59e42', fontWeight: 700, fontSize: 20 }}>{score}</span></div>
                    <div style={{ marginTop: 10 }}><b>매칭 이유:</b></div>
                    <pre style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 15, marginTop: 6, whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto' }}>{summary}</pre>
                    {dimensions.length > 0 && (
                      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                        <strong style={{ color: '#166534' }}>판단 근거 원장</strong>
                        {dimensions.map((dimension, index) => (
                          <div key={`${dimension.name}-${index}`} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 10, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                              <b>{dimension.name}</b><span>{dimension.score}/{dimension.max}</span>
                            </div>
                            {(dimension.evidence || []).slice(0, 2).map((item, evidenceIndex) => (
                              <div key={evidenceIndex} style={{ marginTop: 6, color: '#4b5563', fontSize: 14 }}>· {item.claim || '확인된 근거 없음'} <small style={{ color: '#9ca3af' }}>({item.source || 'missing'})</small></div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12 }}>
                        <strong style={{ color: '#9a3412' }}>판단을 보류한 이유</strong>
                        <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#7c2d12', fontSize: 13 }}>
                          {(gaps.length ? gaps : ['추가 확인이 필요한 정보가 없습니다.']).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                      </div>
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12 }}>
                        <strong style={{ color: '#1d4ed8' }}>다음 검증 행동</strong>
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
                    {(counterfactuals.length > 0 || fairnessGuard || decisionTrace.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10, marginTop: 16 }}>
                        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: 12 }}>
                          <strong style={{ color: '#6d28d9' }}>판단을 바꿀 수 있는 증거</strong>
                          <ul style={{ margin: '8px 0 0 18px', padding: 0, color: '#4c1d95', fontSize: 13 }}>
                            {(counterfactuals.length ? counterfactuals : [{ missing_signal: '추가 검증 신호 없음', validation_action: '원본 자료 확인' }]).slice(0, 3).map((item, index) => (
                              <li key={index} style={{ marginBottom: 7 }}><b>{item.missing_signal}</b><br /><span>{item.validation_action}</span>{item.expected_score_delta ? ` (${item.expected_score_delta > 0 ? '+' : ''}${item.expected_score_delta}점 가능)` : ''}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: 12 }}>
                          <strong style={{ color: '#0e7490' }}>AI 신뢰도 계기판</strong>
                          <div style={{ marginTop: 10, color: '#164e63', fontSize: 13 }}>
                            <div>근거 커버리지: <b>{evidenceCoverage ?? '-'}%</b></div>
                            <div>근거 확신도: <b>{confidence !== undefined ? `${Math.round(confidence * 100)}%` : '-'}</b></div>
                            {fairnessGuard && <div style={{ marginTop: 7 }}>편향 방지: <b>{fairnessGuard.status === 'pass' ? '직무 관련 신호만 평가' : '확인 필요'}</b></div>}
                          </div>
                        </div>
                      </div>
                    )}
                    {decisionTrace.length > 0 && (
                      <div style={{ marginTop: 14, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                        <strong style={{ color: '#334155' }}>판단 추적 로그</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
                          {decisionTrace.map((step, index) => <span key={index} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 999, padding: '5px 9px', color: '#475569', fontSize: 12 }}>{index + 1}. {step}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : <div style={{ color: '#888' }}>매칭 점수/이유 정보를 찾을 수 없습니다.</div>;
              })()}
            </section>

            {/* 면접초대 버튼 섹션 */}
            <section style={{ marginTop: 24 }}>
              <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>면접 관리</h2>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 18 }}>
                <p style={{ margin: '0 0 16px 0', color: '#166534', fontSize: 14 }}>
                  이 후보자에게 면접을 초대하시겠습니까?
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
                      면접초대 전송 중...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      면접초대 보내기
                    </>
                  )}
                </button>
                {!jobCandidateId && (
                  <p style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '12px' }}>
                    * 후보자 정보를 찾을 수 없어 면접초대를 보낼 수 없습니다.
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

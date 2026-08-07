import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../api/config';

export default function MatchingDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    candPortfolioId,
    jobCandidateId,
    analysisId,
    candidateId,
    postId,
  } = location.state || {};

  const [portfolio, setPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!candPortfolioId || !jobCandidateId || !analysisId) {
      setError('필수 정보가 누락되었습니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
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
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    });
  }, [candPortfolioId, jobCandidateId, analysisId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>불러오는 중...</div>;
  if (error) return <div style={{ padding: 40, color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(48,197,155,0.10)', padding: '2.5rem 2.5rem 2rem 2.5rem' }}>
      <h1 style={{ color: '#30c59b', fontWeight: 900, fontSize: '2rem', marginBottom: 32 }}>매칭 상세 결과</h1>
      {/* 이력서/포트폴리오 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>1. 이력서(포트폴리오) 등록 정보</h2>
        {portfolio ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
            <div><b>파일명:</b> {portfolio.originalFileName || '이름 없음'}</div>
            <div><b>제출일:</b> {portfolio.portfolioSubmissionDate ? new Date(portfolio.portfolioSubmissionDate).toLocaleString() : '-'}</div>
            <div><b>상태:</b> {portfolio.portfolioAnalysisStatus || '-'}</div>
            <div style={{ marginTop: 8 }}>
              <a href={portfolio.portfolioFilePath} target="_blank" rel="noopener noreferrer" style={{ color: '#30c59b', textDecoration: 'underline', fontWeight: 700 }}>포트폴리오 파일 다운로드</a>
            </div>
          </div>
        ) : <div style={{ color: '#888' }}>포트폴리오 정보를 찾을 수 없습니다.</div>}
      </section>
      {/* 분석 결과 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>2. AI 분석 결과</h2>
        {analysis ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
            <div><b>분석 점수:</b> <span style={{ color: '#30c59b', fontWeight: 700, fontSize: 20 }}>{analysis.analysisScore ?? '-'}</span></div>
            <div style={{ marginTop: 10 }}><b>분석 내용:</b></div>
            <pre style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 15, marginTop: 6, maxHeight: 200, overflow: 'auto' }}>{typeof analysis.analysisData === 'string' ? analysis.analysisData : JSON.stringify(analysis.analysisData, null, 2)}</pre>
          </div>
        ) : <div style={{ color: '#888' }}>분석 결과를 찾을 수 없습니다.</div>}
      </section>
      {/* 매칭 점수/이유 */}
      <section>
        <h2 style={{ color: '#222', fontWeight: 800, fontSize: '1.2rem', marginBottom: 12 }}>3. 매칭 점수 및 이유</h2>
        {match && (match.matchScore !== undefined || match.matchingScore !== undefined) ? (
          <div style={{ background: '#f8fafd', borderRadius: 10, padding: 18, fontSize: 16 }}>
            <div><b>매칭 점수:</b> <span style={{ color: '#f59e42', fontWeight: 700, fontSize: 20 }}>{match.matchScore ?? match.matchingScore}</span></div>
            <div style={{ marginTop: 10 }}><b>매칭 이유:</b></div>
            <pre style={{ background: '#fff', borderRadius: 8, padding: 14, fontSize: 15, marginTop: 6, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{match.matchReason || match.matchingReason || '매칭 이유 정보 없음'}</pre>
          </div>
        ) : <div style={{ color: '#888' }}>매칭 점수/이유 정보를 찾을 수 없습니다.</div>}
      </section>
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#30c59b', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 2.2rem', fontWeight: 700, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(48,197,155,0.08)' }}>
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}

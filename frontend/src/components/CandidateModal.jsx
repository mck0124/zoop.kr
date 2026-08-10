import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { apiUrl as buildApiUrl } from '../api/config';
import AIAnalysisSummary, { parseAIAnalysisData } from './AIAnalysisSummary';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

const FUSION_SOURCES = [
  { key: 'github', label: 'GitHub', weight: 0.3 },
  { key: 'portfolio', label: 'Portfolio', weight: 0.35 },
  { key: 'interview', label: 'Interview', weight: 0.35 },
];

const finiteScore = (value) => {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 ? Math.min(100, score) : null;
};

const scoreIfAnalyzed = (value, payload) => {
  const score = finiteScore(value);
  return score === 0 && !payload ? null : score;
};

const evidenceCoverage = (payload) => {
  const value = payload?.evidence_coverage ?? payload?.evidenceCoverage;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, numeric <= 1 ? numeric * 100 : numeric));
};

const analysisRoot = (value) => {
  const payload = parseAIAnalysisData(value);
  return payload?.analysis && typeof payload.analysis === 'object' ? payload.analysis : payload;
};

function buildEvidenceFusion({ githubScore, portfolioAnalysis, interviewAnalysis }) {
  const githubPayload = analysisRoot(githubScore?.analysisData ?? githubScore);
  const portfolioPayload = analysisRoot(portfolioAnalysis?.analysisData ?? portfolioAnalysis);
  const interviewPayload = analysisRoot(interviewAnalysis?.analysisData ?? interviewAnalysis);
  const inputs = {
    github: { score: scoreIfAnalyzed(githubScore?.analysisScore ?? githubScore, githubPayload), payload: githubPayload },
    portfolio: { score: scoreIfAnalyzed(portfolioAnalysis?.analysisScore, portfolioPayload), payload: portfolioPayload },
    interview: { score: scoreIfAnalyzed(interviewAnalysis?.analysisScore, interviewPayload), payload: interviewPayload },
  };
  const sources = FUSION_SOURCES.map(source => {
    const input = inputs[source.key];
    const coverage = evidenceCoverage(input.payload);
    const reliability = coverage === null ? 0.5 : 0.35 + (0.65 * coverage / 100);
    return { ...source, ...input, coverage, reliability };
  }).filter(source => source.score !== null);
  if (!sources.length) return null;

  const denominator = sources.reduce((sum, source) => sum + source.weight * source.reliability, 0);
  const score = denominator ? Math.round(sources.reduce((sum, source) => sum + source.score * source.weight * source.reliability, 0) / denominator) : null;
  const baseConfidence = Math.round(sources.reduce((sum, source) => sum + (source.coverage ?? 50) * source.weight, 0) / sources.reduce((sum, source) => sum + source.weight, 0));
  const sourceScores = sources.map(source => source.score);
  const spread = sourceScores.length > 1 ? Math.round(Math.max(...sourceScores) - Math.min(...sourceScores)) : 0;
  const consistency = {
    status: spread > 30 ? 'conflicting' : spread > 15 ? 'mixed' : 'aligned',
    spread,
    lowest: Math.min(...sourceScores),
    highest: Math.max(...sourceScores),
    note: spread > 30
      ? 'Independent sources disagree materially; do not average the conflict away.'
      : spread > 15
        ? 'Sources show a meaningful difference that should be resolved with a focused verification.'
        : 'Independent sources are directionally aligned.',
  };
  const fairnessReview = sources.some(source => source.payload?.fairness_guard?.status === 'review');
  const confidencePenalty = spread > 15 ? Math.round((spread - 15) * 0.7) : 0;
  const confidence = Math.max(0, Math.min(100, baseConfidence - confidencePenalty));
  const decision = sources.length < 2 || confidence < 50
    ? 'not_enough_evidence'
    : fairnessReview || consistency.status !== 'aligned'
      ? 'review'
      : score >= 75 && confidence >= 70 ? 'strong_match' : 'review';
  return { sources, score, confidence, decision, independentSources: sources.length, consistency, fairnessReview };
}

function EvidenceFusionCard({ candidate, portfolioAnalysis, interviewAnalysis }) {
  const fusion = buildEvidenceFusion({
    githubScore: {
      analysisScore: candidate?.analysisScore,
      analysisData: candidate?.analysis || candidate?.aiAnalysis?.analysisData || candidate?.aiAnalysis?.analysis,
    },
    portfolioAnalysis,
    interviewAnalysis,
  });
  if (!fusion) return null;
  const decisionLabel = fusion.decision === 'strong_match' ? 'Strong evidence' : fusion.decision === 'review' ? 'Review recommended' : 'More evidence needed';
  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-lg" aria-label="Evidence fusion summary">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">ZOOP Evidence Fusion</div>
          <h3 className="mt-1 text-lg font-bold">One decision, multiple verified signals</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">Available sources are re-weighted by evidence coverage. Missing or weakly grounded sources cannot silently inflate the final signal.</p>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-right">
          <div className="text-xs font-semibold text-emerald-200">Fused signal</div>
          <div className="text-3xl font-black text-emerald-300">{fusion.score}<span className="text-sm font-semibold text-emerald-200">/100</span></div>
          <div className="text-xs font-semibold text-slate-300">{decisionLabel}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {fusion.sources.map(source => (
          <div key={source.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>{source.label}</span>
              <span className="text-emerald-300">{Math.round(source.score)}/100</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${source.coverage ?? 50}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-400">{source.coverage === null ? 'Coverage unavailable' : `${Math.round(source.coverage)}% evidence coverage`} · {Math.round(source.reliability * 100)}% weight confidence</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>{fusion.independentSources} independent source{fusion.independentSources === 1 ? '' : 's'}</span>
        <span>Fusion confidence {fusion.confidence}%</span>
        {fusion.consistency && <span className={fusion.consistency.status === 'aligned' ? 'text-emerald-300' : 'text-amber-300'}>Signal consistency: {fusion.consistency.status} ({fusion.consistency.spread}-point spread)</span>}
        <span>Human review remains required</span>
      </div>
      {fusion.consistency && fusion.consistency.status !== 'aligned' && (
        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
          <strong>Conflict audit:</strong> {fusion.consistency.note}
        </div>
      )}
      {fusion.fairnessReview && (
        <div className="mt-2 rounded-xl border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100">
          <strong>Fairness audit:</strong> one or more source decisions require human review.
        </div>
      )}
    </section>
  );
}

export { buildEvidenceFusion };

/** */
export default function CandidateModal({ candidate, isOpen, onClose, postId, avatarUrl, fromMatchingTab }) {
  const [zoom, setZoom] = useState(1.1); // 초기값 110%
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const modalRef = useRef(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [jobCandidateId, setJobCandidateId] = useState(null);

  // 예시: 필요한 값이 없을 경우 대비하여 상태 저장
  const [portfolioDate, setPortfolioDate] = useState(null);
  const [interviewSchedule, setInterviewSchedule] = useState(null);

  // 하단 드롭다운용 상태 정의
  const [portfolioAnalysis, setPortfolioAnalysis] = useState(null);
  const [interviewVideoUrl, setInterviewVideoUrl] = useState(null);
  const [interviewAnalysis, setInterviewAnalysis] = useState(null);

  // 아코디언 open을 위한 상태
  const [portfolioAnalysisOpen, setPortfolioAnalysisOpen] = useState(false); // 포트폴리오 분석

  const [videoBlobUrl, setVideoBlobUrl] = useState(null);
  const [localStage, setLocalStage] = useState(candidate?.jobCandCurrStage);

  // candidate가 변경될 때 localStage 동기화
  useEffect(() => {
    if (candidate?.jobCandCurrStage) {
      setLocalStage(candidate.jobCandCurrStage);
    }
  }, [candidate?.jobCandCurrStage]);

  // jobCandidateId 조회 (fromMatchingTab이 아닐 때만)
  useEffect(() => {
    if (!isOpen || !candidate || !postId || fromMatchingTab) return;

    fetch(buildApiUrl(`/api/progress/${postId}/${candidate.githubLogin}/job-candidate-id`))
      .then(res => {
        if (!res.ok) throw new Error('jobCandidateId 조회 실패');
        return res.json();
      })
      .then(data => {
        setJobCandidateId(data.jobCandidateId);
      })
      .catch(err => {
        console.error('jobCandidateId 조회 오류:', err);
        setJobCandidateId(null);
      });
  }, [isOpen, candidate, postId, fromMatchingTab]);

  // 모달이 열릴 때 stage에 따라 API 호출 (fromMatchingTab이 아닐 때만)
  useEffect(() => {
    if (!isOpen || !candidate || !jobCandidateId || fromMatchingTab) return;

    const stage = candidate.jobCandCurrStage;
    // portfolioSubmissionDate 
    if (["2y", "2p", "3n", "3y", "4n", "4y"].includes(stage)) {
      fetch(buildApiUrl(`/api/portfolios/${jobCandidateId}/submission-date`))
        .then(res => {
          if (!res.ok) throw new Error('portfolioSubmissionDate 조회 실패');
          return res.json();
        })
        .then(data => {
          if (data && data.portfolioSubmissionDate) {
            setPortfolioDate(data.portfolioSubmissionDate);
          } else {
            setPortfolioDate(null);
          }
        })
        .catch(err => {
          console.error('portfolioSubmissionDate 조회 오류:', err);
          setPortfolioDate(null);
        });
    }

    // interviewSchedule
    if (["3n", "3y", "4n", "4y"].includes(stage)) {
      fetch(buildApiUrl(`/api/interview-schedules/${jobCandidateId}/schedule`))
        .then(res => {
          if (!res.ok) throw new Error('interviewSchedule 조회 실패');
          return res.json();
        })
        .then(data => {
          if (data) {
            setInterviewSchedule(data);
          } else {
            setInterviewSchedule(null);
          }
        })
        .catch(err => {
          console.error('interviewSchedule 조회 오류:', err);
          setInterviewSchedule(null);
        });
    }

    // 포트폴리오 분석
    if (["2y", "2p", "3n", "3y", "4n", "4y"].includes(stage)) {
      fetch(buildApiUrl(`/api/analysis/${jobCandidateId}/portfolio`))
        .then(res => {
          if (!res.ok) throw new Error('portfolioAnalysis 조회 실패');
          return res.json();
        })
        .then(data => {
          if (data) {
            setPortfolioAnalysis(data);
          } else {
            setPortfolioAnalysis(null);
          }
        })
        .catch(err => {
          console.error('portfolioAnalysis 조회 오류:', err);
          setPortfolioAnalysis(null);
        });
    }

    
    // 면접 영상
    if (["3y", "4n", "4y"].includes(stage)) {
      fetch(buildApiUrl(`/api/interviews/${jobCandidateId}/video`))
        .then(res => {
          if (!res.ok) throw new Error('interviewVideo 조회 실패');
          return res.json();
        })
        .then(data => {
          if (data && data.videoUrl) {
            setInterviewVideoUrl(data.videoUrl);
          } else {
            setInterviewVideoUrl(null);
          }
        })
        .catch(err => {
          console.error('interviewVideo 조회 오류:', err);
          setInterviewVideoUrl(null);
        });

      // 면접 분석
      fetch(buildApiUrl(`/api/analysis/${jobCandidateId}/interview`))
        .then(res => {
          if (!res.ok) throw new Error('interviewAnalysis 조회 실패');
          return res.json();
        })
        .then(data => {
          if (data) {
            setInterviewAnalysis(data);
          } else {
            setInterviewAnalysis(null);
          }
        })
        .catch(err => {
          console.error('interviewAnalysis 조회 오류:', err);
          setInterviewAnalysis(null);
        });
    }
    
  }, [isOpen, candidate, jobCandidateId, fromMatchingTab]);

  /**포트폴리오를 불러오기 위한 useState */
  useEffect(() => {
    if (!jobCandidateId) return;

    // jobCandidateId로 포트폴리오 조회
    fetch(buildApiUrl(`/api/portfolios/job-candidate/${jobCandidateId}`))
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            return null;
          }
          throw new Error('포트폴리오 조회 실패');
        }
        return res.json();
      })
      .then(portfolio => {
        if (!portfolio) {
          setPdfBlobUrl(null);
          return;
        }

        const filePath = portfolio.portfolioFilePath;
        if (!filePath) {
          setPdfBlobUrl(null);
          return;
        }

        // S3 URL인지 로컬 파일 경로인지 확인
        const isS3Url = filePath.startsWith('https://') && filePath.includes('s3');
        
        let url;
        if (isS3Url) {
          // S3 URL인 경우 백엔드 프록시를 통해 다운로드
          url = buildApiUrl(`/api/files/s3/download?s3Url=${encodeURIComponent(filePath)}`);
        } else {
          // 로컬 파일인 경우 기존 방식 사용
          const filename = filePath.split('/').pop();
          url = buildApiUrl(`/api/files/download/${filename}`);
        }

        return fetch(url);
      })
      .then(res => {
        if (!res) return null;
        if (!res.ok) throw new Error('파일 다운로드 실패');
        return res.blob();
      })
      .then(blob => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      })
      .catch(err => {
        console.error("포트폴리오 fetch 오류:", err);
        setPdfBlobUrl(null);
      });

  // The cleanup intentionally uses the URL captured by this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCandidateId]);

  useEffect(() => () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
  }, [pdfBlobUrl]);

  
  /** 면접영상을 불러오기 위한 useState */
  useEffect(() => {
    if (!interviewVideoUrl) return;

    // S3 URL인지 로컬 파일 경로인지 확인
    const isS3Url = interviewVideoUrl.startsWith('https://') && interviewVideoUrl.includes('s3');
    
    let url;
    if (isS3Url) {
      // S3 URL인 경우 백엔드 프록시를 통해 다운로드
      url = buildApiUrl(`/api/files/s3/download?s3Url=${encodeURIComponent(interviewVideoUrl)}`);
    } else {
      // 로컬 파일인 경우 기존 방식 사용
      const filename = interviewVideoUrl.split('/').pop(); // 예: "video.mp4"
      url = buildApiUrl(`/api/files/download/${filename}`);
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('면접 영상 다운로드 실패');
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(blobUrl);
      })
      .catch(err => {
        console.error("🎥 면접 영상 fetch 오류:", err);
        setVideoBlobUrl(null);
      });

  // The cleanup intentionally uses the URL captured by this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewVideoUrl]);

  useEffect(() => () => {
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
  }, [videoBlobUrl]);



  const prev = () => {
    if (!numPages) return;
    setCurrentIdx(idx => (idx === 0 ? numPages - 1 : idx - 1));
  };
  const next = () => {
    if (!numPages) return;
    setCurrentIdx(idx => (idx === numPages - 1 ? 0 : idx + 1));
  };
  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // 면접초대 버튼 클릭시
  const handleInterviewInvitation = async () => {
    if (!jobCandidateId) {
      alert('Candidate details are still loading. Please try again shortly.');
      return;
    }

    const invitationUrl = buildApiUrl(`/api/progress/${jobCandidateId}/update-stage-2p`);

    try {
      const response = await fetch(invitationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (response.ok) {
        alert('Interview invitation sent successfully.');
        // 로컬 상태 업데이트: 2y -> 2p로 변경
        setLocalStage('2p');
      } else {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        alert(`Could not send the interview invitation: ${errorText}`);
      }
    } catch (error) {
      console.error('면접 초대 API 호출 오류:', error);
      alert('Something went wrong while sending the interview invitation.');
    }
  };

  // 닫기버튼 클릭시
  const handleClose = useCallback(() => {
    // 아코디언 닫기
    setPortfolioAnalysisOpen(false);

    // pdf관련 초기화
    setZoom(1.2);
    setCurrentIdx(0);
    setNumPages(null);

    // 후보자 관련 데이터 초기화
    setPortfolioDate(null);
    setInterviewSchedule(null);
    setPortfolioAnalysis(null);
    setInterviewVideoUrl(null);
    setInterviewAnalysis(null);

    // 최종 닫기
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const navigate = useNavigate();
  // 매칭탭에서만 새로운 상세페이지로 이동하는 함수
  const handleGoToMatchingDetail = () => {
    if (fromMatchingTab) {
      const portfolioId = candidate.candPortfolioId;
      const jobCandidateId = candidate.jobCandidateId;
      const analysisId = candidate.aiAnalysis?.analysisId || null;
      navigate('/matching-detail', {
        state: {
          candPortfolioId: portfolioId,
          jobCandidateId,
          analysisId,
          candidateId: candidate.candidateId,
          postId,
        }
      });
      return;
    }
    const portfolioId = candidate.candPortfolioId || portfolioAnalysis?.candPortfolioId;
    const analysisId = portfolioAnalysis?.analysisId || null; // 실제 분석ID로 대체 필요
    if (!portfolioId) {
      window.alert('The portfolio matching result is not ready for this candidate yet.');
      return;
    }
    navigate(`/job/${postId}`, {
      state: {
        fromMatchingTab: true,
        portfolioId,
        analysisId,
        candidateId: candidate.candidateId,
        jobCandidateId,
      }
    });
  };

  // 진행률 스타일 카드 컴포넌트
  const ScoreCard = ({ title, score, max = 100, color, icon }) => {
    const percent = Math.round((score ?? 0) / max * 100);
    return (
      <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{icon}</span>
          <span className="font-semibold text-gray-700">{title}</span>
        </div>
        {score ? (
          <>
            <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
            <div className="text-lg font-bold text-gray-800">{score} <span className="text-xs text-gray-400">/ {max}</span></div>
          </>
        ) : (
          <div className="text-gray-400 font-medium">Not submitted</div>
        )}
      </div>
    );
  };

  // 포트폴리오 점수 카드
  const PortfolioScoreCard = ({ score, max = 100, color, icon }) => {
    const percent = Math.round((score ?? 0) / max * 100);
    return (
      <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{icon}</span>
          <span className="font-semibold text-gray-700">Portfolio analysis score</span>
        </div>
        {score ? (
          <>
            <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
            <div className="text-lg font-bold text-gray-800">{score} <span className="text-xs text-gray-400">/ {max}</span></div>
          </>
        ) : (
          <div className="text-gray-400 font-medium">Not submitted</div>
        )}
      </div>
    );
  };

  // 면접 점수 카드
  const InterviewScoreCard = ({ score, max = 100, color, icon }) => {
    const percent = Math.round((score ?? 0) / max * 100);
    return (
      <div className="flex-1 bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center border border-gray-100">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{icon}</span>
          <span className="font-semibold text-gray-700">Interview analysis score</span>
        </div>
        {score ? (
          <>
            <div className="w-full h-3 bg-gray-100 rounded-full mb-2">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
            <div className="text-lg font-bold text-gray-800">{score} <span className="text-xs text-gray-400">/ {max}</span></div>
          </>
        ) : (
          <div className="text-gray-400 font-medium">Not completed</div>
        )}
      </div>
    );
  };

  if (!isOpen || !candidate) return null;

  // 날짜 포맷 함수 (연. 월. 일. 오전/오후 시:분:초)
  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hour = date.getHours();
    const minute = date.getMinutes();
    const isPM = hour >= 12;
    const ampm = isPM ? 'PM' : 'AM';
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return `${year}. ${month}. ${day}. ${ampm} ${hour12}:${minute.toString().padStart(2, '0')}`;
  }

  // 상단 정보 정렬 개선 (2행 2열 그리드)
  return (
    <div role="presentation" style={{ display: isOpen ? 'flex' : 'none' }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Candidate details"
        tabIndex={-1}
        className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 w-[85%] max-w-[900px] max-h-[90%] relative overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 요약 정보 */}
        <div className="mb-8">
          <div className="grid grid-cols-[auto_1fr_1fr] grid-rows-2 gap-x-8 gap-y-2 items-center">
            <div rowSpan={2} className="row-span-2 flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={`${candidate.githubLogin} profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-2xl" style={{ display: avatarUrl ? 'none' : 'flex' }}>👤</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Username</span>
              <div className="font-semibold text-lg">{candidate.githubLogin}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Email</span>
              <div className="font-semibold text-lg">{candidate.candidateEmail}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Portfolio submitted</span>
          <div className="font-semibold text-lg">{formatDateTime(portfolioDate)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Interview schedule</span>
          <div className="font-semibold text-lg">{formatDateTime(interviewSchedule?.aiInterviewScheduledTime)}</div>
            </div>
          </div>
        </div>

        {/* 중간: 점수 카드 3개 */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <ScoreCard
            title="GitHub analysis score"
            score={candidate.analysisScore}
            color="#34d399"
            icon={<span>🐙</span>}
          />
          <PortfolioScoreCard
            score={portfolioAnalysis?.analysisScore}
            color="#60a5fa"
            icon={<span>📁</span>}
          />
          <InterviewScoreCard
            score={interviewAnalysis?.analysisScore}
            color="#a78bfa"
            icon={<span>🧠</span>}
          />
        </div>

        <EvidenceFusionCard
          candidate={candidate}
          portfolioAnalysis={portfolioAnalysis}
          interviewAnalysis={interviewAnalysis}
        />

        {/* 하단: 포트폴리오 미리보기 (확대) */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-inner">
          <h4 className="font-bold text-lg mb-4 text-emerald-700">📄 Portfolio preview</h4>
          {/* 확대/축소 버튼 (진한 초록색) */}
          <div className="flex justify-end gap-2 mb-2">
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="w-8 h-8 bg-[#166534] hover:bg-[#14532d] text-white text-2xl rounded flex items-center justify-center">-</button>
            <span className="text-gray-700 font-medium">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-8 h-8 bg-[#166534] hover:bg-[#14532d] text-white text-2xl rounded flex items-center justify-center">+</button>
          </div>
          {/* PDF 미리보기 및 좌우 이동 버튼 */}
          <div className="relative flex justify-center items-center min-h-[400px]">
            {/* 이전(<) 버튼 */}
            <button
              onClick={prev}
              disabled={!numPages}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center text-2xl text-emerald-600 hover:bg-emerald-50 z-10"
            >&lt;</button>
            {/* PDF 미리보기 or 안내 */}
            {pdfBlobUrl ? (
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => console.error("PDF 로딩 오류:", err)}
              >
                <Page
                  pageNumber={currentIdx + 1}
                  height={400 * zoom}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-[350px] bg-gray-100 bg-opacity-60 rounded-2xl border-2 border-dashed border-gray-300">
                <span className="text-6xl mb-4">📁</span>
                <div className="text-lg font-semibold mb-2 text-gray-500">No portfolio submitted yet.</div>
                <div className="text-sm text-gray-400">A preview will appear here after submission.</div>
              </div>
            )}
            {/* 다음(>) 버튼 */}
            <button
              onClick={next}
              disabled={!numPages}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center text-2xl text-emerald-600 hover:bg-emerald-50 z-10"
            >&gt;</button>
          </div>
          {/* 페이지 정보 */}
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-sm text-gray-600">{currentIdx + 1} / {numPages || '?'}</span>
          </div>
          {/* 포트폴리오 분석결과 토글 (하단) */}
          <div className="mt-6">
            <button
              onClick={() => setPortfolioAnalysisOpen(!portfolioAnalysisOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full border-2 transition-colors ${portfolioAnalysisOpen ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                {portfolioAnalysisOpen && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
              </div>
              <span className="font-medium text-gray-700">Portfolio analysis</span>
            </button>
            {portfolioAnalysisOpen && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                {portfolioAnalysis ? (
                  <AIAnalysisSummary
                    analysis={portfolioAnalysis}
                    score={portfolioAnalysis.analysisScore}
                  />
                ) : (
                  <div className="text-gray-400">No analysis available.</div>
                )}
              </div>
            )}
          </div>
          {interviewAnalysis && (
            <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <AIAnalysisSummary
                analysis={interviewAnalysis}
                score={interviewAnalysis.analysisScore}
              />
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="mt-10 flex justify-end gap-3">
          {fromMatchingTab && (
            <button
              onClick={handleGoToMatchingDetail}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              View matching details
            </button>
          )}
          { ["2y"].includes(localStage) && (
            <button
              onClick={handleInterviewInvitation}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Invite to interview
            </button>
          )}
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

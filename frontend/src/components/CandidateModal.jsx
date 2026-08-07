import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import { apiUrl as buildApiUrl } from '../api/config';
import AIAnalysisSummary from './AIAnalysisSummary';
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

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

  // useEffect(() => {
  //   console.log("📩 invitationTimes 상태 업데이트:", invitationTimes);
  // }, [invitationTimes]);

  // useEffect(() => {
  //   console.log("📁 portfolioDate 상태 업데이트:", portfolioDate);
  // }, [portfolioDate]);

  // useEffect(() => {
  //   console.log("📅 interviewSchedule 상태 업데이트:", interviewSchedule);
  // }, [interviewSchedule]);

  useEffect(() => {
  }, [interviewVideoUrl]);

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



  const prev = () => setCurrentIdx(idx => (idx === 0 ? numPages - 1 : idx - 1));
  const next = () => setCurrentIdx(idx => (idx === numPages - 1 ? 0 : idx + 1));
  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // 면접초대 버튼 클릭시
  const handleInterviewInvitation = async () => {
    if (!jobCandidateId) {
      alert('후보자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
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
        alert('면접 초대가 성공적으로 처리되었습니다!');
        // 로컬 상태 업데이트: 2y -> 2p로 변경
        setLocalStage('2p');
      } else {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        alert(`면접 초대 처리 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('면접 초대 API 호출 오류:', error);
      alert('면접 초대 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 닫기버튼 클릭시
  const handleClose = () => {
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
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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
      window.alert('이 후보자의 포트폴리오 매칭 결과가 아직 준비되지 않았습니다.');
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
          <div className="text-gray-400 font-medium">미제출</div>
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
          <span className="font-semibold text-gray-700">포트폴리오 분석점수</span>
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
          <div className="text-gray-400 font-medium">미제출</div>
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
          <span className="font-semibold text-gray-700">면접 분석점수</span>
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
          <div className="text-gray-400 font-medium">미응시</div>
        )}
      </div>
    );
  };

  if (!isOpen || !candidate) return null;

  // 날짜 포맷 함수 (연. 월. 일. 오전/오후 시:분:초)
  function formatKoreanDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hour = date.getHours();
    const minute = date.getMinutes();
    const isPM = hour >= 12;
    const ampm = isPM ? '오후' : '오전';
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
        aria-label="후보자 상세 정보"
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
                    alt={`${candidate.githubLogin}의 프로필`}
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
              <span className="text-sm text-gray-500">아이디</span>
              <div className="font-semibold text-lg">{candidate.githubLogin}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">이메일</span>
              <div className="font-semibold text-lg">{candidate.candidateEmail}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">포트폴리오 제출</span>
              <div className="font-semibold text-lg">{formatKoreanDateTime(portfolioDate)}</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">면접 일정</span>
              <div className="font-semibold text-lg">{formatKoreanDateTime(interviewSchedule?.aiInterviewScheduledTime)}</div>
            </div>
          </div>
        </div>

        {/* 중간: 점수 카드 3개 */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <ScoreCard
            title="Github 분석점수"
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

        {/* 하단: 포트폴리오 미리보기 (확대) */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-inner">
          <h4 className="font-bold text-lg mb-4 text-emerald-700">📄 포트폴리오 미리보기</h4>
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
                <div className="text-lg font-semibold mb-2 text-gray-500">아직 제출된 포트폴리오가 없습니다.</div>
                <div className="text-sm text-gray-400">포트폴리오를 제출하면 이곳에서 미리보기가 가능합니다.</div>
              </div>
            )}
            {/* 다음(>) 버튼 */}
            <button
              onClick={next}
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
              <span className="font-medium text-gray-700">포트폴리오 분석결과</span>
            </button>
            {portfolioAnalysisOpen && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                {portfolioAnalysis ? (
                  <AIAnalysisSummary
                    analysis={portfolioAnalysis}
                    score={portfolioAnalysis.analysisScore}
                    title="포트폴리오 근거 기반 분석"
                  />
                ) : (
                  <div className="text-gray-400">분석 결과가 없습니다.</div>
                )}
              </div>
            )}
          </div>
          {interviewAnalysis && (
            <div className="mt-6 rounded-xl border border-violet-100 bg-violet-50/40 p-4">
              <AIAnalysisSummary
                analysis={interviewAnalysis}
                score={interviewAnalysis.analysisScore}
                title="면접 답변 근거·일관성 분석"
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
              매칭 상세보기
            </button>
          )}
          { ["2y"].includes(localStage) && (
            <button
              onClick={handleInterviewInvitation}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              면접초대
            </button>
          )}
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

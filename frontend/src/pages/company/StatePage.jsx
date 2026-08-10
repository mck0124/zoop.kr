import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CompanySidebar from '../../components/CompanySidebar';
import CandidateModal from '../../components/CandidateModal';
import SEO from '../../components/SEO';
import AIAnalysisSummary from '../../components/AIAnalysisSummary';
import { apiUrl } from '../../api/config';

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

export default function StatePage() {
  const { postId } = useParams();
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState('All');
  const resultsPerPage = 6;
  const [sending, setSending] = useState(false);
  const [companyAdminId, setCompanyAdminId] = useState(0);
  const [pageFeedback, setPageFeedback] = useState({ type: '', message: '' });

  /**모달을 위한 상태, 핸들러함수*/
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleDetail = async (r) => {
    setSelectedCandidate(r);
    setModalOpen(true);

    // job_cand_curr_stage가 특정 값인 경우에만 파일 경로 요청
    const stagesNeedingFile = ['2y', '3n', '3y', '4n', '4y'];
    if (stagesNeedingFile.includes(r.jobCandCurrStage)) {
      try {
        const res = await fetch(apiUrl(`/api/portfolios/${r.jobCandidateId}/file-path`));
        if (!res.ok) throw new Error("포트폴리오 경로 요청 실패");
        const data = await res.json();         // 👈 JSON으로 받아야 함     
        const filePath = data.filePath;        // 👈 실제 경로 추출
        setSelectedCandidate((prev) => ({ ...prev, filePath })); // 기존 r에 filePath 추가
      } catch (err) {
        console.error("파일 경로 불러오기 오류:", err);
      }
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCandidate(null);
  };

  useEffect(() => {
    fetch(apiUrl(`/api/github-search/${postId}/states`))
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        return res;
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSearchResults(data);
        if (data.length > 0 && data[0].companyAdminId) {
          setCompanyAdminId(data[0].companyAdminId);
        }
  })
  .catch((err) => {
    console.error('❌ 데이터 불러오기 실패:', err);
    setSearchResults([]);
    setPageFeedback({ type: 'error', message: err.message || 'Could not load candidate status.' });
  });
  }, [postId]);

  const handleCheck = (login) => {
    setSelected((prev) =>
      prev.includes(login) ? prev.filter((id) => id !== login) : [...prev, login]
    );
  };

  /**
   * 메일 보내기
   */
  const handleSendEmail = async () => {
    const targets = searchResults.filter(r => selected.includes(r.githubLogin) && r.candidateEmail);
    if (targets.length === 0) {
      setPageFeedback({ type: 'error', message: 'Select at least one candidate with contact information.' });
      return;
    }
    setSending(true); // 👉 버튼 비활성화 시작

    const payloads = targets.map(candidate => ({
      postId: parseInt(postId),
      githubLogin: candidate.githubLogin,
      companyAdminId,
      candidateEmail: candidate.candidateEmail,
    }));

    try {
      const res = await fetch(apiUrl('/api/invitations/send-multiple'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify(payloads),
      });

      if (res.ok) {
        setPageFeedback({ type: 'success', message: `Email sent successfully to ${targets.length} candidate${targets.length === 1 ? '' : 's'}.` });
        setSelected([]);
      } else {
        setPageFeedback({ type: 'error', message: 'Email delivery failed. Please review the selected candidates and try again.' });
      }
    } catch (err) {
      console.error("메일 전송 오류:", err);
      setPageFeedback({ type: 'error', message: 'A server error prevented delivery. Please try again.' });
    } finally {
      setSending(false); // 👉 버튼 다시 활성화
    }
  };

  const getStageLabel = (code) => {
    switch (code) {
      case '1n': return 'Filtered';
      case '2n': return 'Invitation sent';
      case '2y': return 'Responded';
      case '3n': return 'Interview scheduled';
      case '3y': return 'Interview completed';
      case '4n': return 'Rejected';
      case '4y': return 'Hired';
      default: return 'Filtered';
    }
  };

  const filteredResults = searchResults.filter((r) => {
    if (tab === 'All') return true;
    if (tab === 'Responded') return r.jobCandCurrStage === '2y';
    if (tab === 'Interview scheduled') return r.jobCandCurrStage === '3n';
    if (tab === 'Interview completed') {
      return ['3y', '4n', '4y'].includes(r.jobCandCurrStage);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const currentResults = filteredResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const tabs = ['All', 'Responded', 'Interview scheduled', 'Interview completed'];

  return (
    <div className="min-h-screen bg-emerald-50 pt-20">
      <Navbar />
      <SEO
        title={`Candidate status for job ${postId}`}
        description={`Review candidate status and send invitations for job ${postId}.`}
        keywords={`${postId}, candidate status, hiring`}
      />
      <div className="flex">
        <CompanySidebar />
        <div className="flex-1 p-10 font-sans">
          <h1 className="text-3xl font-bold mb-8 text-emerald-700">📊 Candidate status</h1>
          {pageFeedback.message && (
            <div
              role={pageFeedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm font-medium ${pageFeedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
            >
              <span>{pageFeedback.message}</span>
              <button type="button" onClick={() => setPageFeedback({ type: '', message: '' })} aria-label="Dismiss notification" className="text-lg leading-none">×</button>
            </div>
          )}

          {/* 탭 UI */}
          <div className="flex space-x-4 mb-8">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => { setTab(t); setCurrentPage(1); setSelected([]); }}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-150 border-2 ${
                  tab === t
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-700 border-green-600 hover:bg-emerald-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentResults.map((r, i) => (
              <div key={i} className="relative bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col justify-between">
                {tab === 'All' && (
                  <div className="absolute top-3 right-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.githubLogin)}
                      onChange={() => handleCheck(r.githubLogin)}
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-800 mb-2">👤 {r.githubLogin}</h3>

                <div className="text-sm text-gray-700 flex flex-col gap-2">
                  <div>
                    <span className="font-semibold text-emerald-700">Score:</span> {r.githubAnalysisScore}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-emerald-700">Analysis:</span>
                    <div className="mt-2">
                      <AIAnalysisSummary
                        analysis={{ analysisData: r.analysisData }}
                        score={r.githubAnalysisScore}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700">Status:</span> {getStageLabel(r.jobCandCurrStage)}
                  </div>
                </div>

                <button
                  onClick={() => handleDetail(r)}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 px-4 rounded-md text-sm self-end"
                >
                  View details
                </button>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-4 text-sm text-gray-700">
              <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                ◀ Previous
              </button>
              <span className="px-4 py-1">{currentPage} / {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                Next ▶
              </button>
            </div>
          )}

          {/* 이메일 보내기 버튼 */}
          {tab === 'All' && selected.length > 0 && (
            <div className="mt-8 text-right">
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className={`relative flex items-center justify-center min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-md transition-opacity duration-200 ${
                  sending ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {/* 스피너가 있을 때 */}
                {sending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    ✉ Send email ({selected.length})
                    {/* 전송 중일 때도 공간을 차지하도록 invisible 처리 */}
                    <span className="invisible absolute">Sending...</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CandidateModal 컴포넌트 */}
      {isModalOpen && selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

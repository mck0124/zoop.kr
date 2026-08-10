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
  const [tab, setTab] = useState('전체');
  const resultsPerPage = 6;
  const [sending, setSending] = useState(false);
  const [companyAdminId, setCompanyAdminId] = useState(0);

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
      alert('연락 가능한 후보자를 한 명 이상 선택해주세요.');
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
        },
        body: JSON.stringify(payloads),
      });

      if (res.ok) {
        alert("📨 메일을 성공적으로 보냈습니다.");
      } else {
        alert("❌ 메일 전송 실패");
      }
    } catch (err) {
      console.error("메일 전송 오류:", err);
      alert("⚠️ 서버 오류로 전송에 실패했습니다.");
    } finally {
      setSending(false); // 👉 버튼 다시 활성화
    }
  };

  const getStageLabel = (code) => {
    switch (code) {
      case '1n': return '필터링';
      case '2n': return '메일발송';
      case '2y': return '회신';
      case '3n': return '면접 예정자';
      case '3y': return '면접 완료자';
      case '4n': return '불합격';
      case '4y': return '합격';
      default: return '필터링';
    }
  };

  const filteredResults = searchResults.filter((r) => {
    if (tab === '전체') return true;
    if (tab === '회신자') return r.jobCandCurrStage === '2y';
    if (tab === '면접 예정자') return r.jobCandCurrStage === '3n';
    if (tab === '면접 완료자') {
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

  const tabs = ['전체', '회신자', '면접 예정자', '면접 완료자'];

  return (
    <div className="min-h-screen bg-emerald-50 pt-20">
      <Navbar />
      <SEO
        title={`${postId} 후보자 상태`}
        description={`${postId} 후보자의 상태를 확인하고 이메일을 보낼 수 있습니다.`}
        keywords={`${postId}, 후보자 상태, 이메일 보내기, 채용 관리`}
      />
      <div className="flex">
        <CompanySidebar />
        <div className="flex-1 p-10 font-sans">
          <h1 className="text-3xl font-bold mb-8 text-emerald-700">📊 후보자 상태</h1>

          {/* 탭 UI */}
          <div className="flex space-x-4 mb-8">
            {tabs.map((t) => (
              <button
                key={t}
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
                {tab === '전체' && (
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
                    <span className="font-semibold text-emerald-700">점수:</span> {r.githubAnalysisScore}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-emerald-700">분석:</span>
                    <div className="mt-2">
                      <AIAnalysisSummary
                        analysis={{ analysisData: r.analysisData }}
                        score={r.githubAnalysisScore}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700">상태:</span> {getStageLabel(r.jobCandCurrStage)}
                  </div>
                </div>

                <button
                  onClick={() => handleDetail(r)}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 px-4 rounded-md text-sm self-end"
                >
                  상세보기
                </button>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-4 text-sm text-gray-700">
              <button onClick={prevPage} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                ◀ 이전
              </button>
              <span className="px-4 py-1">{currentPage} / {totalPages}</span>
              <button onClick={nextPage} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">
                다음 ▶
              </button>
            </div>
          )}

          {/* 이메일 보내기 버튼 */}
          {tab === '전체' && selected.length > 0 && (
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
                    전송 중...
                  </>
                ) : (
                  <>
                    ✉ 이메일 보내기 ({selected.length}명)
                    {/* 전송 중일 때도 공간을 차지하도록 invisible 처리 */}
                    <span className="invisible absolute">전송 중...</span>
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

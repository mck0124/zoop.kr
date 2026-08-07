import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IdealCandidateChatbot from "../../components/IdealCandidateChatbot";
import IdealCandidateCard from "../../components/IdealCandidateCard";
import Navbar from "../../components/Navbar";
import SEO from "../../components/SEO";
import { apiUrl } from "../../api/config";
import { useLanguage } from "../../context/LanguageContext";

export default function IdealCandidate() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { postId } = useParams();
  const [summary, setSummary] = useState("");
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [redoHistory, setRedoHistory] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  
  // location.state에서 headcount를 더 강력하게 추출
  const locationState = location.state || {};
  const filtersFromState = locationState.filters || {};
  const headcount = filtersFromState.headcount || locationState.headcount || 5;
  
  const filters = { 
    ...locationState,
    ...filtersFromState,
    postId: parseInt(postId),
    headcount: headcount // 명시적으로 headcount 설정
  };

  // 더 연하고 은은한 네온 호버 효과 스타일
  const neonBoxShadow = '0 0 0 2px #19e3a355, 0 2px 12px #19e3a333';

  const loadingMessages = ["인재상과 채용 조건을 확인하는 중입니다..."];

  useEffect(() => {
    const globalChatbotBtn = document.querySelector('.chatbot-mint-btn');
    const globalChatbot = document.querySelector('.chatbot-container');
    if (globalChatbotBtn) globalChatbotBtn.style.display = 'none';
    if (globalChatbot) globalChatbot.style.display = 'none';
    return () => {
      if (globalChatbotBtn) globalChatbotBtn.style.display = 'block';
      if (globalChatbot) globalChatbot.style.display = 'block';
    };
  }, []);

  const analysisStarted = useRef(false); // 중복 분석 방지

  const handleFinish = async () => {
    if (loading || analysisStarted.current) return; // 이미 실행 중이면 중복 실행 방지
    setLoading(true);
    analysisStarted.current = true;
    if (!filters.postId) {
      alert("공고 ID가 없습니다. 다시 시도해주세요.");
      setLoading(false);
      analysisStarted.current = false;
      return;
    }
    if (!summary.trim()) {
      alert("인재상을 작성해주세요.");
      setLoading(false);
      analysisStarted.current = false;
      return;
    }
    setLoadingProgress(0);
    setLoadingMessage(loadingMessages[0]);
    setCurrentStep(0);
    const abortController = new AbortController();
    try {
      // 1. 먼저 인재상을 공고에 저장
      const idealCandidateResponse = await fetch(apiUrl(`/api/postings/${filters.postId}/ideal-candidate`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idealCandidate: summary }),
        signal: abortController.signal
      });
      
      if (!idealCandidateResponse.ok) {
        const errorText = await idealCandidateResponse.text();
        setLoading(false);
        analysisStarted.current = false;
        throw new Error('인재상 저장에 실패했습니다 (경로: /api/postings/' + filters.postId + '/ideal-candidate): ' + errorText);
      }
      setLoadingProgress(35);
      setCurrentStep(2);
      setLoadingMessage("인재상 저장 완료 — 공개 기술 근거를 수집하는 중입니다...");

      // 2. Spring Boot API를 통해 GitHub 검색 실행 (DB 저장 포함)
      const searchPayload = {
        postId: filters.postId,
        languages: filters.languages,
        regions: filters.regions,
        nationwide: filters.nationwide,
        headcount: filters.headcount,
        idealCandidate: summary,
        language
      };
      const searchResponse = await fetch(apiUrl("/api/github-search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
        signal: abortController.signal
      });
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        setLoading(false);
        analysisStarted.current = false;
        throw new Error(`GitHub 검색 실패: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
      }
      setLoadingProgress(90);
      setCurrentStep(5);
      setLoadingMessage("공개 근거 수집 완료 — 후보자별 분석 결과를 정리하는 중입니다...");
      
      // Spring Boot API는 성공 메시지만 반환하므로, 후보자 데이터는 CandidateList에서 DB에서 조회
      // 로딩 완료
      navigate(`/company/candidates/${filters.postId}`, {
        state: { ...filters, idealCandidate: summary },
      });
      setLoadingProgress(100);
      setLoadingMessage("완료! 후보자 목록으로 이동합니다...");
      setLoading(false);
      analysisStarted.current = false;
      
    } catch (e) {
      // 로딩 중단
      setLoading(false);
      analysisStarted.current = false;
      alert(`처리 중 오류 발생: ${e.message}`);
    }
  };

  // 챗봇의 업데이트 콜백
  const handleChatbotUpdate = (data) => {
    if (data.summary) {
      setSummaryHistory(prev => [...prev, summary]);
      setSummary(data.summary);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <SEO
        title={`${filters.postId ? `회사 공고 ${filters.postId}번 인재상 작성` : '인재상 작성'}`}
        description={`${filters.postId ? `회사 공고 ${filters.postId}번 인재상을 작성하고, 해당 공고에 맞는 개발자를 찾습니다.` : '인재상을 작성하고, 해당 공고에 맞는 개발자를 찾습니다.'}`}
        keywords={`${filters.postId ? `회사 공고 ${filters.postId}번 인재상, 개발자 채용, 후보자 찾기` : '인재상 작성, 개발자 채용, 후보자 찾기'}`}
      />
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        minHeight: "calc(100vh - 80px)",
        height: "calc(100vh - 80px)",
        background: "#fff"
      }}>
        {/* 챗봇 박스 */}
        <div style={{
          width: 560,
          height: "80vh",
          minHeight: 540,
          borderRadius: 26,
          border: "1.5px solid #d2f6ea",
          background: "#fff",
          boxShadow: "0 8px 32px #80e9cb22",
          marginRight: 52,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <IdealCandidateChatbot
            recruitFilters={filters}
            onIdealCandidateUpdate={handleChatbotUpdate}
            style={{ flex: 1, width: "100%" }}
          />
        </div>
        {/* 요약/양식 박스 */}
        <div style={{
          width: 560,
          height: "80vh",
          minHeight: 540,
          borderRadius: 26,
          border: "1.5px solid #d2f6ea",
          background: "#fff",
          boxShadow: "0 8px 32px #80e9cb22",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "visible",
          padding: "1.5rem",
          position: "relative",
          justifyContent: "flex-start"
        }}>
          {/* 카드 내부 좌측 상단 뒤로/앞으로 가기 버튼 */}
          <div style={{ position: "absolute", top: 18, left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 11, pointerEvents: 'none' }}>
            {/* 좌측: undo/redo */}
            <div style={{ display: 'flex', gap: 14, marginLeft: 18, pointerEvents: 'auto' }}>
              {/* 뒤로가기 */}
              <button
                onClick={() => {
                  if (summaryHistory.length > 0) {
                    setRedoHistory(r => [...r, summary]);
                    setSummary(prev => {
                      const prevSummary = summaryHistory[summaryHistory.length - 1];
                      setSummaryHistory(h => h.slice(0, h.length - 1));
                      return prevSummary;
                    });
                  }
                }}
                disabled={summaryHistory.length === 0}
                onMouseOver={e => e.currentTarget.style.boxShadow = neonBoxShadow}
                onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 10px #3be0a02b"}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: summaryHistory.length > 0 ? "#fff" : "#f3f3f3",
                  border: "1.6px solid #e5f7f1",
                  boxShadow: "0 2px 10px #3be0a02b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: summaryHistory.length > 0 ? "pointer" : "not-allowed",
                  zIndex: 11
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15.5 19l-7-7 7-7" stroke="#19e3a3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {/* 앞으로가기 */}
              <button
                onClick={() => {
                  if (redoHistory.length > 0) {
                    setSummaryHistory(h => [...h, summary]);
                    setSummary(redoHistory[redoHistory.length - 1]);
                    setRedoHistory(r => r.slice(0, r.length - 1));
                  }
                }}
                disabled={redoHistory.length === 0}
                onMouseOver={e => e.currentTarget.style.boxShadow = neonBoxShadow}
                onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 10px #3be0a02b"}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: redoHistory.length > 0 ? "#fff" : "#f3f3f3",
                  border: "1.6px solid #e5f7f1",
                  boxShadow: "0 2px 10px #3be0a02b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: redoHistory.length > 0 ? "pointer" : "not-allowed",
                  zIndex: 11
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M8.5 5l7 7-7 7" stroke="#19e3a3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            {/* 우측: 연필(수정) 버튼 */}
            <div style={{ marginRight: 18, pointerEvents: 'auto' }}>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  onMouseOver={e => e.currentTarget.style.boxShadow = neonBoxShadow}
                  onMouseOut={e => e.currentTarget.style.boxShadow = "0 2px 10px #3be0a02b"}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "1.6px solid #e5f7f1",
                    boxShadow: "0 2px 10px #3be0a02b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 11
                  }}
                >
                  {/* 연필 아이콘 */}
                  <svg height="21" width="21" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#19e3a3"/>
                    <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#19e3a3"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          {/* 상단: IdealCandidateCard 컴포넌트 사용 (스크롤 가능) */}
          <div style={{ 
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            width: "100%",
            padding: "0",
            boxSizing: "border-box",
            position: "relative"
          }}>
            <IdealCandidateCard
              summary={summary}
              onEditSummary={newSummary => setSummary(newSummary)}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              forceCleanSummary={isEditing}
            />
            {/* 스크롤을 더 할 수 있도록 하단 공백 */}
            <div style={{ height: "120px" }} />
          </div>
          {/* 하단: 완료 버튼 (항상 떠있게) */}
          {!isEditing && (
            <button
              onClick={handleFinish}
              disabled={loading}
              style={{
                position: "absolute",
                left: "50%",
                bottom: "2.2rem",
                transform: "translateX(-50%)",
                background: "linear-gradient(90deg,#19e3a3 35%,#39e0ca 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 22,
                padding: "1.08rem 3rem",
                fontWeight: 700,
                fontSize: "1.11rem",
                cursor: "pointer",
                boxShadow: "0 2px 12px #18d1a021",
                letterSpacing: "0.01em",
                transition: "all 0.16s",
                zIndex: 10
              }}
              onMouseOver={e => {
                e.target.style.background = "#1ed18a";
                e.target.style.transform = "translateX(-50%) translateY(-2px)";
              }}
              onMouseOut={e => {
                e.target.style.background = "linear-gradient(90deg,#19e3a3 35%,#39e0ca 100%)";
                e.target.style.transform = "translateX(-50%) translateY(0)";
              }}
            >
              완료
            </button>
          )}
        </div>
      </div>
      {/* 로딩 오버레이 */}
      {loading && (
        <div style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #fff 0%, #f8fffe 100%)",
            padding: "3rem 2.5rem",
            borderRadius: "24px",
            minWidth: 450,
            boxShadow: "0 20px 60px rgba(30, 225, 174, 0.15), 0 8px 32px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "1px solid rgba(30, 225, 174, 0.1)"
          }}>
            {/* AI 아이콘 */}
            <div style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #30c59b 0%, #6be8c8 100%)",
              margin: "0 auto 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(48, 197, 155, 0.3)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div style={{ 
              marginBottom: 20, 
              fontWeight: 700, 
              fontSize: 20, 
              color: "#1a1a1a",
              lineHeight: 1.4
            }}>
              {loadingMessage}
            </div>
            
            {/* 진행 단계 표시 */}
            <div style={{ 
              marginBottom: 20, 
              fontSize: 14, 
              color: '#30c59b', 
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              gap: '12px'
            }}>
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: currentStep >= step ? 'linear-gradient(135deg, #30c59b 0%, #6be8c8 100%)' : '#e5e7ea',
                  transition: 'all 0.4s ease',
                  boxShadow: currentStep >= step ? '0 2px 8px rgba(48, 197, 155, 0.3)' : 'none',
                  transform: currentStep >= step ? 'scale(1.2)' : 'scale(1)'
                }} />
              ))}
            </div>
            
            {/* 진행률 바 */}
            <div style={{
              width: '100%',
              background: '#f0f2f3',
              borderRadius: '12px',
              height: 8,
              overflow: 'hidden',
              marginBottom: 12,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #30c59b 0%, #6be8c8 50%, #30c59b 100%)',
                width: `${loadingProgress}%`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(48, 197, 155, 0.3)'
              }} />
            </div>
            
            {/* 진행률 퍼센트 */}
            <div style={{ 
              fontSize: 16, 
              color: '#30c59b', 
              fontWeight: 700, 
              marginBottom: 12 
            }}>
              {Math.round(loadingProgress)}%
            </div>
            
            {/* 인원수 정보 */}
            <div style={{ 
              fontSize: 14, 
              color: '#666', 
              fontWeight: 500 
            }}>
              {filters.headcount || headcount || 5}명의 후보자를 분석 중입니다...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

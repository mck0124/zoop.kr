import React, { useState, useEffect } from 'react';
import { apiUrl } from '../api/config';

const InterviewPreparationModal = ({ isOpen, onClose, postId, candidateId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseQuestion = (question) => {
    const match = String(question || '').match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    return {
      category: match?.[1] || '면접 준비',
      text: match?.[2] || String(question || ''),
    };
  };

  const categoryStyle = (category) => {
    if (category.includes('근거')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (category.includes('기술')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (category.includes('문제')) return 'bg-violet-100 text-violet-700 border-violet-200';
    if (category.includes('협업')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // 면접 예상질문 API 호출
  const fetchInterviewQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        apiUrl(`/api/interview-questions/generate/${postId}/${candidateId}`),
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        throw new Error('면접 예상질문을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('면접 예상질문 API 오류:', err);
      setError(err.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 질문 가져오기
  useEffect(() => {
    if (isOpen && postId && candidateId) {
      fetchInterviewQuestions();
    }
    // The fetch action intentionally remains stable for the modal lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId, candidateId]);

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // SVG ICONS
  const LightbulbIcon = () => (
    <svg width="22" height="22" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.3.3.5.7.5 1.1V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.9c0-.4.2-.8.5-1.1A7 7 0 0 0 12 2z" />
    </svg>
  );
  const AlertIcon = () => (
    <svg width="20" height="20" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
  const CheckCircleIcon = () => (
    <svg width="20" height="20" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 12 15 17 10"/>
    </svg>
  );
  const ThumbsUpIcon = () => (
    <svg width="20" height="20" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
      <path d="M5 15h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z"/>
    </svg>
  );
  const CloseIcon = () => (
    <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4" style={{ animation: 'fadeIn 0.3s', borderRadius: 28 }}>
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all" style={{ border: '1.5px solid #fbbf24', boxShadow: '0 8px 32px #fbbf2422', borderRadius: 28, padding: 0 }}>
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 px-8 py-5" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 헤더 아이콘 */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white bg-opacity-20">
                  <LightbulbIcon />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">면접 예상질문</h3>
                  <p className="text-yellow-100 text-sm">면접 준비를 위한 맞춤형 질문들</p>
                </div>
              </div>
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white bg-opacity-30 text-white hover:bg-opacity-50 transition-colors"
                style={{ fontWeight: 700, fontSize: 22 }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* 컨텐츠 */}
          <div className="max-h-96 overflow-y-auto px-8 py-6" style={{ background: '#fff', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
            {loading ? (
              // 로딩 상태
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-gray-600 text-center">
                  맞춤형 면접 예상질문을 생성중입니다...<br/>
                  <span className="text-sm text-gray-500">잠시만 기다려주세요.</span>
                </p>
              </div>
            ) : error ? (
              // 에러 상태: 생성되지 않은 질문을 AI 결과처럼 표시하지 않는다.
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  {/* 에러 상태 아이콘 */}
                  <span><AlertIcon /></span>
                  <p className="text-amber-700 text-sm">
                    맞춤 질문을 생성하지 못했습니다. 현재 결과를 임의의 질문으로 대체하지 않았습니다.
                  </p>
                </div>
                <p className="text-sm text-gray-600">{error}</p>
                <button onClick={fetchInterviewQuestions} className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 px-5 py-2 text-sm font-bold text-white">다시 생성하기</button>
              </div>
            ) : (
              // 정상 상태
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  {/* 정상 상태 아이콘 */}
                  <span><CheckCircleIcon /></span>
                  <p className="text-yellow-700 text-sm">
                    포지션과 제출물의 확인 필요 지점을 연결한 맞춤형 질문입니다. <b>근거검증</b> 질문부터 답변을 준비해 보세요.
                  </p>
                </div>
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    (() => {
                      const parsed = parseQuestion(question);
                      return (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-100 hover:bg-yellow-100 transition-all duration-200"
                      style={{ boxShadow: '0 2px 8px #fbbf2411', cursor: 'pointer' }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <span className={`mb-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${categoryStyle(parsed.category)}`}>
                          {parsed.category}
                        </span>
                        <p className="text-gray-800 leading-relaxed">{parsed.text}</p>
                      </div>
                    </div>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="bg-gray-50 px-8 py-5" style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {/* 푸터 아이콘 */}
                <span><ThumbsUpIcon /></span>
                <span>면접 준비 화이팅!</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 px-7 py-2 text-sm font-bold text-white hover:from-yellow-500 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 transition-all duration-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPreparationModal;

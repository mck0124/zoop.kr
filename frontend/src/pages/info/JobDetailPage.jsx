import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import CompanyInfoCard from './CompanyInfoCard';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { apiUrl, MATCHING_API_URL } from '../../api/config';

function JobDetailPage() {
  const { postId } = useParams();
  const { authState, setAuthState, bookmarkedPostIds, toggleBookmark } = useAuth();
  const [post, setPost] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [otherPosts, setOtherPosts] = useState([]);
  const [showPortfolioPopup, setShowPortfolioPopup] = useState(false);
  // 북마크 관련 상태
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  // 기존 포트폴리오 관련 상태
  const [existingPortfolio, setExistingPortfolio] = useState(null);
  const [useExistingPortfolio, setUseExistingPortfolio] = useState(false);
  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    loginId: '',
    password: '',
    userType: 'candidate'
  });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const location = useLocation();
  const fromMatchingTab = location.state?.fromMatchingTab;
  // 매칭탭에서 전달된 정보 (예: portfolioId, analysisId)
  const matchingPortfolioId = location.state?.portfolioId;
  const matchingAnalysisId = location.state?.analysisId;

  // 매칭탭에서만 보여줄 상태
  const [matchingAnalysis, setMatchingAnalysis] = useState(null);
  const [matchingScore, setMatchingScore] = useState(null);
  const [matchingReason, setMatchingReason] = useState('');
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState('');

  // Fetch post, company, portfolios
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/postings/info/${postId}`));
        if (!res.ok) throw new Error('We could not load this job posting.');
        const postData = await res.json();
        setPost(postData);

        if (postData.companyId) {
          const companyRes = await fetch(apiUrl(`/api/companies/${postData.companyId}`));
          if (companyRes.ok) {
            const companyData = await companyRes.json();
            setCompany(companyData);
          }
        }

        const candidateId = localStorage.getItem('userId');
        if (candidateId) {
          const pfRes = await fetch(apiUrl(`/api/portfolios/candidate/${candidateId}?postId=${postId}`));
          if (pfRes.ok) {
            const portfolios = await pfRes.json();
            // 해당 공고에 대한 지원 여부 확인 (포트폴리오가 있으면 지원한 것으로 간주)
            setHasApplied(portfolios.length > 0);
          }
          
          // 기존 포트폴리오 조회 (최근 업로드된 것)
          const recentPfRes = await fetch(apiUrl(`/api/portfolios/recent/${candidateId}`));
          if (recentPfRes.ok) {
            const recentPortfolio = await recentPfRes.json();
            if (recentPortfolio.hasPortfolio) {
              setExistingPortfolio(recentPortfolio);
              setUseExistingPortfolio(true); // 기본적으로 기존 포트폴리오 사용
            }
          }

        }
      } catch (e) {
      console.warn("Job posting fetch warning:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [postId]);

  // Sticky bar on scroll
  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch other posts
  useEffect(() => {
    if (!post?.companyId) return;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/postings?companyId=${post.companyId}`));
        if (res.ok) {
          const data = await res.json();
          setOtherPosts(
            data.filter(p => p.postId !== post.postId).slice(0, 5)
          );
        }
      } catch {}
    })();
  }, [post]);

  // 로그인 폼 입력 핸들러
  const handleLoginInput = e => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.loginId || !loginForm.password) {
      setLoginError('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        loginId: loginForm.loginId,
        password: loginForm.password,
        userType: loginForm.userType
      });
      const { token, userId, userType, loginId } = response.data;
      if (token) {
        // AuthContext 상태 업데이트
        setAuthState({
          token,
          userId,
          userType,
          loginId
        });
        // localStorage 업데이트
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userType', userType);
        localStorage.setItem('userId', userId);
        localStorage.setItem('loginId', loginId);
        // 로그인 폼 초기화
        setLoginForm({
          loginId: '',
          password: '',
          userType: 'candidate'
        });
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoggingIn(false);
    }
  };

  // 입사지원 시 개인정보도 함께 저장
  const handleUpload = async () => {
    if (!selectedFile && !useExistingPortfolio) {
      setUploadError('업로드할 파일을 선택하거나 기존 포트폴리오를 사용하세요.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const candidateId = authState.userId;
      if (!candidateId) throw new Error('로그인 정보가 없습니다.');
      const formData = new FormData();
      
      if (useExistingPortfolio && existingPortfolio) {
        // 기존 포트폴리오 사용 시
        formData.append('useExistingPortfolio', 'true');
        formData.append('existingPortfolioPath', existingPortfolio.portfolioFilePath);
        formData.append('portfolioFile', ''); // 빈 파일
      } else if (selectedFile) {
        // 새 파일 업로드 시
        formData.append('useExistingPortfolio', 'false');
        formData.append('portfolioFile', selectedFile);
      }
      
      formData.append('postId', postId);
      formData.append('candidateId', candidateId);
      
      // 백엔드에서 요구하는 필수 파라미터들을 기본값으로 추가
      formData.append('portfolioContent', '포트폴리오 파일 업로드');
      formData.append('portfolioUrl', '');
      formData.append('careerData', JSON.stringify({
        workExperiences: [],
        educations: [],
        skills: [],
        certifications: []
      }));
      formData.append('goalStatement', '입사 지원');
      formData.append('suitabilityStatement', '포트폴리오 제출');
      formData.append('agreeRequiredPersonal', 'true');
      formData.append('agreeOptionalPersonal', 'false');
      formData.append('agreeFutureProposals', 'false');
      formData.append('agreeReceiveRecruitmentInfo', 'false');
      // source 파라미터 추가
      formData.append('source', 'apply');

      const pfRes = await fetch(apiUrl('/api/portfolios'), {
        method: 'POST',
        body: formData
      });
      
      if (!pfRes.ok) {
        const errorText = await pfRes.text();
        
        // 파일 크기 초과 에러 처리 (413 Payload Too Large)
        if (pfRes.status === 413 || errorText.includes('파일 크기가 너무 큽니다') || errorText.includes('Maximum upload size exceeded')) {
          throw new Error('파일 크기가 너무 큽니다. 5MB 이하의 파일을 업로드해주세요.');
        }
        
        // 기타 에러 처리
        if (pfRes.status === 400) {
          throw new Error('잘못된 파일 형식입니다. PDF, DOC, DOCX, TXT, ZIP, RAR 파일만 업로드 가능합니다.');
        }
        
        if (pfRes.status === 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        
        // 백엔드에서 반환된 에러 메시지가 있으면 사용
        if (errorText && errorText.trim() !== '') {
          throw new Error(errorText);
        }
        
        throw new Error('파일 업로드에 실패했습니다. 다시 시도해주세요.');
      }

      // Refresh list
      const pfListRes = await fetch(apiUrl(`/api/portfolios/candidate/${candidateId}?postId=${postId}`));
      if (pfListRes.ok) {
        const portfolios = await pfListRes.json();
        setHasApplied(portfolios.length > 0);
      }
      setSelectedFile(null);
      setUseExistingPortfolio(false);
      setShowPortfolioPopup(false);
      // 지원 완료 메시지를 더 나은 방식으로 표시
      const successMessage = document.createElement('div');
      successMessage.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          z-index: 10000;
          text-align: center;
          min-width: 300px;
        ">
          <div style="
            color: #30c59b;
            font-size: 2rem;
            margin-bottom: 1rem;
          ">✓</div>
          <div style="
            color: #333;
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          ">입사지원이 완료되었습니다!</div>
          <div style="
            color: #666;
            font-size: 0.9rem;
          ">지원서가 성공적으로 제출되었습니다.</div>
        </div>
      `;
      document.body.appendChild(successMessage);
      
      // 3초 후 메시지 제거
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    } catch (e) {
      // 네트워크 연결 오류 처리
      let errorMessage = e.message;
      
      if (e.message === 'Failed to fetch') {
        errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
      } else if (e.message.includes('CORS') || e.message.includes('Access-Control-Allow-Origin')) {
        errorMessage = '서버 연결 설정 오류입니다. 잠시 후 다시 시도해주세요.';
      } else if (e.message.includes('NetworkError') || e.message.includes('network')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
      } else if (e.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 파일 크기를 확인하고 다시 시도해주세요.';
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExistingPortfolio = async () => {
    if (!window.confirm('기존 포트폴리오를 삭제하시겠습니까?')) return;
    try {
      if (existingPortfolio && existingPortfolio.portfolioId) {
        const res = await fetch(apiUrl(`/api/portfolios/${existingPortfolio.portfolioId}`), {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('삭제 실패');
      }
      setExistingPortfolio(null);
      setUseExistingPortfolio(false);
    } catch (e) {
      alert('삭제 중 오류: ' + e.message);
    }
  };

  // 북마크 토글 함수 (전역 상태 사용)
  const handleBookmarkToggle = async () => {
    setBookmarkLoading(true);
    await toggleBookmark(Number(postId));
    setBookmarkLoading(false);
  };

  useEffect(() => {
    if (fromMatchingTab && matchingPortfolioId && matchingAnalysisId) {
      setMatchingLoading(true);
      setMatchingError('');
      // 1. 분석 결과 가져오기 (Spring)
      fetch(apiUrl(`/api/ai-analysis-results/${matchingAnalysisId}`))
        .then(res => res.ok ? res.json() : Promise.reject('분석 결과 조회 실패'))
        .then(data => {
          setMatchingAnalysis(data);
        })
        .catch(e => setMatchingError('분석 결과를 불러오지 못했습니다.'));
      // 2. 매칭 점수/이유 가져오기 (FastAPI)
      const formData = new FormData();
      formData.append('portfolio_id', matchingPortfolioId);
      formData.append('analysis_id', matchingAnalysisId);
        fetch(apiUrl('/match-portfolio-jobs', MATCHING_API_URL), {
        method: 'POST',
        body: formData
      })
        .then(res => res.ok ? res.json() : Promise.reject('매칭 점수 조회 실패'))
        .then(data => {
          if (data.success && data.matches && data.matches.length > 0) {
            const bestMatch = data.matches[0];
            setMatchingScore(bestMatch.matching_score ?? bestMatch.match_score ?? null);
            setMatchingReason(bestMatch.matching_analysis ?? bestMatch.match_reason ?? '');
          } else {
            setMatchingError('매칭 점수/이유를 불러오지 못했습니다.');
          }
        })
        .catch(e => setMatchingError('매칭 점수/이유를 불러오지 못했습니다.'))
        .finally(() => setMatchingLoading(false));
    }
  }, [fromMatchingTab, matchingPortfolioId, matchingAnalysisId]);

  if (loading) return <div style={{ padding: '2rem' }}>불러오는 중...</div>;
  if (error)   return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;
  if (!post)  return <div style={{ padding: '2rem' }}>This job posting could not be found.</div>;

  return (
    <>
      <Navbar />

      {showStickyBar && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%',
          zIndex: 2001,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.7rem 2.5rem',
          borderBottom: '1px solid #eee',
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: '1.18rem',
            color: '#222',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '60vw'
          }}>
            {post.postTitle}
          </div>
          <button
            style={{
              background: hasApplied ? '#e0e0e0' : '#30c59b',
              color: hasApplied ? '#888' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.7rem 2.2rem',
              fontWeight: 700,
              fontSize: '1.08rem',
              cursor: hasApplied ? 'not-allowed' : 'pointer',
              boxShadow: hasApplied ? 'none' : '0 2px 8px rgba(48,197,155,0.08)'
            }}
            onClick={() => !hasApplied && setShowPortfolioPopup(true)}
            disabled={hasApplied}
          >
            {hasApplied ? '이미 지원한 공고' : '입사지원'}
          </button>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '2.5rem',
        maxWidth: 1300,
        margin: '7rem auto 0',
        padding: '2rem 1rem 4rem 1rem',
        minHeight: 'calc(100vh - 80px)',
        boxSizing: 'border-box'
      }}>
        {/* 공고 상세 */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          padding: '2.5rem 3rem',
          maxWidth: 950,
          marginBottom: 32
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            marginBottom: '1.2rem',
            gap: '1.5rem',
          }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
              {post.postTitle}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* 북마크 버튼 */}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '0.5rem',
                  cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
                  color: bookmarkedPostIds.includes(Number(postId)) ? '#30c59b' : '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  opacity: bookmarkLoading ? 0.6 : 1,
                  width: '48px',
                  height: '48px',
                }}
                onClick={handleBookmarkToggle}
                disabled={bookmarkLoading}
                title={bookmarkedPostIds.includes(Number(postId)) ? '북마크 해제' : '북마크 추가'}
              >
                {bookmarkedPostIds.includes(Number(postId)) ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                )}
              </button>
              
              {/* 입사지원 버튼 */}
              <button
                style={{
                  background: hasApplied ? '#e0e0e0' : '#30c59b',
                  color: hasApplied ? '#888' : '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 2.2rem',
                  fontWeight: 700,
                  fontSize: '1.08rem',
                  cursor: hasApplied ? 'not-allowed' : 'pointer',
                  boxShadow: hasApplied ? 'none' : '0 2px 8px rgba(48,197,155,0.08)',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => !hasApplied && setShowPortfolioPopup(true)}
                disabled={hasApplied}
              >
                {hasApplied ? '이미 지원한 공고' : '입사지원'}
              </button>
            </div>
          </div>

          {/* --- Job Info Grid --- */}
          <div style={{
            borderTop: '1px solid #ececec',
            borderBottom: '1px solid #ececec',
            padding: '1.5rem 0',
            marginBottom: '2.2rem',
            marginTop: '0.5rem',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 2.5rem',
              alignItems: 'start',
              fontSize: '1.08rem',
              color: '#222',
            }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#7b858e', minWidth: 56, fontWeight: 500 }}>언어</span>
                  {post.postProgrammingLanguage ? (
                    (() => {
                      const langs = post.postProgrammingLanguage.split(/[,/\s]+/).filter(Boolean);
                      return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {langs.map((lang, idx) => (
                            <span key={lang + idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <img
                                src={process.env.PUBLIC_URL + '/languages/' + lang.toLowerCase() + '.svg'}
                                alt={lang}
                                style={{ width: 28, height: 28, background: 'white', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', padding: 2 }}
                              />
                              <span style={{ color: '#222', fontWeight: 500 }}>{lang}</span>
                            </span>
                          ))}
                        </span>
                      );
                    })()
                  ) : <span style={{ color: '#aaa' }}>-</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#7b858e', minWidth: 56, fontWeight: 500 }}>근무지역</span>
                  <span style={{ color: '#222', fontWeight: 500 }}>{post.postLocation || <span style={{ color: '#aaa' }}>-</span>}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#7b858e', minWidth: 56, fontWeight: 500 }}>모집인원</span>
                  <span style={{ color: '#222', fontWeight: 500 }}>{post.postHeadcount ? `${post.postHeadcount}명` : <span style={{ color: '#aaa' }}>-</span>}</span>
                </div>
              </div>
              {/* Right */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#7b858e', minWidth: 56, fontWeight: 500 }}>급여</span>
                  <span style={{ color: '#222', fontWeight: 500 }}>
                    {post.postSalaryStart && post.postSalaryEnd
                      ? `연봉 ${post.postSalaryStart} ~ ${post.postSalaryEnd} 만원`
                      : <span style={{ color: '#aaa' }}>-</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#7b858e', minWidth: 56, fontWeight: 500 }}>마감일</span>
                  <span style={{ color: '#222', fontWeight: 500 }}>{post.postExpiryDate || <span style={{ color: '#aaa' }}>-</span>}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ margin: '1.5rem 0', color: '#555' }}>
            {post.postDescription}
          </div>

          {/* 기업의 인재상 */}
          <div style={{ fontWeight: 700, fontSize: '1.13rem', color: '#222', margin: '2.2rem 0 0.7rem 0' }}>
            기업의 인재상
          </div>
          <div style={{
            background: '#f8fafd',
            borderRadius: '14px',
            boxShadow: '0 2px 10px rgba(48,197,155,0.07)',
            padding: '1.3rem 1.5rem',
            margin: '0 auto 2.5rem auto',
            fontSize: '1.13rem',
            color: '#222',
            fontWeight: 500,
            border: '1.5px solid #e0f7ef',
            maxWidth: 1100,
            whiteSpace: 'pre-line',
            width: '100%',
          }}>
            {(() => {
              let ideal = post.postIdealCandidate || '해당 공고의 인재상 정보가 없습니다.';
              ideal = ideal.replace(/<EXAMPLES>[\s\S]*?<END>/g, '').trim();
              if (ideal.includes('-')) {
                return ideal.split('-').filter(Boolean).map((line, idx) => {
                  const trimmed = line.trim();
                  const colonIdx = trimmed.indexOf(':');
                  if (colonIdx !== -1) {
                    return (
                      <div key={idx} style={{ marginBottom: '1.6em', lineHeight: 2.2 }}>
                        <span style={{ fontWeight: 700 }}>{trimmed.slice(0, colonIdx + 1)}</span>
                        {trimmed.slice(colonIdx + 1)}
                      </div>
                    );
                  }
                  return <div key={idx} style={{ marginBottom: '1.6em', lineHeight: 2.2 }}>{trimmed}</div>;
                });
              }
              return ideal;
            })()}
          </div>

          {/* 기업정보 */}
          <div style={{ fontWeight: 700, fontSize: '1.13rem', color: '#222', margin: '2.2rem 0 0.7rem 0' }}>
            기업정보
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
            {company && <CompanyInfoCard company={company} />}
          </div>
        </div>

        {/* 사이드바 */}
        <div style={{
          width: 370,
          minWidth: 270,
          background: '#f8fafd',
          borderRadius: 16,
          padding: '1.5rem 1.2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          marginBottom: 32,
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.08rem', color: '#222', marginBottom: '1.2rem' }}>
            이 회사의 다른 공고
          </div>

          {otherPosts.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '0.97rem' }}>
              다른 공고가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {otherPosts.map(p => (
                <div key={p.postId} style={{
                  background: '#fff',
                  border: '1.5px solid #e3e7ee',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: '1.1rem 1.2rem',
                  position: 'relative',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#222', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>{company?.companyName || ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a
                      href={`/job/${p.postId}`}
                      style={{
                        color: '#222',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {p.postTitle}
                    </a>
                  </div>
                  <div style={{ color: '#888', fontSize: '0.97rem', display: 'flex', gap: 8 }}>
                    {p.postLocation && <span>{p.postLocation}</span>}
                    {p.postHeadcount && <span>| {p.postHeadcount}명</span>}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.97rem', marginTop: 4 }}>
                    마감: {p.postExpiryDate}
                  </div>
                  <button
                    className="other-post-apply-btn"
                    style={{
                      position: 'absolute',
                      right: 18,
                      bottom: 18,
                      background: '#fff',
                      color: '#30c59b',
                      border: '2px solid #30c59b',
                      borderRadius: 8,
                      padding: '0.4rem 1.1rem',
                      fontWeight: 600,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(48,197,155,0.07)',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#e6faf3';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#fff';
                    }}
                    onClick={() => {
                      setShowPortfolioPopup(true);
                      setPost(p);
                    }}
                  >
                    입사지원
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 포트폴리오 업로드/입사지원 팝업 */}
      {showPortfolioPopup && (
        <div
          style={{
            position: 'fixed',
            right: 32,
            bottom: 32,
            width: 440,
            maxHeight: '80vh',
            height: 'auto',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: authState.token ? '1.2rem 1.5rem 0.7rem 1.5rem' : '2rem 1.5rem 1rem 1.5rem',
              borderBottom: authState.token ? '1px solid #eee' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {!authState.token && (
              <div style={{ width: '100%', textAlign: 'center', marginBottom: '0' }}>
                <h2 style={{ 
                  color: '#222', 
                  fontSize: '1.4rem', 
                  fontWeight: 700, 
                  margin: 0,
                  letterSpacing: '-0.5px'
                }}>
                  <span style={{ color: '#30c59b' }}>로그인</span><span style={{ color: '#888' }}>이 필요한 서비스입니다</span>
                </h2>
              </div>
            )}
            {authState.token && (
              <div style={{ width: '100%' }}>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#30c59b', // 녹색
                  marginBottom: 2,
                  lineHeight: 1.25,
                  wordBreak: 'break-all',
                }}>
                  {post.postTitle}
                </div>
                <div style={{
                  fontSize: '1.01rem',
                  color: '#888',
                  marginTop: 2,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '300px',
                }}>
                  {company?.companyName || '회사명'}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowPortfolioPopup(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: '#888',
                cursor: 'pointer',
                position: 'absolute',
                right: 18,
                top: 18,
              }}
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              padding: authState.token ? '1.5rem' : '0 1.5rem 1.5rem 1.5rem',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            {!authState.token ? (
              // 로그인 폼
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '1.5rem 1rem',
                background: '#fff',
                borderRadius: 16,
                width: '100%',
                maxWidth: 400,
                margin: '0 auto'
              }}>
                {/* 로그인 폼 */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 아이디 입력 */}
                  <input
                    name="loginId"
                    value={loginForm.loginId}
                    onChange={handleLoginInput}
                    placeholder="아이디"
                    style={{ 
                      padding: '1rem', 
                      borderRadius: 8, 
                      border: '1px solid #e1e5e9', 
                      fontSize: '1rem', 
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#30c59b'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  />
                  
                  {/* 비밀번호 입력 */}
                  <input
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={handleLoginInput}
                    placeholder="비밀번호"
                    style={{ 
                      padding: '1rem', 
                      borderRadius: 8, 
                      border: '1px solid #e1e5e9', 
                      fontSize: '1rem', 
                      background: '#fff',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#30c59b'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  />

                  {/* 체크박스 영역 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    margin: '0.5rem 0'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: '0.9rem', 
                      color: '#666',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="checkbox" 
                        style={{ 
                          width: 16, 
                          height: 16,
                          accentColor: '#30c59b'
                        }} 
                      />
                      로그인 유지
                    </label>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>아이디 저장</span>
                  </div>

                  {/* 로그인 에러 메시지 */}
                  {loginError && (
                    <div style={{ 
                      color: '#e74c3c', 
                      fontSize: '0.9rem', 
                      textAlign: 'center',
                      margin: '0.5rem 0'
                    }}>
                      {loginError}
                    </div>
                  )}

                  {/* 로그인 버튼 */}
                  <button
                    type="submit"
                    disabled={loggingIn}
                    style={{
                      padding: '1rem',
                      background: loggingIn ? '#b2dfd3' : '#30c59b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      cursor: loggingIn ? 'not-allowed' : 'pointer',
                      marginTop: '0.5rem',
                      transition: 'background 0.2s'
                    }}
                  >
                    {loggingIn ? '로그인 중...' : '로그인'}
                  </button>
                </form>

                {/* 하단 링크들 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 20,
                  margin: '1.5rem 0 2rem 0',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ color: '#666', cursor: 'pointer' }}>아이디 찾기</span>
                  <span style={{ color: '#ccc' }}>|</span>
                  <span style={{ color: '#666', cursor: 'pointer' }}>비밀번호 찾기</span>
                  <span style={{ color: '#ccc' }}>|</span>
                  <span style={{ color: '#666', cursor: 'pointer' }}>회원가입</span>
                </div>

                {/* 소셜 로그인 제목 */}
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: '1rem', 
                  color: '#666', 
                  marginBottom: '1.5rem',
                  fontWeight: 500
                }}>
                  소셜 계정으로 간편 로그인
                </div>

                {/* 소셜 로그인 아이콘들 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 20,
                  flexWrap: 'wrap'
                }}>
                  {/* 네이버 */}
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    background: '#03C75A', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>N</span>
                  </div>
                  
                  {/* 카카오톡 */}
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    background: '#FEE500', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <div style={{ 
                      width: 20, 
                      height: 20, 
                      background: '#000', 
                      borderRadius: '50% 50% 50% 0',
                      transform: 'rotate(-45deg)'
                    }}></div>
                  </div>
                  
                  {/* 구글 */}
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    background: '#fff', 
                    border: '1px solid #ddd',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>G</span>
                  </div>
                  
                  {/* 페이스북 */}
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    background: '#1877F2', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>f</span>
                  </div>
                  
                  {/* 애플 */}
                  <div style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: '50%', 
                    background: '#000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <span style={{ color: '#fff', fontSize: '1.3rem' }}>🍎</span>
                  </div>
                </div>
              </div>
            ) : (
              authState.userType === 'company' ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 600, 
                    color: '#666', 
                    marginBottom: '1rem' 
                  }}>
                    기업 회원은 입사지원을 할 수 없습니다
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#888', 
                    lineHeight: '1.4' 
                  }}>
                    개인 회원으로 로그인해주세요
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600, 
                    color: '#333',
                    marginBottom: '0.5rem'
                  }}>
                    포트폴리오 업로드
                  </div>
                  
                  {/* 기존 포트폴리오 표시 */}
                  {existingPortfolio && (
                    <div style={{
                      boxShadow: '0 4px 16px rgba(48,197,155,0.10)',
                      borderRadius: '14px',
                      padding: '1.3rem 1.2rem 1.1rem 1.2rem',
                      background: '#f7fcfa',
                      marginBottom: '1.2rem',
                      border: useExistingPortfolio ? '2.5px solid #30c59b' : '2px solid #e0f5ee',
                      transition: 'border 0.2s',
                      position: 'relative',
                      minHeight: 90,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.7rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700, color: '#30c59b', fontSize: '1.05rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* 폴더 SVG 아이콘 */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 2, verticalAlign: 'middle' }}><path d="M3 7C3 5.89543 3.89543 5 5 5H9.17157C9.70201 5 10.2107 5.21071 10.5858 5.58579L12.4142 7.41421C12.7893 7.78929 13.298 8 13.8284 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="#30c59b" strokeWidth="2" strokeLinejoin="round"/></svg>
                          기존 포트폴리오
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setUseExistingPortfolio(true); setSelectedFile(null); }}
                            style={{
                              background: useExistingPortfolio ? '#30c59b' : '#f2f2f2',
                              color: useExistingPortfolio ? '#fff' : '#30c59b',
                              border: 'none',
                              borderRadius: 7,
                              padding: '0.35rem 1.1rem',
                              fontWeight: 600,
                              fontSize: '0.93rem',
                              cursor: 'pointer',
                              boxShadow: useExistingPortfolio ? '0 2px 8px rgba(48,197,155,0.13)' : 'none',
                              transition: 'background 0.18s, color 0.18s',
                            }}
                          >
                            사용하기
                          </button>
                          <button
                            onClick={() => setUseExistingPortfolio(false)}
                            style={{
                              background: !useExistingPortfolio ? '#30c59b' : '#f2f2f2',
                              color: !useExistingPortfolio ? '#fff' : '#30c59b',
                              border: 'none',
                              borderRadius: 7,
                              padding: '0.35rem 1.1rem',
                              fontWeight: 600,
                              fontSize: '0.93rem',
                              cursor: 'pointer',
                              boxShadow: !useExistingPortfolio ? '0 2px 8px rgba(48,197,155,0.13)' : 'none',
                              transition: 'background 0.18s, color 0.18s',
                            }}
                          >
                            새로 업로드
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: '#fff', borderRadius: 8, padding: '0.7rem 1rem', border: '1.5px solid #e0f5ee', fontSize: '0.98rem', fontWeight: 500 }}>
                        {/* 파일 SVG 아이콘 */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}><path d="M6 4C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V8.82843C20 8.298 19.7893 7.78929 19.4142 7.41421L15.5858 3.58579C15.2107 3.21071 14.702 3 14.1716 3H6Z" stroke="#30c59b" strokeWidth="2" strokeLinejoin="round"/></svg>
                        <a
                          href={existingPortfolio.portfolioFilePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#30c59b',
                            fontWeight: 600,
                            fontSize: '0.98rem',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            transition: 'color 0.18s',
                            maxWidth: '220px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                          title={existingPortfolio.originalFileName || '포트폴리오 파일'}
                          onMouseOver={e => e.target.style.color = '#1a9d7c'}
                          onMouseOut={e => e.target.style.color = '#30c59b'}
                          download
                        >
                          {existingPortfolio.originalFileName || '포트폴리오 파일'}
                        </a>
                        <button
                          onClick={handleDeleteExistingPortfolio}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.18s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          aria-label="포트폴리오 삭제"
                        >
                          {/* 휴지통 SVG 아이콘 */}
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 6H5H21" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/><path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="#e74c3c" strokeWidth="2"/><path d="M10 11V17" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/><path d="M14 11V17" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/></svg>
                        </button>
                      </div>
                      {existingPortfolio.postTitle && (
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem', fontWeight: 500 }}>
                          이전 지원: <span style={{ color: '#30c59b', fontWeight: 700 }}>{existingPortfolio.postTitle}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* 업로드 영역 */}
                  <div style={{
                    border: '2.5px dashed #e0f5ee',
                    borderRadius: '12px',
                    padding: '2.2rem 1.2rem',
                    textAlign: 'center',
                    backgroundColor: '#fafdff',
                    cursor: useExistingPortfolio ? 'not-allowed' : 'pointer',
                    opacity: useExistingPortfolio ? 0.45 : 1,
                    transition: 'all 0.2s',
                    marginBottom: '0.7rem',
                    position: 'relative',
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (useExistingPortfolio) return;
                    const files = Array.from(e.target.files || e.dataTransfer.files);
                    if (files.length > 0) {
                      setSelectedFile(files[0]);
                      setUseExistingPortfolio(false);
                      setUploadError(null);
                    }
                  }}
                  onClick={() => {
                    if (!useExistingPortfolio) document.getElementById('portfolio-upload').click();
                  }}
                  >
                    <input
                      id="portfolio-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                          setUseExistingPortfolio(false);
                          setUploadError(null);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    {selectedFile ? (
                      <div style={{ color: '#30c59b', fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {/* 체크 SVG 아이콘 */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13L9 17L19 7" stroke="#30c59b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        선택된 파일: {selectedFile.name}
                      </div>
                    ) : (
                      <div style={{ color: '#888', fontWeight: 500, fontSize: '1.01rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ marginBottom: '0.7rem', display: 'flex', justifyContent: 'center' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" stroke="#30c59b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div style={{ fontWeight: 700, color: '#30c59b', fontSize: '1.08rem', marginBottom: 2, textAlign: 'center' }}>여기에 파일을 드래그하거나 클릭해서 업로드</div>
                        <div style={{ fontSize: '0.93rem', color: '#aaa', marginTop: '0.5rem', textAlign: 'center' }}>
                          지원 형식: PDF, DOC, DOCX, TXT, ZIP, RAR (최대 5MB)
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#666', 
                    lineHeight: '1.4',
                    padding: '0.8rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    제출서류는 공고 마감일로부터 90일까지 보관되며, 채용과 관련된 목적으로만 활용됩니다.
                  </div>

                  {uploadError && (
                    <div style={{ 
                      color: '#e74c3c', 
                      fontSize: '0.9rem', 
                      textAlign: 'center',
                      marginTop: '1rem',
                      padding: '0.8rem',
                      backgroundColor: '#fef2f2',
                      borderRadius: '6px',
                      border: '1px solid #fecaca'
                    }}>
                      ⚠ {uploadError}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Footer + 안내문구 */}
          <div
            style={{
              padding: '1rem 1.5rem 1.2rem 1.5rem',
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {authState.token && (
              <button
                onClick={handleUpload}
                disabled={uploading || (!selectedFile && !useExistingPortfolio)}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: uploading || (!selectedFile && !useExistingPortfolio) ? '#b2dfd3' : '#30c59b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: uploading || (!selectedFile && !useExistingPortfolio) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(48,197,155,0.2)',
                  transition: 'background 0.2s',
                }}
              >
                {uploading ? '업로드 중...' : '입사지원'}
              </button>
            )}
          </div>
        </div>
      )}
      {uploading && (
        <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="modal-content" style={{ background:'#fff', borderRadius: '16px', padding:'2.5rem 3.5rem', boxShadow:'0 8px 32px rgba(0,0,0,0.15)', textAlign:'center', fontSize:'1.2rem', fontWeight:600, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="loading-spinner" style={{ marginBottom:'1.5rem', width:'48px', height:'48px', border:'6px solid #e2e8f0', borderTop:'6px solid #38a169', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
            <div>분석 중입니다. 잠시만 기다려주세요...</div>
          </div>
        </div>
      )}
      {/* 매칭탭에서 진입한 경우에만 이력서/분석/매칭 점수/이유 섹션 노출 */}
      {fromMatchingTab && (
        <div style={{
          margin: '2rem 0',
          padding: '2rem',
          background: '#f8fafd',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(48,197,155,0.07)',
          maxWidth: 950,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <h2 style={{ color: '#30c59b', fontWeight: 800, fontSize: '1.4rem', marginBottom: '1.2rem' }}>매칭 상세 정보</h2>
          {matchingLoading ? (
            <div>불러오는 중...</div>
          ) : matchingError ? (
            <div style={{ color: 'red' }}>{matchingError}</div>
          ) : (
            <>
              {/* 이력서/포트폴리오 정보 */}
              <div style={{ marginBottom: '1.2rem' }}>
                <strong>이력서/포트폴리오:</strong><br />
                {existingPortfolio && existingPortfolio.portfolioFilePath ? (
                  <a href={existingPortfolio.portfolioFilePath} target="_blank" rel="noopener noreferrer">
                    {existingPortfolio.originalFileName || '포트폴리오 파일 다운로드'}
                  </a>
                ) : (
                  <span>포트폴리오 파일 정보 없음</span>
                )}
              </div>
              {/* 분석 결과 */}
              <div style={{ marginBottom: '1.2rem' }}>
                <strong>분석 결과:</strong><br />
                {matchingAnalysis && matchingAnalysis.analysisData ? (
                  <pre style={{ background: '#fff', padding: '1rem', borderRadius: 8, fontSize: '1rem', maxHeight: 200, overflow: 'auto' }}>{typeof matchingAnalysis.analysisData === 'string' ? matchingAnalysis.analysisData : JSON.stringify(matchingAnalysis.analysisData, null, 2)}</pre>
                ) : (
                  <span>분석 결과 정보 없음</span>
                )}
              </div>
              {/* 매칭 점수/이유 */}
              <div>
                <strong>매칭 점수:</strong> {matchingScore !== null ? <span style={{ color: '#30c59b', fontWeight: 700 }}>{matchingScore}점</span> : '정보 없음'}<br />
                <strong>매칭 이유:</strong> {matchingReason || '정보 없음'}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default JobDetailPage;

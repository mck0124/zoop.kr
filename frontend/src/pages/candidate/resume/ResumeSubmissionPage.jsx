import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ResumeBasicInfoSection from './ResumeBasicInfoSection';
import ResumeEducationSection from './ResumeEducationSection';
import ResumeCareerSection from './ResumeCareerSection';
import ResumeSelfIntroSection from './ResumeSelfIntroSection';
import ResumeFileUploadSection from './ResumeFileUploadSection';
import './ResumeSubmissionPage.css';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaSave, FaCheck } from 'react-icons/fa';
import { Sidebar } from '../Sidebar';
import PortfolioNavbar from '../Portfolio/PortfolioNavbar';
import { apiUrl } from '../../../api/config';

const authenticatedFetch = (url, options = {}) => fetch(url, {
  ...options,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
    ...(options.headers || {}),
  },
});

const RESUME_OFFER_OPTIONS = [
  { value: 'active', label: '적극 구직 중이에요\n제안 받을래요' },
  { value: 'open', label: '좋은 포지션이 있다면\n제안 받을래요' },
  { value: 'private', label: '제안 받지 않을래요' },
];

const ResumeSubmissionPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    education: [],
    career: [],
    selfIntro: '',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [offerOption, setOfferOption] = useState('active');

  // 임시저장 값이 있으면 우선 적용, 없으면 사용자 정보 fetch + DB 이력서 fetch
  useEffect(() => {
    const draft = localStorage.getItem('resumeDraft');
    if (draft) {
      try {
        setForm(prev => ({ ...prev, ...JSON.parse(draft) }));
        return;
      } catch {}
    }
    // 임시저장 없을 때만 사용자 정보 fetch + DB 이력서 fetch
    const fetchUserInfoAndResume = async () => {
      if (!authState.userId) return;
      let userData = {};
      let resumeData = null;
      let portfolioFilePath = null;
      let originalFileName = null;
      // 1. 사용자 정보는 무조건 세팅
      try {
        const res = await authenticatedFetch(apiUrl(`/api/candidates/${authState.userId}`));
        if (res.ok) {
          userData = await res.json();
        }
      } catch (e) {
        console.error('사용자 정보 조회 오류:', e);
      }
      // 2. 이력서 정보는 실패해도 무시
      try {
        const resumeRes = await authenticatedFetch(apiUrl(`/api/resumes/candidate/${authState.userId}`));
        if (resumeRes.ok) {
          const resumes = await resumeRes.json();
          if (Array.isArray(resumes) && resumes.length > 0) {
            resumeData = resumes[0];
          }
        }
      } catch (e) {
        console.error('이력서 정보 조회 오류:', e);
      }
      // 3. 최근 첨부 이력서 파일 fetch
      try {
        const pfRes = await authenticatedFetch(apiUrl(`/api/portfolios/candidate-portfolio/recent/${authState.userId}`));
        if (pfRes.ok) {
          const pf = await pfRes.json();
          if (pf.hasPortfolio && pf.portfolioFilePath) {
            portfolioFilePath = pf.portfolioFilePath;
            originalFileName = pf.originalFileName || null;
          }
        }
      } catch (e) {
        console.error('이력서 파일(cand_portfolio) 조회 오류:', e);
      }
      // 4. 항상 기본 정보는 세팅
      setForm(prev => ({
        ...prev,
        name: userData?.candidateName || '',
        email: userData?.candidateEmail || '',
        phone: userData?.candidatePhoneNumber || '',
        selfIntro: resumeData?.resume?.selfIntro || '',
        education: resumeData?.educations || [],
        career: resumeData?.experiences || [],
        file: portfolioFilePath ? { url: portfolioFilePath, name: originalFileName } : null,
      }));
    };
    fetchUserInfoAndResume();
  }, [authState.userId]);

  // 이력서, 학력, 경력, 포트폴리오 등록 API 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file) {
      setFeedback({ type: 'error', message: 'Please attach your resume file.' });
      return;
    }
    setFeedback({ type: '', message: '' });
    setLoading(true);
    setLoadingMessage('제출 중...');
    try {
      // 1. 이력서+학력+경력 한 번에 등록
      // education의 school -> schoolName 변환 및 빈 값 처리
      const educations = (form.education || []).map(edu => {
        const e = { ...edu, schoolName: edu.school };
        Object.keys(e).forEach(k => { if (e[k] === undefined || e[k] === null) e[k] = ''; });
        return e;
      });
      const experiences = (form.career || [])
        .filter(exp => exp.company && (exp.jobTitle || exp.job))
        .map(exp => {
          const ex = {
            ...exp,
            companyName: exp.company,
            jobTitle: exp.jobTitle || exp.job,
            isCompanyHidden: exp.isCompanyHidden ? "Y" : "N",
            isCurrent: exp.isCurrent ? "Y" : "N",
          };
          Object.keys(ex).forEach(k => { if (ex[k] === undefined || ex[k] === null) ex[k] = ''; });
          return ex;
        });
      const resumeRes = await authenticatedFetch(apiUrl('/api/resumes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: authState.userId, // 실제 로그인 유저 ID 사용
          selfIntro: form.selfIntro,
          isPublic: offerOption === 'private' ? 'N' : 'Y',
          status: 'active',
          educations, // 변환된 배열 사용
          experiences, // 변환된 배열 사용
        }),
      });
      if (!resumeRes.ok) {
        let errorMsg = '알 수 없는 오류가 발생했습니다.';
        try {
          const text = await resumeRes.text();
          try {
            const json = JSON.parse(text);
            errorMsg = json.message || JSON.stringify(json);
          } catch {
            errorMsg = text;
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      await resumeRes.json();

      // 2. 포트폴리오 파일 업로드
      if (form.file) {
        const fd = new FormData();
        fd.append('candidateId', authState.userId);
        fd.append('portfolioFile', form.file);
        const portRes = await authenticatedFetch(apiUrl('/api/portfolios/resume-upload'), {
          method: 'POST',
          body: fd,
        });
        if (!portRes.ok) {
          let errorMsg = '알 수 없는 오류가 발생했습니다.';
          try {
            const text = await portRes.text();
            try {
              const json = JSON.parse(text);
              errorMsg = json.message || JSON.stringify(json);
            } catch {
              errorMsg = text;
            }
          } catch (e) {}
          throw new Error(errorMsg);
        }
        const uploadResult = await portRes.json();
        // 다양한 필드명에 대응
        const cand_portfolio_id = uploadResult.cand_portfolio_id || uploadResult.portfolioId || uploadResult.id;
        const file_url = uploadResult.file_url || uploadResult.portfolioFilePath || uploadResult.url;
        if (!cand_portfolio_id || !file_url) {
          throw new Error('포트폴리오 업로드 응답에 cand_portfolio_id 또는 file_url이 없습니다.');
        }
        // 분석 API 호출 및 폴링 부분 제거
        setFeedback({ type: 'success', message: 'Resume and portfolio saved successfully. Analysis will begin automatically shortly.' });
        navigate('/candidate/dashboard');
        setLoading(false);
        setLoadingMessage('');
        return;
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Unable to save: ${err.message}` });
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // 임시저장 핸들러 (localStorage 활용)
  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem('resumeDraft', JSON.stringify(form));
      setFeedback({ type: 'success', message: 'Draft saved locally on this device.' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Unable to save draft: ' + e.message });
    } finally {
      setSaving(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (window.confirm('정말 취소하시겠습니까? 작성 중인 내용은 저장되지 않습니다.')) {
      navigate(-1); // 이전 페이지로 이동
    }
  };

  // 2. 로딩 중에는 로딩 UI만
  if (loading) {
    return (
      <div className="portfolio-submission-container">
        <div className="loading-container">
          <div className="loading-spinner" style={{ marginBottom:'1.5rem', width:'48px', height:'48px', border:'6px solid #e2e8f0', borderTop:'6px solid #38a169', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
          <p>{loadingMessage || 'Loading job details...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-submission-page">
      <PortfolioNavbar />
      <div className="content-row">
        <Sidebar />
        <div className="main-content-area">
          <div style={{ marginTop: '72px' }}>
            <h1 className="page-title">Build your resume</h1>

            {feedback.message && (
              <div
                role={feedback.type === 'error' ? 'alert' : 'status'}
                aria-live="polite"
                style={{
                  margin: '0 auto 1rem',
                  maxWidth: '1200px',
                  padding: '0.85rem 1rem',
                  borderRadius: 12,
                  border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                  background: feedback.type === 'error' ? '#fff7f7' : '#effcf7',
                  color: feedback.type === 'error' ? '#991b1b' : '#166534',
                  fontWeight: 700
                }}
              >
                {feedback.message}
              </div>
            )}
        
            <form onSubmit={handleSubmit} style={{ paddingBottom: '100px' }}>
              <div style={{maxWidth: '1200px', margin: '0 auto'}}>
              <div className="resume-section-wrapper">
                <ResumeBasicInfoSection form={form} setForm={setForm} />
              </div>
              <div className="resume-section-wrapper">
                <ResumeEducationSection form={form} setForm={setForm} />
              </div>
              <div className="resume-section-wrapper">
                <ResumeCareerSection form={form} setForm={setForm} />
              </div>
              <div className="resume-section-wrapper">
                <ResumeSelfIntroSection form={form} setForm={setForm} />
              </div>
              <div className="resume-section-wrapper">
                <ResumeFileUploadSection form={form} setForm={setForm} />
              </div>
              {/* 기업 제안 수신 여부 UI + 개인정보 동의 UI 너비 통일 */}
              <div className="resume-section-wrapper">
                <div className="resume-offer-section" style={{ padding: 0 }}>
                  <div className="resume-offer-title">Would you like to receive opportunities from companies?</div>
                  <div style={{ display: 'flex', gap: '1rem', margin: '18px 0 8px 0', justifyContent: 'flex-start' }}>
                    {RESUME_OFFER_OPTIONS.map(opt => (
                      <label
                        key={opt.value}
                        style={{
                          background: offerOption === opt.value ? '#e6faf6' : '#fff',
                          border: offerOption === opt.value ? '2.5px solid #30C59B' : '1.5px solid #e2e8f0',
                          color: offerOption === opt.value ? '#30C59B' : '#222',
                          borderRadius: '12px',
                          padding: '0.95rem 2.1rem',
                          minWidth: 140,
                          textAlign: 'center',
                          fontSize: '1.04rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          boxShadow: offerOption === opt.value ? '0 4px 18px rgba(48,197,155,0.10)' : '0 2px 8px rgba(30,200,170,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          userSelect: 'none',
                          transition: 'all 0.18s',
                        }}
                        onClick={() => setOfferOption(opt.value)}
                      >
                        <input
                          type="radio"
                          name="resume-offer"
                          value={opt.value}
                          checked={offerOption === opt.value}
                          onChange={() => setOfferOption(opt.value)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ lineHeight: 1.5, whiteSpace: 'pre-line' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="resume-section-wrapper">
                <div className="resume-agreement-section" style={{ padding: 0 }}>
                  <label className="resume-agreement-label">
                    <input
                      type="checkbox"
                      checked={agreementChecked}
                      onChange={e => setAgreementChecked(e.target.checked)}
                      className="resume-agreement-checkbox"
                    />
                    <span className="resume-agreement-text" style={{ fontSize: '0.93rem', color: '#888', fontWeight: 400 }}>
                      I agree to the collection and use of my personal data when submitting this resume. (Required)
                    </span>
                  </label>
                </div>
              </div>
            </div>
            {/* 하단 고정 버튼 영역 - 세련된 스타일 적용 */}
            <div className="resume-fixed-action-bar">
              <button
                type="button"
                onClick={handleCancel}
                className="resume-cancel-btn styled-action-btn"
                aria-label="Cancel resume"
                style={{ background: '#30C59B', color: '#fff' }}
              >
                <FaTimes style={{ marginRight: 8 }} /> Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="resume-save-btn styled-action-btn"
                aria-label="Save draft"
                style={{ background: '#30C59B', color: '#fff' }}
              >
                <FaSave style={{ marginRight: 8 }} /> {saving ? 'Saving...' : 'Save draft'}
              </button>
              <button
                type="submit"
                disabled={loading || !agreementChecked || !form.file}
                className="resume-submit-btn styled-action-btn"
                aria-label="Submit resume"
                style={{ background: '#30C59B', color: '#fff' }}
              >
                <FaCheck style={{ marginRight: 8 }} /> {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeSubmissionPage; 

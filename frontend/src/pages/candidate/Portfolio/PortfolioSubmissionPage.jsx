import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PortfolioNavbar from './PortfolioNavbar';
import { Sidebar } from '../Sidebar';
import './PortfolioSubmissionPage.css';
import { apiUrl } from '../../../api/config';
import { useLanguage } from '../../../context/LanguageContext';

function PortfolioSubmissionPage() {
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const { postId } = useParams();
  const navigate = useNavigate();
  const { authState, isInitialized } = useAuth();
  const { language } = useLanguage();

  // Portfolio form input states
  const [portfolioFile, setPortfolioFile] = useState(null);
  const portfolioContent = '';
  const portfolioUrl = '';

  // Career experience states
  const [isExperienced, setIsExperienced] = useState(true);
  const [totalYearsOfExperience, setTotalYearsOfExperience] = useState('');
  const [workExperiences, setWorkExperiences] = useState([
    { companyName: '', jobTitle: '', startDate: '', endDate: '', currentlyWorking: false }
  ]);

  // Long answer questions states
  const [goalStatement, setGoalStatement] = useState('');
  const [suitabilityStatement, setSuitabilityStatement] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  // New states for agreement checkboxes (from the third image)
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeRequiredPersonal, setAgreeRequiredPersonal] = useState(false);
  const [agreeOptionalPersonal, setAgreeOptionalPersonal] = useState(false);
  const [agreeFutureProposals, setAgreeFutureProposals] = useState(false);
  const [agreeReceiveRecruitmentInfo, setAgreeReceiveRecruitmentInfo] = useState(false);

  // Job posting information
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const isFetchingRef = useRef(false);

  // 실제 로그인한 사용자의 ID 사용
  const candidateId = authState.userId ? parseInt(authState.userId, 10) : null;

  // New state for veteran proof file
  const [veteranProofFile, setVeteranProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAgreement, setActiveAgreement] = useState(null);

  useEffect(() => {
    // AuthContext가 초기화되지 않았으면 아무것도 하지 않음
    if (!isInitialized) {
      return;
    }

    // 사용자가 로그인하지 않았거나 candidateId가 없으면 로그인 페이지로 리다이렉트
    if (!candidateId) {
      navigate('/login');
      return;
    }

    // 이미 데이터를 가져왔거나 가져오는 중이면 다시 가져오지 않음
    if (jobPosting || isFetchingRef.current) {
      return;
    }

    const fetchJobPosting = async () => {
      // 이미 가져오는 중이면 중단
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      
      try {
        // 공고 정보 가져오기
        const response = await fetch(apiUrl(`/api/postings/info/${postId}`));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setJobPosting(data);
        setLoadError('');

      } catch (error) {
        console.error('공고 정보를 가져오는 중 오류 발생:', error);
        setJobPosting(null);
        setLoadError('We could not load this job posting. Check your connection and try again.');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchJobPosting();
  }, [postId, isInitialized, candidateId, navigate, jobPosting]);

  // Effect to update individual checkboxes when 'agreeAll' changes
  useEffect(() => {
    setAgreeRequiredPersonal(agreeAll);
    setAgreeOptionalPersonal(agreeAll);
    setAgreeFutureProposals(agreeAll);
    setAgreeReceiveRecruitmentInfo(agreeAll);
  }, [agreeAll]);

  // Effect to update 'agreeAll' when individual checkboxes change
  useEffect(() => {
    if (agreeRequiredPersonal && agreeOptionalPersonal && agreeFutureProposals && agreeReceiveRecruitmentInfo) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
  }, [agreeRequiredPersonal, agreeOptionalPersonal, agreeFutureProposals, agreeReceiveRecruitmentInfo]);

  const handleAddWorkExperience = () => {
    if (workExperiences.length < 5) {
      setWorkExperiences([...workExperiences, { companyName: '', jobTitle: '', startDate: '', endDate: '', currentlyWorking: false }]);
    } else {
      setFeedback({ type: 'error', message: 'You can add up to 5 work experiences.' });
    }
  };

  const handleRemoveWorkExperience = (index) => {
    const newWorkExperiences = workExperiences.filter((_, i) => i !== index);
    setWorkExperiences(newWorkExperiences);
  };

  const handleWorkExperienceChange = (index, field, value) => {
    const newWorkExperiences = workExperiences.map((exp, i) => {
      if (i === index) {
        if (field === 'currentlyWorking') {
          if (value) {
            // 재직중 체크: endDate를 오늘 날짜로 자동 입력
            return { ...exp, currentlyWorking: true, endDate: new Date().toISOString().slice(0, 10) };
          } else {
            // 체크 해제: endDate를 빈 값으로
            return { ...exp, currentlyWorking: false, endDate: '' };
          }
        }
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setWorkExperiences(newWorkExperiences);
  };

  const handleFileSelection = (event, setFile, allowedExtensions) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', message: 'Files must be 50MB or smaller.' });
      event.target.value = '';
      return;
    }
    if (allowedExtensions && !allowedExtensions.includes(extension)) {
      setFeedback({ type: 'error', message: `Unsupported file type. Please select one of: ${allowedExtensions.join(', ')}.` });
      event.target.value = '';
      return;
    }
    setFeedback({ type: '', message: '' });
    setFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate candidateId
    if (!candidateId) {
      setFeedback({ type: 'error', message: 'Please log in to continue.' });
      navigate('/login');
      return;
    }

    // Validate required agreement
    if (!agreeRequiredPersonal) {
      setFeedback({ type: 'error', message: 'You must agree to the required personal data terms.' });
      return;
    }

    // Validate portfolio file is required
    if (!portfolioFile) {
      setFeedback({ type: 'error', message: 'Please select a portfolio file.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    const formData = new FormData();
    formData.append('postId', parseInt(postId, 10));
    formData.append('candidateId', candidateId);
    formData.append('portfolioContent', portfolioContent);
    formData.append('portfolioUrl', portfolioUrl);
    formData.append('language', language);

    if (portfolioFile) {
      formData.append('portfolioFile', portfolioFile);
    }
    if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    }

    formData.append('careerData', JSON.stringify({
      isExperienced: isExperienced,
      totalYearsOfExperience: isExperienced ? parseInt(totalYearsOfExperience, 10) : 0,
      workExperiences: isExperienced ? workExperiences : []
    }));

    formData.append('goalStatement', goalStatement);
    formData.append('suitabilityStatement', suitabilityStatement);

    // Append agreement statuses
    formData.append('agreeRequiredPersonal', agreeRequiredPersonal);
    formData.append('agreeOptionalPersonal', agreeOptionalPersonal);
    formData.append('agreeFutureProposals', agreeFutureProposals);
    formData.append('agreeReceiveRecruitmentInfo', agreeReceiveRecruitmentInfo);

    if (veteranProofFile) {
      formData.append('veteranProofFile', veteranProofFile);
    }

    // source 파라미터 추가
    formData.append('source', 'dashboard');

    try {
        const response = await fetch(apiUrl('/api/portfolios'), {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        await response.json();
        setFeedback({ type: 'success', message: 'Your application was submitted successfully. Redirecting to your dashboard…' });
        setIsSubmitting(false);
        navigate('/candidate/dashboard');

    } catch (error) {
        console.error('지원서 제출 오류:', error);
        setFeedback({ type: 'error', message: `Application submission failed: ${error.message}` });
        setIsSubmitting(false);
    }
  };

  // 1. AuthContext 초기화 대기
  if (!isInitialized) {
    return (
      <div className="portfolio-submission-container">
        <div className="loading-container">
          <div className="loading-spinner" style={{ marginBottom:'1.5rem', width:'48px', height:'48px', border:'6px solid #e2e8f0', borderTop:'6px solid #38a169', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 2. 로딩 중에는 로딩 UI만
  if (loading) {
    return (
      <div className="portfolio-submission-container">
        <div className="loading-container">
          <div className="loading-spinner" style={{ marginBottom:'1.5rem', width:'48px', height:'48px', border:'6px solid #e2e8f0', borderTop:'6px solid #38a169', borderRadius:'50%', animation:'spin 1s linear infinite' }}></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  // 3. 로그인 안 된 경우
  if (!candidateId) {
    navigate('/login');
    return null;
  }

  // 3. 데이터가 없을 때
  if (!jobPosting) {
    return (
      <div className="portfolio-submission-container">
        <div className="submission-error-state" role="alert">
          <h1>Unable to load job details</h1>
          <p>{loadError || 'This job posting is unavailable right now.'}</p>
          <button type="button" onClick={() => { setLoadError(''); setLoading(true); }}>Try again</button>
        </div>
      </div>
    );
  }

  // 4. 정상 UI
  return (
    <div className="portfolio-submission-page">
      <PortfolioNavbar />
      <div className="content-row">
        <Sidebar />
        <div className="main-content-area">
          <h1 className="page-title">Submit your portfolio</h1>
          {feedback.message && (
            <div className={`submission-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
              <span>{feedback.message}</span>
              <button type="button" onClick={() => setFeedback({ type: '', message: '' })} aria-label="Dismiss message">×</button>
            </div>
          )}
          {isSubmitting && (
            <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div className="modal-content" style={{ background:'#fff', borderRadius: '16px', padding:'2.5rem 3.5rem', boxShadow:'0 8px 32px rgba(0,0,0,0.15)', textAlign:'center', fontSize:'1.2rem', fontWeight:600, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div className="loading-spinner" style={{ marginBottom:'1.5rem', width:'48px', height:'48px', border:'6px solid #e2e8f0', borderTop:'6px solid #38a169', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                <div>Preparing your submission. Please wait...</div>
              </div>
            </div>
          )}
          {/* 기존 form 전체를 이 div 안에 넣음 */}
          <form onSubmit={handleSubmit} className="portfolio-form">
            {/* Long Answer Questions */}
            <div className="form-section">
              <h3 className="section-title">Written responses</h3>
              
              <div className="question-group">
                <label htmlFor="goalStatement" className="question-label">
                  1. What would you aim to accomplish in this role?
                  <span className="char-limit">(around 500 characters)</span>
                </label>
                <textarea
                  id="goalStatement"
                  value={goalStatement}
                  onChange={(e) => setGoalStatement(e.target.value)}
                  maxLength="700"
                  placeholder="Up to 700 characters, including spaces"
                  className="question-textarea"
                  required
                />
                <div className="char-counter">
                  {goalStatement.length}/700 characters
                </div>
              </div>

              <div className="question-group">
                <label htmlFor="suitabilityStatement" className="question-label">
                  2. Why are you a strong fit for this role?
                  <span className="char-limit">(around 500 characters)</span>
                </label>
                <textarea
                  id="suitabilityStatement"
                  value={suitabilityStatement}
                  onChange={(e) => setSuitabilityStatement(e.target.value)}
                  maxLength="700"
                  placeholder="Up to 700 characters, including spaces"
                  className="question-textarea"
                  required
                />
                <div className="char-counter">
                  {suitabilityStatement.length}/700 characters
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="form-section">
              <h3 className="section-title">Attachments</h3>
              
              <div className="file-upload-group">
                <label className="file-upload-label">
                  <div className="file-upload-content">
                    <div className="file-icon">📁</div>
                    <div className="file-info">
                      <span className="file-title">Portfolio</span>
                      <span className="file-subtitle">* Required</span>
                    </div>
                    <div className="file-name">
                      {portfolioFile ? portfolioFile.name : 'Attach file (max 50MB)'}
                    </div>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => handleFileSelection(e, setPortfolioFile, ['.pdf', '.zip', '.rar', '.png', '.jpg', '.jpeg'])}
                    accept=".pdf,.zip,.rar,.png,.jpg,.jpeg"
                    className="file-input"
                    required
                  />
                </label>
              </div>

              <div className="file-upload-group">
                <label className="file-upload-label">
                  <div className="file-upload-content">
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <span className="file-title">Resume and career summary</span>
                      <span className="file-subtitle">Optional</span>
                    </div>
                    <div className="file-name">
                      {resumeFile ? resumeFile.name : 'Attach file (max 50MB)'}
                    </div>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => handleFileSelection(e, setResumeFile, ['.pdf', '.doc', '.docx'])}
                    accept=".pdf,.doc,.docx"
                    className="file-input"
                  />
                </label>
              </div>

              <div className="file-upload-group">
                <label className="file-upload-label">
                  <div className="file-upload-content">
                    <div className="file-icon">🪪</div>
                    <div className="file-info">
                      <span className="file-title">Veteran status document</span>
                    </div>
                    <div className="file-name">
                      {veteranProofFile ? veteranProofFile.name : 'Attach file (max 50MB)'}
                    </div>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => handleFileSelection(e, setVeteranProofFile, ['.pdf', '.png', '.jpg', '.jpeg'])}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="file-input"
                  />
                </label>
                <div style={{ color: '#2574c7', fontSize: 14, marginTop: 4 }}>
                  Eligible veteran applicants may receive preference under applicable law. Attach supporting documentation if applicable.
                </div>
              </div>
            </div>

            {/* Career Section */}
            <div className="form-section">
              <h3 className="section-title">Experience</h3>
              
              <div className="career-type-selector">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="experienced"
                    checked={isExperienced === true}
                    onChange={() => setIsExperienced(true)}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Experienced</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="newbie"
                    checked={isExperienced === false}
                    onChange={() => setIsExperienced(false)}
                    className="radio-input"
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Entry level (no experience)</span>
                </label>
              </div>

              {isExperienced && (
                <div className="experience-years">
                  <label htmlFor="totalYearsOfExperience" className="experience-label">
                    Total years of experience <span className="required">*</span>
                  </label>
                  <div className="years-input-group">
                    <input
                      type="number"
                      id="totalYearsOfExperience"
                      value={totalYearsOfExperience}
                      onChange={(e) => setTotalYearsOfExperience(e.target.value)}
                      placeholder="0"
                      required={isExperienced}
                      className="years-input"
                    />
                    <span className="years-unit">years</span>
                  </div>
                </div>
              )}
            </div>

            {isExperienced && (
              <div className="form-section">
                <h3 className="section-title">Work experience</h3>
                <p className="section-description">Add up to five of your most recent roles.</p>
                
                {workExperiences.map((experience, index) => (
                  <div key={index} className="experience-card">
                    {workExperiences.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveWorkExperience(index)} 
                        className="remove-experience-btn"
                      >
                        ✕
                      </button>
                    )}
                    <div className="experience-form">
                      <div className="form-row">
                        <div className="form-field">
                          <label htmlFor={`companyName-${index}`} className="field-label">
                            Company <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            id={`companyName-${index}`}
                            value={experience.companyName}
                            onChange={(e) => handleWorkExperienceChange(index, 'companyName', e.target.value)}
                            placeholder="Search for a company"
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-field">
                          <label htmlFor={`jobTitle-${index}`} className="field-label">
                            Job title <span className="required">*</span>
                          </label>
                          <input
                            type="text"
                            id={`jobTitle-${index}`}
                            value={experience.jobTitle}
                            onChange={(e) => handleWorkExperienceChange(index, 'jobTitle', e.target.value)}
                            placeholder="(예시) Frontend Developer"
                            required
                            className="form-input"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-field" style={{ width: '100%' }}>
                          <label className="field-label">
                            Employment period <span className="required">*</span>
                          </label>
                          {/* Always show the single-line period above the pickers */}
                          <div style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#2c3e50', minHeight: '1.5em' }}>
                            {experience.startDate
                              ? `${experience.startDate} ~ ${experience.currentlyWorking ? 'Present' : (experience.endDate ? experience.endDate : '')}`
                              : 'Enter your employment period.'}
                          </div>
                          <div className="date-range" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                            <input
                              type="date"
                              value={experience.startDate}
                              onChange={(e) => handleWorkExperienceChange(index, 'startDate', e.target.value)}
                              required
                              className="date-input"
                              style={{ minWidth: '130px' }}
                            />
                            <span className="date-separator">~</span>
                            {!experience.currentlyWorking && (
                              <input
                                type="date"
                                value={experience.endDate}
                                onChange={(e) => handleWorkExperienceChange(index, 'endDate', e.target.value)}
                                required={!experience.currentlyWorking}
                                className="date-input"
                                style={{ minWidth: '130px' }}
                              />
                            )}
                            <label className="currently-working" style={{ marginLeft: '8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={experience.currentlyWorking}
                                onChange={(e) => handleWorkExperienceChange(index, 'currentlyWorking', e.target.checked)}
                                className="checkbox-input"
                              />
                              <span className="checkbox-custom"></span>
                              Currently working
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {workExperiences.length < 5 && (
                  <button 
                    type="button" 
                    onClick={handleAddWorkExperience} 
                    className="add-experience-btn"
                  >
                    + Add work experience
                  </button>
                )}
              </div>
            )}

            {/* Agreement Section */}
            <div className="form-section agreement-section">
              <h3 className="section-title">Privacy and consent</h3>
              
              <div className="agreement-all">
                <label className="agreement-all-label">
                  <input
                    type="checkbox"
                    id="agreeAll"
                    checked={agreeAll}
                    onChange={() => setAgreeAll(!agreeAll)}
                    className="checkbox-input large"
                  />
                  <span className="checkbox-custom large"></span>
                  <span className="agreement-all-text">Agree to all</span>
                  <span className="agreement-all-subtext">Agree to all required and optional items below.</span>
                </label>
              </div>

              <div className="agreement-divider"></div>

              <div className="agreement-items">
                <div className="agreement-item">
                  <label className="agreement-item-label">
                    <input
                      type="checkbox"
                      id="agreeRequiredPersonal"
                      checked={agreeRequiredPersonal}
                      onChange={() => setAgreeRequiredPersonal(!agreeRequiredPersonal)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="agreement-text">Required personal data collection and use</span>
                  </label>
                  <button type="button" className="agreement-link" onClick={() => setActiveAgreement('Required personal data collection and use')}>View</button>
                </div>

                <div className="agreement-item">
                  <label className="agreement-item-label">
                    <input
                      type="checkbox"
                      id="agreeOptionalPersonal"
                      checked={agreeOptionalPersonal}
                      onChange={() => setAgreeOptionalPersonal(!agreeOptionalPersonal)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="agreement-text">Optional personal data collection and use</span>
                  </label>
                  <button type="button" className="agreement-link" onClick={() => setActiveAgreement('Optional personal data collection and use')}>View</button>
                </div>

                <div className="agreement-item">
                  <label className="agreement-item-label">
                    <input
                      type="checkbox"
                      id="agreeFutureProposals"
                      checked={agreeFutureProposals}
                      onChange={() => setAgreeFutureProposals(!agreeFutureProposals)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="agreement-text">Optional: use my data for future role recommendations</span>
                  </label>
                  <button type="button" className="agreement-link" onClick={() => setActiveAgreement('Future role recommendations')}>View</button>
                </div>
                <p className="agreement-note">This consent allows recruiters to send you more relevant opportunities later.</p>

                <div className="agreement-item">
                  <label className="agreement-item-label">
                    <input
                      type="checkbox"
                      id="agreeReceiveRecruitmentInfo"
                      checked={agreeReceiveRecruitmentInfo}
                      onChange={() => setAgreeReceiveRecruitmentInfo(!agreeReceiveRecruitmentInfo)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    <span className="agreement-text">Optional: receive notifications about future recruiting opportunities</span>
                  </label>
                  <button type="button" className="agreement-link" onClick={() => setActiveAgreement('Future recruiting notifications')}>View</button>
                </div>
              </div>

              <p className="agreement-warning">
                * If this information is relevant, the hiring process may be paused or canceled.
              </p>
            </div>

            <button type="submit" className="submit-button">
              Submit application
            </button>
          </form>
        </div>
      </div>
      {activeAgreement && (
        <div className="agreement-modal-backdrop" role="presentation" onClick={() => setActiveAgreement(null)}>
          <div className="agreement-modal" role="dialog" aria-modal="true" aria-labelledby="agreement-modal-title" onClick={event => event.stopPropagation()}>
            <div className="agreement-modal-header">
              <h2 id="agreement-modal-title">{activeAgreement}</h2>
              <button type="button" aria-label="Close consent details" onClick={() => setActiveAgreement(null)}>×</button>
            </div>
            <p>ZOOP processes personal data only as needed to review your application and share relevant opportunities.</p>
            <p className="agreement-modal-note">Required consent is needed to submit your application. Optional consent can be withdrawn at any time. Processing follows our privacy policy.</p>
            <button type="button" className="submit-button agreement-modal-close" onClick={() => setActiveAgreement(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortfolioSubmissionPage;

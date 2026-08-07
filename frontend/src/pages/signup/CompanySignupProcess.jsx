import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import './CompanySignup.css';
import { useNavigate } from 'react-router-dom';
import SignupTipBox from '../../components/SignupTipBox';
import { apiUrl, OCR_API_URL } from '../../api/config';

export default function CompanySignupProcess() {
  const [bizNum, setBizNum] = useState('');
  const [corpName, setCorpName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [address, setAddress] = useState('');
  const [ocrMessage, setOcrMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isValidCert, setIsValidCert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nextTimeChecked, setNextTimeChecked] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setOcrMessage('');
    setUploadedFileName(file.name);
    setIsValidCert(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiUrl('/ocr', OCR_API_URL), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.raw_text && data.raw_text.join(' ').match(/\d{6}-\d{7}/)) {
        setIsValidCert(true);
        setBizNum(data.biznum || '');
        setCorpName(data.corp_name || '');
        setCeoName(data.ceo_name || '');
        setAddress(data.address || '');
      } else {
        setOcrMessage('⚠️ 사업자등록증명원 파일을 업로드해주세요.');
      }
    } catch (err) {
      setOcrMessage('⚠️ 파일 분석 중 오류가 발생했습니다.');
    }

    setUploading(false);
  };

  const handleCheckboxChange = () => {
    setNextTimeChecked((prev) => !prev);
  };

  useEffect(() => {
    console.log('nextTimeChecked updated to:', nextTimeChecked);
  }, [nextTimeChecked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload = {
      businessNumber: bizNum,
      companyName: corpName,
      ceoName,
      companyAddress: address
    };
  
    try {
      const res = await fetch(apiUrl('/api/companies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (res.ok) {
        const data = await res.json();
        navigate('/auth/company/signup/companyadmin', {
          state: { companyId: data.companyId }
        });
      } else {
        alert('회사 등록 실패');
      }
    } catch (err) {
      alert('서버 오류');
    }
  };
  

  return (
    <>
      <Navbar />
      <div className="signup-layout">
        <div className="tip-box-wrapper">
          <SignupTipBox />
        </div>

        <div className="company-signup-container">
          <h2 className="form-title">기업회원 가입</h2>

          <div className="form-section">
            <p className="upload-instruction">기업 인증</p>
            <div className={`upload-box ${isValidCert ? 'upload-success' : ''}`}>
              {nextTimeChecked ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#468cff', color: 'white', fontSize: '0.9rem', lineHeight: '20px', textAlign: 'center', borderRadius: '4px' }}>✔</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>다음에 인증할게요</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>
                    가입 후 서비스 이용에 제한이 있을 수 있으니 이용 전 반드시 기업 인증을 신청해 주세요.
                  </p>
                </div>
              ) : (
                <>
                  <div className="upload-preview">
                    <img src="/images/sample-correct.png" alt="정상 서류 예시" />
                    <img src="/images/sample-wrong.png" alt="잘못된 서류 예시" />
                  </div>
                  <input
                    type="file"
                    id="fileUpload"
                    className="file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isValidCert}
                  />
                  <label htmlFor="fileUpload" className={`file-label ${isValidCert ? 'disabled-label' : ''}`}>
                    {uploadedFileName ? uploadedFileName : '파일 선택'}
                  </label>
                  {uploading && <p style={{ color: '#888' }}>분석 중입니다...</p>}
                  {ocrMessage && <p style={{ color: 'red', marginTop: '0.5rem' }}>{ocrMessage}</p>}
                  {isValidCert && (
                    <div className="checkmark-overlay">
                      <svg 
                        width="80" 
                        height="80" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          margin: '1rem auto 0',
                          display: 'block',
                          filter: 'drop-shadow(0 4px 8px rgba(48, 197, 155, 0.3))'
                        }}
                      >
                        <defs>
                          <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#30c59b" />
                            <stop offset="100%" stopColor="#2ab78d" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" fill="url(#checkGradient)" stroke="url(#checkGradient)" strokeWidth="2"/>
                        <path 
                          d="M9 12l2 2 4-4" 
                          stroke="white" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{
                            animation: 'checkmarkDraw 0.6s ease-in-out forwards'
                          }}
                        />
                      </svg>
                    </div>
                  )}
                  {!isValidCert && (
                    <div className="checkbox-wrap">
                      <label htmlFor="nextTime" className="checkbox-label">
                        <input
                          type="checkbox"
                          id="nextTime"
                          key={nextTimeChecked ? 'checked' : 'unchecked'}
                          checked={nextTimeChecked}
                          onChange={handleCheckboxChange}
                          disabled={isValidCert}
                        />
                        <span>다음에 인증할게요</span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <label>사업자등록번호</label>
            <input type="text" value={bizNum} onChange={(e) => setBizNum(e.target.value)} />
          </div>
          <div className="form-section">
            <label>상호 (법인명)</label>
            <input type="text" value={corpName} onChange={(e) => setCorpName(e.target.value)} />
          </div>
          <div className="form-section">
            <label>성명 (대표자)</label>
            <input type="text" value={ceoName} onChange={(e) => setCeoName(e.target.value)} />
          </div>
          <div className="form-section">
            <label>사업장 소재지</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <button className="submit-button" onClick={handleSubmit}>
            기업등록 완료
          </button>
        </div>
      </div>
    </>
  );
}

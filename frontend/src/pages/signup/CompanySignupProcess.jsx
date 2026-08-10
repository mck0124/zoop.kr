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
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
        setOcrMessage('⚠️ Please upload a valid business registration certificate.');
      }
    } catch (err) {
      setOcrMessage('⚠️ We could not analyze that file. Please try again.');
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
    if (submitting) return;
    setSubmitMessage('');
    setSubmitting(true);
  
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
        const data = await res.json().catch(() => ({}));
        setSubmitMessage(data.message || 'Company registration failed. Please check your details and try again.');
      }
    } catch (err) {
      setSubmitMessage('A server error occurred. Please try again.');
    } finally {
      setSubmitting(false);
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
          <h2 className="form-title">Company sign-up</h2>

          <div className="form-section">
            <p className="upload-instruction">Verify your company</p>
            <div className={`upload-box ${isValidCert ? 'upload-success' : ''}`}>
              {nextTimeChecked ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: '#468cff', color: 'white', fontSize: '0.9rem', lineHeight: '20px', textAlign: 'center', borderRadius: '4px' }}>✔</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>Verify later</h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>
                    Some features may be limited until verification is complete. Please apply before using the service.
                  </p>
                </div>
              ) : (
                <>
                  <div className="upload-preview">
                    <img src="/images/sample-correct.png" alt="Example of an accepted document" />
                    <img src="/images/sample-wrong.png" alt="Example of an invalid document" />
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
                    {uploadedFileName ? uploadedFileName : 'Choose a file'}
                  </label>
                  {uploading && <p style={{ color: '#888' }}>Analyzing...</p>}
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
                        <span>Verify later</span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="form-section">
            <label>Business registration number</label>
            <input type="text" value={bizNum} onChange={(e) => setBizNum(e.target.value)} />
          </div>
          <div className="form-section">
            <label>Legal company name</label>
            <input type="text" value={corpName} onChange={(e) => setCorpName(e.target.value)} />
          </div>
          <div className="form-section">
            <label>Representative name</label>
            <input type="text" value={ceoName} onChange={(e) => setCeoName(e.target.value)} />
          </div>
          <div className="form-section">
            <label>Business address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {submitMessage && <p role="alert" style={{ color: '#b42318', marginTop: '1rem' }}>{submitMessage}</p>}
          <button className="submit-button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving company…' : 'Complete company registration'}
          </button>
        </div>
      </div>
    </>
  );
}

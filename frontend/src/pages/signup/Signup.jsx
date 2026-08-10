import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import './Signup.css';

export default function Signup() {
  const [selectedTab, setSelectedTab] = useState('applicant');
  const navigate = useNavigate();

  const handleSignupClick = () => {
    if (selectedTab === 'company') {
      navigate('/auth/company/signup/process');
    } else {
      navigate('/auth/applicant/signup/process');
    }
  };

  return (
    <>
      {/* SEO 컴포넌트 */}
      <SEO
        title="Sign up - ZOOP | Evidence-first hiring"
        description="Create a ZOOP account to join an evidence-first recruiting experience for candidates and companies."
        keywords="ZOOP sign up, AI recruiting, candidate account, company account"
        image="/signup-banner.jpg"
        url="https://zoop.com/auth/signup"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "ZOOP sign up",
          "description": "Create an account on the ZOOP AI recruiting platform",
          "url": "https://zoop.com/auth/signup"
        }}
      />

      <Navbar />

      <div className="signup-wrapper">
        <div className="signup-tabs">
          <button
            className={selectedTab === 'applicant' ? 'active' : ''}
            onClick={() => setSelectedTab('applicant')}
          >
            Candidate
          </button>
          <button
            className={selectedTab === 'company' ? 'active' : ''}
            onClick={() => setSelectedTab('company')}
          >
            Company
          </button>
        </div>

        <div className="signup-divider" />

        <p className="signup-subtext">Sign up quickly with a social account</p>

        <div className="signup-icons">
          <img src="/icons/naver.svg" alt="naver" />
          <img src="/icons/kakao.svg" alt="kakao" />
          <img src="/icons/google.svg" alt="google" />
          <img src="/icons/facebook.svg" alt="facebook" />
          <img src="/icons/apple.svg" alt="apple" />
        </div>

        <button className="signup-id-button" onClick={handleSignupClick}>
          Create your ZOOP account
        </button>

        <p className="signup-footer">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </>
  );
}

import React from 'react';
import './SignupTipBox.css';

export default function SignupTipBox() {
  return (
    <div className="tip-box">
      <h3>⭐️ TIP.</h3>

      <div className="tip-section">
        <strong>1. What is a business registration certificate?</strong>
        <p className="tip-desc">
            Unlike a basic business license, it includes an <strong>anti-forgery number</strong> and <strong>issue date</strong>.
        </p>


        {/* ✅ 버튼을 링크로 감싸기 */}
        <a
          href="https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=12100000016"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button>Issue certificate</button>
        </a>
        <a
          href="https://help.jobis.co/hc/ko/articles/360003271654-%EC%82%AC%EC%97%85%EC%9E%90%EB%93%B1%EB%A1%9D%EC%A6%9D%EB%AA%85-%EB%B0%9C%EA%B8%89%EB%B0%A9%EB%B2%95"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button>How to issue and download</button>
        </a>
      </div>

      <div className="tip-section">
        <strong>2. Why verify a company?</strong>
        <p className="tip-desc">
          To support a safer hiring environment,<br />
          company verification must be<br /><strong>completed before using company tools.</strong>
        </p>
      </div>

      <div className="tip-section">
        <strong>3. Required documents</strong>
        <div className="tip-file">
          🏢 Companies, individuals, and nonprofits<br />
          <strong>Business registration certificate</strong> (issued within 3 months)
        </div>
        <div className="tip-file">
          🕵️ Agencies and staffing firms<br />
          <strong>Business certificate + <br />recruitment or staffing permit</strong>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { apiUrl } from '../../api/config';
import './CompanySignup.css';

export default function CompanyAdminSignup() {
  const [loginId, setLoginId] = useState('');
  const [idChecked, setIdChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [customInput, setCustomInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(300);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [strengthColor, setStrengthColor] = useState('#aaa');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const companyId = location.state?.companyId;

  const handleSendCode = async () => {
    setIsSendingCode(true);
    const fullEmail = `${emailLocal}@${emailDomain}`;
    const res = await fetch(apiUrl(`/api/email/send?email=${encodeURIComponent(fullEmail)}`), {
      method: 'POST',
    });
    if (res.ok) {
      alert('인증 코드가 전송되었습니다.');
      setCodeSent(true);
    } else {
      alert('코드 전송 실패');
    }
    setIsSendingCode(false);
  };

  useEffect(() => {
    let timer;
    if (codeSent && !isEmailVerified && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [codeSent, resendTimer, isEmailVerified]);

  const handleResend = async () => {
    setCodeSent(false);
    setResendTimer(300);
    setVerificationCode('');
    await handleSendCode();
  };

  const handleDomainChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setCustomInput(true);
      setEmailDomain('');
    } else {
      setCustomInput(false);
      setEmailDomain(value);
    }
  };

  const handleVerifyCode = async () => {
    const fullEmail = `${emailLocal}@${emailDomain}`;
    const res = await fetch(apiUrl(`/api/email/verify?email=${encodeURIComponent(fullEmail)}&code=${verificationCode}`), {
      method: 'POST',
    });
    if (res.ok) {
      alert('이메일 인증 완료');
      setIsEmailVerified(true);
    } else {
      alert('인증 실패. 코드를 확인해주세요.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage('이메일 인증이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    const fullEmail = `${emailLocal}@${emailDomain}`;

    const payload = {
      loginId,
      name: adminName,
      email: fullEmail,
      password,
      company: {
        companyId
      }
    };

    try {
      const res = await fetch(apiUrl('/api/companyadmins'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/auth/company/signup/success');
      } else {
        alert('회원가입 실패');
      }
    } catch (err) {
      alert('서버 오류');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="signup-layout" style={{ paddingTop: '10rem' }}>
        <div className="company-signup-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 className="form-title">회사 관리자 등록</h2>

          <form onSubmit={handleSubmit}>
          <div className="form-section">
              <label>아이디</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4~20자리 / 영문, 숫자, 특수문자 '_' 사용가능"
                  value={loginId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9_]*$/.test(val) && val.length <= 20) {
                      setLoginId(val);
                      setIdChecked(false);
                    }
                  }}
                  required
                  style={{ flex: 2 }}
                  disabled={idChecked}
                />
                <button
                  type="button"
                  className="submit-button"
                  disabled={idChecked}
                  onClick={async () => {
                    if (loginId.length < 4 || loginId.length > 20) {
                      alert('아이디는 4~20자리여야 합니다.');
                      return;
                    }
                    try {
                      const res = await fetch(apiUrl(`/api/companyadmins/check-id?loginId=${encodeURIComponent(loginId)}`));
                      if (res.ok) {
                        const data = await res.text();
                        alert(data);
                        if (data.includes('사용 가능한')) {
                          setIdChecked(true);
                        }
                      } else {
                        alert('중복 확인 중 오류 발생');
                      }
                    } catch (err) {
                      alert('서버 통신 실패');
                    }
                  }}
                  style={{
                    backgroundColor: '#2dc997',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem',
                    width: '120px',
                    height: '40px',
                    cursor: idChecked ? 'not-allowed' : 'pointer',
                    opacity: idChecked ? 0.6 : 1
                  }}
                >
                  중복 확인
                </button>
              </div>
            </div>

            <div className="form-section">
              <label>비밀번호</label>
              <input
                type="password"
                className="form-input"
                placeholder="8~16자리 / 영문 대소문자, 숫자, 특수문자 조합"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[ -~]*$/.test(val)) {
                    setPassword(val);

                    const rules = [
                      /[a-z]/.test(val),
                      /[A-Z]/.test(val),
                      /[0-9]/.test(val),
                      /[^a-zA-Z0-9]/.test(val)
                    ];
                    const passed = rules.filter(Boolean).length;

                    if (val.length < 8 || val.length > 16 || passed < 3) {
                      setPasswordStrength('약함');
                      setStrengthColor('#d33');
                    } else if (passed === 3) {
                      setPasswordStrength('보통');
                      setStrengthColor('#f90');
                    } else {
                      setPasswordStrength('강함');
                      setStrengthColor('#2dc997');
                    }

                    setPasswordMatch(val === confirmPassword);
                  }
                }}
                required
              />
              <p style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.3rem' }}>
                8~16자리 영문 대소문자, 숫자, 특수문자 중 3가지 이상 조합으로 만들어주세요.
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: password.length === 0 ? '#aaa' : strengthColor }}>
                비밀번호 강도: {password.length === 0 ? '입력 대기 중' : passwordStrength}
              </p>
            </div>

            <div className="form-section">
              <label>비밀번호 확인</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordMatch(password === e.target.value);
                }}
                required
              />
              {confirmPassword && (
                <p style={{
                  fontSize: '0.75rem',
                  marginTop: '0.3rem',
                  color: passwordMatch ? '#2dc997' : '#d33'
                }}>
                  {passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                </p>
              )}
            </div>

            <div className="form-section">
              <label>관리자 이름</label>
              <input type="text" className="form-input" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>

            <div className="form-section">
              <label>이메일</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="이메일 아이디"
                  value={emailLocal}
                  onChange={(e) => setEmailLocal(e.target.value)}
                  disabled={isEmailVerified}
                  style={{
                    flex: 1,
                    backgroundColor: isEmailVerified ? '#f5f5f5' : 'white',
                    color: '#333'
                  }}
                />
                <span>@</span>
                {customInput ? (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="도메인 입력"
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    disabled={isEmailVerified}
                    style={{
                      flex: 1,
                      backgroundColor: isEmailVerified ? '#f5f5f5' : 'white',
                      color: '#333'
                    }}
                  />
                ) : (
                  <select
                    className="form-input"
                    value={emailDomain}
                    onChange={handleDomainChange}
                    disabled={isEmailVerified}
                    style={{
                      flex: 1,
                      backgroundColor: isEmailVerified ? '#f5f5f5' : 'white',
                      color: '#333'
                    }}
                  >
                    <option value="">선택</option>
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="custom">직접 입력</option>
                  </select>
                )}
              </div>
            </div>

            <div className="form-section">
              <label>인증코드 입력</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6자리 인증코드"
                  disabled={!codeSent || isEmailVerified}
                  style={{
                    width: '100%',
                    backgroundColor: !codeSent || isEmailVerified ? '#f0f0f0' : 'white',
                    cursor: !codeSent || isEmailVerified ? 'not-allowed' : 'text'
                  }}
                />
                <button
                type="button"
                className="submit-button"
                onClick={codeSent ? handleVerifyCode : handleSendCode}
                style={{
                    backgroundColor: '#2dc997',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem',
                    width: '160px',
                    height: '40px',
                    cursor: 'pointer'
                }}
                >
                {isSendingCode ? '전송 중...' : codeSent ? '확인' : '인증코드 받기'}
                </button>
              </div>
              {codeSent && !isEmailVerified && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#777' }}>
                  남은 시간: {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                  {resendTimer === 0 && (
                    <button
                      onClick={handleResend}
                      type="button"
                      style={{ marginLeft: '1rem', border: 'none', background: 'none', color: '#2dc997', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      다시 보내기
                    </button>
                  )}
                </div>
              )}
            </div>
            {errorMessage && <p style={{ color: 'red', marginTop: '0.5rem' }}>{errorMessage}</p>}

            <button
                type="submit"
                className="submit-button"
                disabled={
                    !loginId ||
                    !idChecked ||
                    !password ||
                    password.length < 8 ||
                    password.length > 16 ||
                    passwordStrength === '약함' ||
                    !confirmPassword ||
                    !passwordMatch ||
                    !adminName ||
                    !emailLocal ||
                    !emailDomain ||
                    !isEmailVerified ||
                    isSubmitting
                }
                style={{
                    marginTop: '1rem',
                    backgroundColor:
                    !loginId ||
                    !idChecked ||
                    !password ||
                    password.length < 8 ||
                    password.length > 16 ||
                    passwordStrength === '약함' ||
                    !confirmPassword ||
                    !passwordMatch ||
                    !adminName ||
                    !emailLocal ||
                    !emailDomain ||
                    !isEmailVerified ||
                    isSubmitting
                        ? '#ccc'
                        : '#2dc997',
                    cursor:
                    !loginId ||
                    !idChecked ||
                    !password ||
                    password.length < 8 ||
                    password.length > 16 ||
                    passwordStrength === '약함' ||
                    !confirmPassword ||
                    !passwordMatch ||
                    !adminName ||
                    !emailLocal ||
                    !emailDomain ||
                    !isEmailVerified ||
                    isSubmitting
                        ? 'not-allowed'
                        : 'pointer'
                }}
                >
                {isSubmitting ? '회원가입 중...' : '회원가입 완료'}
                </button>
          </form>
        </div>
      </div>
    </>
  );
}

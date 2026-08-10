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
  const [successMessage, setSuccessMessage] = useState('');
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
    if (!emailLocal.trim() || !emailDomain.trim()) {
      setErrorMessage('Enter a complete email address before requesting a verification code.');
      return;
    }
    setIsSendingCode(true);
    setErrorMessage('');
    setSuccessMessage('');
    const fullEmail = `${emailLocal}@${emailDomain}`;
    try {
      const res = await fetch(apiUrl(`/api/email/send?email=${encodeURIComponent(fullEmail)}`), {
        method: 'POST',
      });
      if (res.ok) {
        setSuccessMessage('Verification code sent.');
        setCodeSent(true);
        setResendTimer(300);
      } else {
        setErrorMessage('Could not send the verification code. Please try again.');
      }
    } catch (error) {
      console.error('Email verification request failed:', error);
      setErrorMessage('Network error. Check your connection and try again.');
    } finally {
      setIsSendingCode(false);
    }
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
      setSuccessMessage('Email verified.');
      setErrorMessage('');
      setIsEmailVerified(true);
    } else {
      setErrorMessage('Verification failed. Check the code and try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!isEmailVerified) {
      setErrorMessage('Email verification is required.');
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
        setErrorMessage('Sign-up failed. Please review your details and try again.');
      }
    } catch (err) {
      setErrorMessage('A server error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="signup-layout" style={{ paddingTop: '10rem' }}>
        <div className="company-signup-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 className="form-title">Register company administrator</h2>

          <form onSubmit={handleSubmit}>
          <div className="form-section">
              <label>Username</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4–20 letters, numbers, or underscores"
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
                      setErrorMessage('Username must be 4–20 characters.');
                      return;
                    }
                    try {
                      const res = await fetch(apiUrl(`/api/companyadmins/check-id?loginId=${encodeURIComponent(loginId)}`));
                      if (res.ok) {
                        const data = await res.text();
                        setSuccessMessage(data);
                        setErrorMessage('');
                        if (data.includes('사용 가능한') || data.toLowerCase().includes('available')) {
                          setIdChecked(true);
                        }
                      } else {
                        setErrorMessage('Could not check username availability.');
                      }
                    } catch (err) {
                      setErrorMessage('Could not connect to the server.');
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
                  Check availability
                </button>
              </div>
            </div>

            <div className="form-section">
              <label>Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="8–16 characters with at least 3 character types"
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
                      setPasswordStrength('Weak');
                      setStrengthColor('#d33');
                    } else if (passed === 3) {
                      setPasswordStrength('Fair');
                      setStrengthColor('#f90');
                    } else {
                      setPasswordStrength('Strong');
                      setStrengthColor('#2dc997');
                    }

                    setPasswordMatch(val === confirmPassword);
                  }
                }}
                required
              />
              <p style={{ fontSize: '0.75rem', color: '#777', marginTop: '0.3rem' }}>
                Use 8–16 characters with at least 3 of uppercase, lowercase, numbers, and symbols.
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: password.length === 0 ? '#aaa' : strengthColor }}>
                Password strength: {password.length === 0 ? 'Not entered' : passwordStrength}
              </p>
            </div>

            <div className="form-section">
              <label>Confirm password</label>
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
                  {passwordMatch ? 'Passwords match.' : 'Passwords do not match.'}
                </p>
              )}
            </div>

            <div className="form-section">
              <label>Administrator name</label>
              <input type="text" className="form-input" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>

            <div className="form-section">
              <label>Email</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Email username"
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
                    placeholder="Enter domain"
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
                    <option value="">Select a domain</option>
                    <option value="naver.com">naver.com</option>
                    <option value="gmail.com">gmail.com</option>
                    <option value="daum.net">daum.net</option>
                    <option value="custom">Enter manually</option>
                  </select>
                )}
              </div>
            </div>

            <div className="form-section">
              <label>Verification code</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter the 6-digit code"
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
                {isSendingCode ? 'Sending...' : codeSent ? 'Verify' : 'Send code'}
                </button>
              </div>
              {codeSent && !isEmailVerified && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#777' }}>
                  Time remaining: {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                  {resendTimer === 0 && (
                    <button
                      onClick={handleResend}
                      type="button"
                      style={{ marginLeft: '1rem', border: 'none', background: 'none', color: '#2dc997', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Send again
                    </button>
                  )}
                </div>
              )}
            </div>
            {errorMessage && <p role="alert" style={{ color: '#b91c1c', marginTop: '0.5rem' }}>{errorMessage}</p>}
            {successMessage && <p role="status" aria-live="polite" style={{ color: '#166534', marginTop: '0.5rem' }}>{successMessage}</p>}

            <button
                type="submit"
                className="submit-button"
                disabled={
                    !loginId ||
                    !idChecked ||
                    !password ||
                    password.length < 8 ||
                    password.length > 16 ||
                    passwordStrength === 'Weak' ||
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
                    passwordStrength === 'Weak' ||
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
                    passwordStrength === 'Weak' ||
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
                {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
          </form>
        </div>
      </div>
    </>
  );
}

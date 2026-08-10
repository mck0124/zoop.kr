// 통합된 ApplicantSignupProcess 컴포넌트 코드입니다.
// 이메일 인증 + 아이디 중복확인 기능이 모두 포함됨

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { apiUrl } from '../../api/config';


export default function ApplicantSignupProcess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token: invitationToken } = useParams(); // URL 파라미터에서 초대 토큰 가져오기
  
  // ============ [초대 링크 관련 상태 변수들 추가] ============
  const [fromInvite, setFromInvite] = useState(false); // 초대 링크로 들어왔는지 여부
  const [isFormValid, setIsFormValid] = useState(false); // 폼 유효성 검사 결과
  const [isLoading] = useState(false); // 로딩 상태
  // ============ [초대 링크 관련 상태 변수들 추가 끝] ============
  //==================================================================================================

//==================================================================================================
// 이메일 인증
//==================================================================================================

// 1. 상태 정의
const [emailLocal, setEmailLocal] = useState(''); // 이메일 아이디 부분 (ex. user@example.com 중 'user')
const [emailDomain, setEmailDomain] = useState(''); // 이메일 도메인 부분 (ex. 'example.com')
const [customInput, setCustomInput] = useState(false); // 사용자가 직접 도메인을 입력하는지 여부
const [verificationCode, setVerificationCode] = useState(''); // 입력받은 인증 코드
const [isEmailVerified, setIsEmailVerified] = useState(false); // 이메일 인증 완료 여부
const [codeSent, setCodeSent] = useState(false); // 인증 코드가 전송되었는지 여부
const [resendTimer, setResendTimer] = useState(300); // 재전송 타이머 (단위: 초, 기본 5분)
const [isSendingCode, setIsSendingCode] = useState(false); // 인증 코드 전송 중 여부 (버튼 비활성화용)
const [errorMessage, setErrorMessage] = useState(''); // 에러메시지지

// ============ [누락된 상태 변수들 추가] ============
const [password, setPassword] = useState('');
const [passwordMessage, setPasswordMessage] = useState('');
const [isPasswordValid, setIsPasswordValid] = useState(false);
// [추가] 비밀번호 확인 관련 상태
const [passwordConfirm, setPasswordConfirm] = useState('');
const [passwordConfirmMessage, setPasswordConfirmMessage] = useState('');
const [isPasswordConfirmValid, setIsPasswordConfirmValid] = useState(false);
const [idCheck, setIdCheck] = useState('');
const [idMessage, setIdMessage] = useState('');
const [isIdAvailable, setIsIdAvailable] = useState(false);
const [allAgree, setAllAgree] = useState(false);
const [individualAgree, setIndividualAgree] = useState({
  terms: false,
  privacy: false,
  location: false,
  emailMarketing: false,
  smsMarketing: false,
});
  // ============ [누락된 상태 변수들 추가 끝] ============

  // ============ [폼 유효성 검사 useEffect 추가] ============
  useEffect(() => {
    // location.state에서 초대 정보 확인
    if (location.state?.fromInvite && location.state?.githubLogin) {
      setFromInvite(true);
      setIdCheck(location.state.githubLogin);
      setIsIdAvailable(true);
      setIdMessage('초대 링크를 통해 자동 설정된 아이디입니다.');
    }
    // 초대 토큰이 있으면 초대 링크로 들어온 것으로 간주
    else if (invitationToken) {
      setFromInvite(true);
      // 초대 토큰을 통해 GitHub 로그인 정보 가져오기
      const fetchInvitationInfo = async () => {
        try {
        const response = await fetch(apiUrl(`/api/invitations/clicked/${invitationToken}`), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.githubLogin) {
              setIdCheck(data.githubLogin);
              setIsIdAvailable(true);
              setIdMessage('초대 링크를 통해 자동 설정된 아이디입니다.');
            }
          }
        } catch (error) {
          console.error('초대 정보 가져오기 실패:', error);
        }
      };
      fetchInvitationInfo();
    }
  }, [invitationToken, location.state]);

  // ============ [초대 링크로 들어온 경우 쿼리파라미터 email 처리] ============
  useEffect(() => {
    if (fromInvite) {
      const params = new URLSearchParams(location.search);
      const email = params.get('email');
      if (email) {
        const [local, domain] = email.split('@');
        setEmailLocal(local);
        setEmailDomain(domain);
      }
    }
  }, [fromInvite, location.search]);
  // ============ [폼 유효성 검사 useEffect 추가 끝] ============

  // ============ [폼 유효성 검사 로직 추가] ============
  useEffect(() => {
    const validateForm = () => {
      // 기본 조건들
      const hasValidId = idCheck && isIdAvailable;
      const hasValidPassword = isPasswordValid;
      const hasValidPasswordConfirm = isPasswordConfirmValid;
      const hasRequiredAgreements = individualAgree.terms && individualAgree.privacy;
      const hasRequiredFields = document.getElementById('phone')?.value && document.getElementById('candidate_name')?.value;
      
      // 이메일 인증 조건 (초대 링크가 아닐 때만)
      const hasValidEmail = fromInvite || (emailLocal && emailDomain && isEmailVerified);
      
      const isValid = hasValidId && hasValidPassword && hasValidPasswordConfirm && 
                     hasRequiredAgreements && hasRequiredFields && hasValidEmail;
      
      setIsFormValid(isValid);
    };

    validateForm();
  }, [
    idCheck, isIdAvailable, isPasswordValid, isPasswordConfirmValid, 
    individualAgree.terms, individualAgree.privacy, fromInvite, 
    emailLocal, emailDomain, isEmailVerified
  ]);
  // ============ [폼 유효성 검사 로직 추가 끝] ============

/**
 * async : 비동기 함수를 명시할떄 사용, Promise를 반환한다. 
 * fetch : 네트워크 요청
 * await는 fetch가 완료될때까지 기다린다. 그 전에는 다른 코드가 실행되지 않는다.
 * encodeURIComponent : 안전한 형식으로 문자열을 인코딩(encoding)하는 내장함수
 */

// 2. 이메일 인증 코드 요청 함수
const handleSendCode = async () => {
  if (!emailLocal.trim() || !emailDomain.trim()) {
    setErrorMessage('Enter a complete email address before requesting a verification code.');
    return;
  }
  setIsSendingCode(true); // 전송 중 상태로 설정
  const fullEmail = `${emailLocal}@${emailDomain}`; // 전체 이메일 주소 조합
  try {
    const res = await fetch(apiUrl(`/api/email/send?email=${encodeURIComponent(fullEmail)}`), {
      method: 'POST',
    });

    if (res.ok) {
      alert('Verification code sent.');
      setErrorMessage('');
      setCodeSent(true); // 코드 전송 성공 시 상태 변경
      setResendTimer(300);
    } else {
      setErrorMessage('We could not send the verification code. Please try again.');
    }
  } catch (error) {
    console.error('Email verification request failed:', error);
    setErrorMessage('Network error. Check your connection and try again.');
  } finally {
    setIsSendingCode(false); // 전송 종료
  }
};

/**
 * useEffect는 리액트 함수형 컴포넌트에서 사이드 이펙트를 처리할 수 있게 도와주는 훅입니다. 
 * 사이드 이펙트란 컴포넌트 내에서 렌더링 외에 발생하는 모든 작업을 의미해요.
 *   첫 번째 인자로 사이드 이펙트 함수(콜백 함수)를 전달합니다.
 *   두 번째 인자로 의존성 배열을 전달할 수 있습니다. 이 배열 안에 들어있는 값들이 변경될 때마다 useEffect가 실행됩니다. 
 *   만약 배열이 비어 있다면, 컴포넌트가 마운트될 때 딱 한 번만 실행됩니다.
 */

// 3. 인증 코드 입력 후 타이머 작동
useEffect(() => {
  let timer;
  if (codeSent && !isEmailVerified && resendTimer > 0) {
    // 타이머 작동 조건: 코드 전송됨, 아직 인증되지 않음, 타이머 남아 있음.
    // 즉, codeSent=True, isEmailVerified=false이고, resendTimer > 0 일 때
    // set Interval(함수,  time) : time마다 함수를 한번씩 호출한다.
    timer = setInterval(() => {
      setResendTimer(prev => prev - 1); // 1초마다 타이머 감소
    }, 1000);
  }
  return () => clearInterval(timer); // 언마운트 또는 조건 해제 시 타이머 정리
}, [codeSent, resendTimer, isEmailVerified]);

  // 비밀번호 입력 시 유효성 검사
  // [수정] 비밀번호 입력 시 비밀번호 확인도 다시 체크
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    // 영문자+숫자 조합, 최소 8자리 (특수문자 선택적 포함 가능)
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{}\\|;:'"<>,.?/~]{8,}$/;
    if (regex.test(value)) {
      setPasswordMessage('Password meets the requirements.');
      setIsPasswordValid(true);
    } else {
      setPasswordMessage('Use at least 8 characters with letters and numbers. Special characters are optional.');
      setIsPasswordValid(false);
    }
    // 비밀번호가 바뀌면 비밀번호 확인도 다시 체크
    if (passwordConfirm.length > 0) {
      if (passwordConfirm === value) {
        setPasswordConfirmMessage('Passwords match.');
        setIsPasswordConfirmValid(true);
      } else {
        setPasswordConfirmMessage('Passwords do not match.');
        setIsPasswordConfirmValid(false);
      }
    }
  };

  // [추가] 비밀번호 확인 입력값 변경 핸들러
  const handlePasswordConfirmChange = (e) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    if (value === password && value.length > 0) {
      setPasswordConfirmMessage('Passwords match.');
      setIsPasswordConfirmValid(true);
    } else {
      setPasswordConfirmMessage('Passwords do not match.');
      setIsPasswordConfirmValid(false);
    }
  };

  // 이메일 인증 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setErrorMessage('Enter the verification code.');
      return;
    }
    const fullEmail = `${emailLocal}@${emailDomain}`;
    try {
      const res = await fetch(apiUrl(`/api/email/verify?email=${encodeURIComponent(fullEmail)}&code=${verificationCode}`), { method: 'POST' });
      if (res.ok) {
        alert('Email verified.');
        setErrorMessage('');
        setIsEmailVerified(true);
      } else {
        setErrorMessage('Verification failed. Check the code and try again.');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      setErrorMessage('Network error. Check your connection and try again.');
    }
  };

  const handleResend = async () => {
    setCodeSent(false);
    setResendTimer(300);
    setVerificationCode('');
    await handleSendCode();
  };

  // 아이디 중복 확인
  const checkDuplicateId = async () => {
    if (!idCheck.trim()) {
      setIdMessage('Enter a username.');
      setIsIdAvailable(false);
      return;
    }
    try {
      const res = await fetch(apiUrl(`/api/candidates/check-id?githubLogin=${idCheck}`));
      if (res.ok) {
        setIdMessage('Username is available.');
        setIsIdAvailable(true);
      } else {
        setIdMessage('Username is already in use.');
        setIsIdAvailable(false);
      }
    } catch (e) {
      setIdMessage('Could not check username availability.');
      setIsIdAvailable(false);
    }
  };

  // 약관 관련
  const handleAllAgreeChange = () => {
    const newAllAgree = !allAgree;
    setAllAgree(newAllAgree);
    setIndividualAgree({
      terms: newAllAgree,
      privacy: newAllAgree,
      location: newAllAgree,
      emailMarketing: newAllAgree,
      smsMarketing: newAllAgree,
    });
  };

  const handleIndividualAgreeChange = (event) => {
    const { name, checked } = event.target;
    setIndividualAgree((prev) => {
      const newState = { ...prev, [name]: checked };
      setAllAgree(Object.values(newState).every(Boolean));
      return newState;
    });
  };

  // 이메일 도메인 변경 핸들러
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

  //==================================================================================================
  // 가입하기 버튼 클릭했을 때
  //==================================================================================================
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!idCheck || !isIdAvailable) {
      setErrorMessage('Enter a username and check its availability.');
      return;
    }

    // [수정] 초대 링크가 아닐 때만 이메일 인증 검사
    if (!fromInvite && (!emailLocal || !emailDomain || !isEmailVerified)) {
      setErrorMessage('Verify your email before creating an account.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Check the password requirements.');
      return;
    }

    if (!isPasswordConfirmValid) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!individualAgree.terms || !individualAgree.privacy) {
      setErrorMessage('Agree to the required terms to continue.');
      return;
    }

    if (!document.getElementById('phone')?.value || !document.getElementById('candidate_name')?.value) {
      setErrorMessage('Complete all required fields.');
      return;
    }

  setErrorMessage(''); // 모든 조건 만족 시 에러메시지 초기화
    const formData = {
      githubLogin: idCheck,
      candidatePassword: document.getElementById('password').value,
      candidatePhoneNumber: document.getElementById('phone').value,
      candidateName: document.getElementById('candidate_name').value,
      candidateEmail: `${emailLocal}@${emailDomain}`,
      candidateRegistrationDate: new Date().toISOString(),
      candidateCreatedAt: new Date().toISOString(),
      candidateUpdatedAt: new Date().toISOString(),
      invitationToken: invitationToken,
    };
    try {

      const response = await fetch(apiUrl('/api/candidates/process'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {    //요청 성공 , 상태코드 200 ~ 299
        const candidateData = await response.json();
        
        // 초대 링크를 통해 들어온 경우 job_cand_progress 업데이트
        if (invitationToken) {
          try {
            const updateResponse = await fetch(apiUrl('/api/progress/update-candidate-id'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                invitationToken: invitationToken,
                candidateId: candidateData.candidateId
              }),
            });
            
            if (updateResponse.ok) {
              console.log('job_cand_progress candidate_id 업데이트 성공');
            } else {
              console.error('job_cand_progress candidate_id 업데이트 실패');
            }
          } catch (error) {
            console.error('job_cand_progress 업데이트 중 오류:', error);
          }
        }
        
        navigate('/auth/applicant/signup/success');
        // 원한다면 페이지 이동: window.location.href = '/welcome';
      } else {
        // 서버에서 보낸 에러 메시지 읽기
        const errorData = await response.text();
        console.error('서버 응답:', response.status, errorData);
        
        if (response.status === 400 || response.status === 500) {
          if (errorData.includes('이미 가입된 GitHub 계정입니다')) {
            alert('This GitHub account is already registered. Try another account.');
          } else if (errorData.includes('이미 가입된 이메일 주소입니다')) {
            alert('This email address is already registered. Try another email.');
          } else {
            alert('Something went wrong while creating your account: ' + errorData);
          }
        } else {
          alert('Account creation failed: ' + errorData);
        }
      }
    } catch (error) {   // fetch요청 자체가 실패한 경우
      console.error('오류 발생:', error);
      alert('Network error. Check your connection and try again.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20 pb-8 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create your ZOOP candidate account</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading invitation details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

        {/* 아이디 입력 */}
        <div>
          <label className="block mb-2 font-semibold">Username</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={idCheck}
              onChange={e => {
                if (!fromInvite) {
                  setIdCheck(e.target.value);
                  setIsIdAvailable(null);
                  setIdMessage('');
                }
              }}
              className={`flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors ${
                fromInvite ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
              }`}
              placeholder="4–20 letters, numbers, or underscores"
              disabled={fromInvite}
            />
            {!fromInvite && (
              <button
                type="button"
                onClick={checkDuplicateId}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
              >
                Check availability
              </button>
            )}
          </div>
          {idMessage && (
            <p className={`mt-1 text-sm ${isIdAvailable ? 'text-green-600' : 'text-red-500'}`}>{idMessage}</p>
          )}

        </div>

        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block mb-2 font-semibold">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="At least 8 characters with letters and numbers"
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
          />
          {passwordMessage && (
            <p className={`mt-1 text-sm ${isPasswordValid ? 'text-green-600' : 'text-red-500'}`}>
              {passwordMessage}
            </p>
          )}
        </div>
        {/* [추가] 비밀번호 확인 */}
        <div>
          <label htmlFor="passwordConfirm" className="block mb-2 font-semibold">Confirm password</label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={handlePasswordConfirmChange}
            placeholder="Enter your password again"
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
          />
          {passwordConfirmMessage && (
            <p className={`mt-1 text-sm ${isPasswordConfirmValid ? 'text-green-600' : 'text-red-500'}`}>
              {passwordConfirmMessage}
            </p>
          )}
        </div>

        {/* 이름 */}
        <div>
          <label htmlFor="candidate_name" className="block mb-2 font-semibold">Name</label>
          <input
            id="candidate_name"
            type="text"
            placeholder="Enter your name"
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
          />
        </div>

        {/* 휴대폰 */}
        <div>
          <label htmlFor="phone" className="block mb-2 font-semibold">Phone number</label>
          <input
            id="phone"
            type="text"
            placeholder="Numbers only, without hyphens"
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
          />
        </div>

        {/* 이메일 입력 */}
        {!fromInvite && (
          <div>
            <label className="block mb-2 font-semibold">Email</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={emailLocal}
                onChange={e => setEmailLocal(e.target.value)}
                disabled={isEmailVerified}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg bg-white text-base focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
              />
              <span className="text-lg font-semibold text-gray-600">@</span>
              {customInput ? (
                <input
                  type="text"
                  value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  disabled={isEmailVerified}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg bg-white text-base focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
                />
              ) : (
                <select
                  value={emailDomain}
                  onChange={handleDomainChange}
                  disabled={isEmailVerified}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg bg-white text-base focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
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
        )}

        {/* 인증코드 */}
        {!fromInvite && (
          <div>
            <label className="block mb-2 font-semibold">Verification code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="Enter the 6-digit code"
                disabled={!codeSent || isEmailVerified}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg bg-white focus:outline-none focus:border-sky-400 focus:ring-sky-200 transition-colors"
              />
              <button
                type="button"
                onClick={codeSent ? handleVerifyCode : handleSendCode}
                disabled={isSendingCode}
                className="bg-emerald-500 text-white w-32 py-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingCode ? 'Sending...' : codeSent ? 'Verify' : 'Send code'}
              </button>
            </div>
            {codeSent && !isEmailVerified && (
              <div className="text-sm text-gray-600 mt-2">
                Time remaining: {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                {resendTimer === 0 && (
                  <button type="button" onClick={handleResend} className="ml-2 text-green-600 underline">Send again</button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 약관 동의 */}
        <div className="border border-gray-200 p-4 rounded-xl bg-gray-50 mt-8">
          <label className="block font-semibold">
            <input type="checkbox" checked={allAgree} onChange={handleAllAgreeChange} className="mr-2" />
            Agree to all
          </label>
          <p className="text-sm text-gray-500">(Required) Includes the terms and privacy consent.</p>
          <div className="mt-3 space-y-2">
            {Object.entries(individualAgree).map(([key, value]) => (
              <label key={key} className="block text-sm">
                <input type="checkbox" name={key} checked={value} onChange={handleIndividualAgreeChange} className="mr-2" />
                {(key === 'terms' || key === 'privacy') ? '(Required)' : '(Optional)'} {
                  key === 'terms' ? 'Candidate terms' :
                  key === 'privacy' ? 'Privacy collection and use' :
                  key === 'location' ? 'Location-based service terms' :
                  key === 'emailMarketing' ? 'Marketing emails' :
                  'Marketing SMS/MMS'
                }
              </label>
            ))}
          </div>
        </div>

        {/* 에러 메시지 & 제출 버튼 */}
        {errorMessage && <p className="text-red-600 text-sm font-medium">⚠ {errorMessage}</p>}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`
            w-full py-3 rounded-2xl font-semibold
            ${isFormValid
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-emerald-500 opacity-50 text-white cursor-not-allowed'}
          `}
        >
          Create account
        </button>
      </form>
        )}
        </div>
      </div>
    </>
  );
}

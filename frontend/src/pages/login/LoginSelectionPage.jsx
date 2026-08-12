import React, { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import './LoginSelectionPage.css';
import '../auth/AuthPages.css';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { apiUrl } from '../../api/config';

function LoginSelectionPage() {
  const [userType, setUserType] = useState('candidate'); // 기본값 개인회원
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthState } = useAuth();
  const [searchParams] = useSearchParams(); // URL 쿼리 파라미터를 읽기 위한 훅 (소셜 로그인 에러 확인 등)

  // navigate state에서 githubLogin과 메시지 가져오기
  useEffect(() => {
    if (location.state?.githubLogin) {
      setLoginId(location.state.githubLogin);
    }
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location.state]);

  const socialConfig = {
    google: {
      // .env 파일에서 REACT_APP_GOOGLE_CLIENT_ID 환경 변수 값을 불러옴
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
       // .env 파일에서 REACT_APP_GOOGLE_REDIRECT_URI 환경 변수 값을 불러오거나 기본값 사용
      redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/social/google/callback`, // Google Cloud Console에 등록된 프론트엔드 콜백 URI
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', // Google 인증 요청 엔드포인트
      scope: 'email profile openid', // 요청할 권한 범위 (사용자 이메일, 프로필, 고유 ID)
      responseType: 'code', // OAuth 2.0 인가 코드 방식 사용
      accessType: 'offline', // 리프레시 토큰 발급 요청 (선택 사항, 자동 로그인 등에 활용)
       // prompt: 'consent', // 동의 화면 항상 표시 (개발 또는 테스트 시 유용)
    }
  };

  //-------------------------------------------------------------------------
  // 초대 링크 누르고 들어온 사람이 회원가입이 되어있는 경우 -> 지훈추가
  //-------------------------------------------------------------------------
  const fromInvite = location.state?.fromInvite || false;  // location.state가 존재하고 그 안에 fromInvite가 있으면 그 값을 쓰고, 없으면 false
  const presetGithubLogin = location.state?.githubLogin || ''; // 마찬가지로 state에서 넘어온 githubLogin이 있으면 쓰고, 없으면 빈 문자열로 초기화

  useEffect(() => {
    if (fromInvite && presetGithubLogin) {
      setLoginId(presetGithubLogin); // 👈 아이디 자동 기입
    }
  }, [fromInvite, presetGithubLogin]);

  //-------------------------------------------------------------------------

  useEffect(() => {
    const savedId = localStorage.getItem('savedLoginId');
    const savedType = localStorage.getItem('savedUserType');

    if (savedId && savedType) {
      setLoginId(savedId);
      setUserType(savedType);
      setRememberId(true);
    }

    // ✅ 2. URL 쿼리 파라미터에서 소셜 로그인 콜백 후 전달된 에러 정보 확인 및 표시
    // SocialLoginCallback 컴포넌트 등에서 navigate(`/auth/login?error=...`) 형태로 에러를 전달했을 때 처리
    const authError = searchParams.get('error');
    if (authError) {
        // URL 디코딩하여 에러 메시지 상태에 저장
        // 에러 메시지는 사용자에게 보여줄 적절한 형태로 가공하는 것이 좋습니다.
        const storedMessage = sessionStorage.getItem('zoopAuthMessage');
        const errorMessage = authError === 'session_expired'
          ? 'Your session expired. Please sign in again.'
          : authError === 'auth_required'
            ? 'Please sign in to continue.'
            : `Sign-in error: ${decodeURIComponent(authError)}`;
        setError(storedMessage || errorMessage);
        sessionStorage.removeItem('zoopAuthMessage');
        // 에러 정보가 표시된 후에는 URL에서 해당 파라미터를 제거하여 새로고침 시 중복 표시 방지
        // navigate 함수에 { replace: true } 옵션을 사용하여 현재 히스토리 항목을 대체합니다.
        navigate(window.location.pathname, { replace: true }); // 현재 경로로 이동하며 기록 대체
    }

  }, [searchParams, navigate]); // searchParams와 navigate가 변경될 때마다 이 Effect 재실행 (주소창 URL 변화 감지)

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginId || !password) {
      setError('Enter your username and password.');
      return;
    }

    // ✅ 현재는 기업회원만 로그인 허용
    // if (userType !== 'company') {
    //   setError('현재는 기업회원만 로그인할 수 있습니다.');
    //   return;
    // }

    setError('');

    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        loginId,
        password,
        userType
      });
      // 3. 백엔드 응답 처리
      // 응답 데이터에서 필요한 정보(JWT 토큰, 사용자 ID, 유형, 로그인 ID) 추출
      // const { token, userId, userType: receivedUserType, loginId: receivedLoginId } = response.data;
      const jwtToken = response.data.token;
      const receivedUserType = response.data.userType;
      const receivedUserId = response.data.userId;
      const receivedLoginId = response.data.loginId; 

      if (jwtToken) {
        setAuthState({
          token: jwtToken,
          userType: receivedUserType,
          userId: receivedUserId,
          loginId: receivedLoginId,
        });
        
        localStorage.setItem('jwtToken', jwtToken);
        localStorage.setItem('userType', receivedUserType);
        localStorage.setItem('userId', receivedUserId);
        localStorage.setItem('loginId', receivedLoginId);

        if (rememberId) {
          localStorage.setItem('savedLoginId', loginId);
          localStorage.setItem('savedUserType', userType);
        } else {
          localStorage.removeItem('savedLoginId');
          localStorage.removeItem('savedUserType');
        }

        // 초대 링크를 통한 로그인인 경우 candidate_id 업데이트
        if (location.state?.fromInvite && location.state?.token && receivedUserType === 'candidate') {
          try {
            // invitation 테이블 업데이트
            const invitationResponse = await fetch(apiUrl('/api/invitations/update-candidate-id'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: location.state.token,
                githubLogin: location.state.githubLogin
              })
            });
            
            if (invitationResponse.ok) {
              console.log('✅ Invitation candidate_id 업데이트 성공');
            } else {
              console.warn('⚠️ Invitation candidate_id 업데이트 실패:', await invitationResponse.text());
            }

            // job_cand_progress 테이블 업데이트
            const progressResponse = await fetch(apiUrl('/api/progress/update-candidate-id'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                invitationToken: location.state.token,
                candidateId: receivedUserId
              })
            });
            
            if (progressResponse.ok) {
              console.log('✅ JobCandProgress candidate_id 업데이트 성공');
            } else {
              console.warn('⚠️ JobCandProgress candidate_id 업데이트 실패:', await progressResponse.text());
            }
          } catch (error) {
            console.error('❌ candidate_id 업데이트 중 오류:', error);
          }
        }

        // 로그인 성공 시 바로 페이지 이동
        if(receivedUserType === 'candidate'){
          navigate('/candidate/dashboard', { replace: true });
        }else if(receivedUserType === 'company'){
          navigate('/company/dashboard', { replace: true });
        }
       
      } else {
        setError('Sign-in succeeded, but no authentication token was returned.');
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : 'Something went wrong while signing in.')
      );
    }
  };
  // == 소셜 로그인 시작 관련 헬퍼 함수 ==

  // CSRF 방지를 위한 랜덤 state 문자열 생성 함수 (Naver, GitHub 등에서 사용)
  // OAuth 2.0 명세에 따라 16자 이상의 충분히 무작위적인 문자열을 권장합니다.
  const generateRandomString = (length = 64) => {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => (byte % 36).toString(36)).join('');
  };

  const base64UrlEncode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const generatePkcePair = async () => {
    const verifier = generateRandomString(64);
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return { verifier, challenge: base64UrlEncode(digest) };
  };

  // ✅ == 소셜 로그인 시작 핸들러 ==
  // 사용자가 소셜 로그인 버튼을 클릭했을 때 해당 소셜 서비스의 인증 페이지로 브라우저를 리다이렉트시키는 함수
  const handleSocialLogin = async (provider) => {
    // 1. 클릭된 provider에 해당하는 설정 정보 가져오기
    const config = socialConfig[provider];
    // 필수 설정 정보 누락 확인
    if (!config || !config.clientId || !config.redirectUri || !config.authUrl) {
      console.error('소셜 로그인 설정 정보가 누락되었습니다:', provider, config);
      setError(`Social sign-in is not configured for ${provider}. Check the environment settings.`); // 사용자에게 오류 표시
      return; // 함수 실행 중단
    }

    let authUrl = ''; // 구성할 인증 요청 URL 변수
    // 2. 각 제공자(Naver, Google, GitHub)별 OAuth 2.0/OpenID Connect 인증 요청 URL 형식에 맞춰 파라미터를 구성
    // 모든 파라미터 값 (특히 redirect_uri, scope 등)은 encodeURIComponent()를 사용하여 URI 인코딩해야 안전합니다.
    if (provider === 'naver') {
      // Naver OAuth 2.0 인증 요청 URL 구성 예시
      const state = generateRandomString(); // CSRF 방지용 state 값 생성
      sessionStorage.setItem('oauth_state', state); // 생성된 state 값을 세션 스토리지에 저장 (콜백 페이지에서 검증)
      authUrl = `${config.authUrl}?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${state}`;
    } else if (provider === 'google') {
       // Google OAuth 2.0 / OpenID Connect 인증 요청 URL 구성 예시
       const state = generateRandomString();
       sessionStorage.setItem('oauth_state', state);
       const { verifier, challenge } = await generatePkcePair();
       sessionStorage.setItem('oauth_pkce_verifier', verifier);
       authUrl = `${config.authUrl}?response_type=${config.responseType}&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;
       // 추가 파라미터 (예: access_type=offline, prompt=consent 등)
       if (config.accessType) authUrl += `&access_type=${config.accessType}`;
       if (config.prompt) authUrl += `&prompt=${config.prompt}`;

    } else if (provider === 'github') {
        // GitHub OAuth Apps 인증 요청 URL 구성 예시
        const state = generateRandomString(); // CSRF 방지용 state 값 생성
         sessionStorage.setItem('oauth_state', state); // 생성된 state 값을 세션 스토리지에 저장 (콜백 페이지에서 검증)
        authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}`;

    } else {
        // socialConfig에 정의되지 않은 provider 이름이 handleSocialLogin 함수로 넘어온 경우
        console.error('지원하지 않는 소셜 로그인 제공자:', provider);
        setError(`Social sign-in is not supported for ${provider}.`);
        return;
    }

    // 3. 구성된 인증 URL로 브라우저를 리다이렉트
    if (authUrl) {
        // window.location.href를 사용하여 브라우저의 현재 페이지를 변경합니다.
      window.location.href = authUrl;
    } else {
        // authUrl 생성이 실패한 경우 (설정 오류 등)
        console.error('소셜 로그인 인증 URL 생성 중 오류 발생');
        setError('Could not create the social sign-in URL.');
    }
  };

  // 회원가입 버튼 텍스트와 이동 경로를 동적으로 결정하는 함수
  const getSignupInfo = () => {
    if (userType === 'candidate') {
      return {
        text: 'Sign up as a candidate',
        path: '/auth/applicant/signup/process'
      };
    } else {
      return {
        text: 'Sign up as a company',
        path: '/auth/company/signup/process'
      };
    }
  };

  // 회원가입 버튼 클릭 핸들러
  const handleSignupClick = () => {
    const signupInfo = getSignupInfo();
    navigate(signupInfo.path);
  };

  // == 컴포넌트 렌더링 부분 (JSX) ==

  return (
    <>
      {/* SEO 컴포넌트 */}
      <SEO
        title="Log in - ZOOP | AI recruiting platform"
        description="Log in to ZOOP to access evidence-based recruiting tools for candidates and companies."
        keywords="ZOOP login, AI recruiting, developer jobs, hiring platform"
        image="/login-banner.jpg"
        url="https://zoop.com/auth/login"
        type="website"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "ZOOP login",
          "description": "Log in to the ZOOP AI recruiting platform.",
          "url": "https://zoop.com/auth/login"
        }}
      />

      <Navbar />
      <div className="login-page-wrapper">
        <div className="login-container">
          <div className="login-left">
            <h2>Access the full ZOOP experience<br />with one secure login.</h2>
            <div className="zoop-logo">
              <img
                src="/logo_zoop.png"
                alt="logo"
                className="logo-img"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/')}
              />
            </div>
            <button type="button" className="signup-button" onClick={handleSignupClick}>
              {getSignupInfo().text}
            </button>
          </div>

          <div className="login-right">
            <div className="login-tabs">
              <button
                type="button"
                className={`tab-button ${userType === 'candidate' ? 'active' : ''}`}
                onClick={() => setUserType('candidate')}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`tab-button ${userType === 'company' ? 'active' : ''}`}
                onClick={() => setUserType('company')}
              >
                Company
              </button>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <input
                  type="text"
                  id="loginId"
                  placeholder="Username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  disabled={location.state?.fromInvite}
                  className={location.state?.fromInvite ? 'disabled-input' : ''}
                  required
                />
                {location.state?.fromInvite && (
                  <div className="input-note">
                    <small style={{ color: '#059669', fontSize: '12px' }}>
                      This username was set automatically from your invitation link.
                    </small>
                  </div>
                )}
              </div>
              <div className="input-group">
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* ✅ 체크박스 라벨 두 개를 감싸는 div 추가 */}
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberId}
                    onChange={(e) => setRememberId(e.target.checked)}
                  />
                  Remember username
                </label>
                <label className="checkbox-label"> {/* 인라인 스타일 제거 */}
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  />
                  Keep me signed in
                </label>
              </div> {/* ✅ div 종료 태그 */}


              <button type="submit" className="login-button">Log in</button>

              {error && <p className="error-message" >{error}</p>}

              <div className="find-links">
                <Link to="/find-id">Find username</Link>
                <span>|</span>
                <Link to="/find-password">Reset password</Link>
              </div>
            </form>
            <p className="signup-subtext">Or continue with a social account</p>
                <div className="social-icons"> 
                  <img src="/icons/naver.svg" alt="Continue with Naver" className="social-icon" onClick={() => handleSocialLogin('naver')}/>
                  <img src="/icons/kakao.svg" alt="Continue with Kakao" className="social-icon" onClick={() => handleSocialLogin('kakao')}/>
                  <img src="/icons/google.svg" alt="Continue with Google" className="social-icon" onClick={() => handleSocialLogin('google')}/>
                  <img src="/icons/facebook.svg" alt="Continue with Facebook" className="social-icon" onClick={() => handleSocialLogin('facebook')}/>
                  <img src="/icons/apple.svg" alt="Continue with Apple" className="social-icon" onClick={() => handleSocialLogin('apple')}/>
                </div> 
            </div> 

          
        </div>
      </div>
    </>
  );
}

export default LoginSelectionPage;

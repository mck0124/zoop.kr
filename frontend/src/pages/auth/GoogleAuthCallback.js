// frontend/src/pages/Auth/GoogleAuthCallback.js

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom'; // 필요한 훅 임포트
import axios from 'axios'; // 백엔드 통신을 위한 axios 임포트
import { useAuth } from '../../context/AuthContext'; // 인증 상태 관리를 위한 AuthContext 임포트
import { apiUrl } from '../../api/config';

// Google 소셜 로그인 콜백 처리 컴포넌트
function GoogleAuthCallback() {
    // URL의 쿼리 파라미터를 읽기 위한 훅 사용
    const [searchParams] = useSearchParams();
    // 페이지 이동을 위한 훅 사용
    const navigate = useNavigate();
    // AuthContext에서 인증 상태 업데이트 함수 가져오기
    const { setAuthState } = useAuth();

    // 로딩 상태 및 사용자에게 보여줄 메시지 상태
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Google 로그인 처리 중입니다...');
    // ✅ API 호출이 진행 중인지 추적하는 상태 추가
    const [isProcessing, setIsProcessing] = useState(false);

    // 컴포넌트가 마운트되거나 URL 쿼리 파라미터가 변경될 때 실행
    useEffect(() => {
        // URL에서 Google이 전달한 파라미터 추출
        const code = searchParams.get('code'); // OAuth 2.0 인가 코드
        const state = searchParams.get('state'); // 필요시 사용되는 상태 값 (PKCE 등)
        const error = searchParams.get('error'); // Google에서 발생한 오류 코드
        const errorDescription = searchParams.get('error_description'); // Google에서 발생한 상세 오류 설명
        // ✅ 이미 처리 중이라면 다시 실행하지 않음
        if (isProcessing) {
            return;
        }
        // 1. Google 인증 중 에러가 발생했는지 확인
        if (error) {
            console.error(`Google 로그인 콜백 오류:`, error, errorDescription);
            setMessage(`로그인 오류: ${errorDescription || error}`); // 사용자에게 표시할 메시지
            setLoading(false); // 로딩 상태 해제

            // 오류 정보를 로그인 페이지로 전달하여 표시하고 이동
            // replace: true 옵션으로 현재 콜백 페이지를 방문 기록에서 대체
            navigate(`/auth/login?error=${encodeURIComponent('Google login failed: ' + (errorDescription || error))}`, { replace: true });
            return; // 이후 로직 실행 중단
        }

        const storedState = sessionStorage.getItem('oauth_state');
        const pkceVerifier = sessionStorage.getItem('oauth_pkce_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_pkce_verifier');
        if (!state || !storedState || state !== storedState || !pkceVerifier) {
            setMessage('로그인 오류: 보안 검증에 실패했습니다. 다시 시도해주세요.');
            setLoading(false);
            navigate(`/auth/login?error=${encodeURIComponent('Google OAuth state validation failed.')}`, { replace: true });
            return;
        }


        // 2. 인가 코드(code)가 있는지 확인
        if (code) {
            setMessage('Google 인가 코드를 받아 백엔드에서 처리 중입니다...');
            // ✅ 처리 시작 상태로 설정하고 handleAuthCallback 호출
            setIsProcessing(true); // ✅ 처리 시작

            // 3. 백엔드로 인가 코드 전송하여 최종 인증 처리 요청
            handleAuthCallback(code, state, pkceVerifier);
        } else {
            // code 파라미터가 없는 경우 (예상치 못한 리다이렉트)
            console.error(`Google 인가 코드를 받지 못했습니다.`, Object.fromEntries(searchParams.entries()));
            setMessage('로그인 오류: 인가 코드 누락');
            setLoading(false);
            navigate(`/auth/login?error=${encodeURIComponent('Google authorization code missing.')}`, { replace: true });
        }

    }, [searchParams]); // searchParams, navigate, setAuthState가 변경될 때마다 Effect 재실행

    // 인가 코드를 백엔드로 전송하고 응답을 처리하는 비동기 함수
    const handleAuthCallback = async (code, state, pkceVerifier) => {
        try {
            setMessage('백엔드에서 Google 로그인 처리 중...');
            // ✅ 백엔드의 Google 소셜 로그인 콜백 API 엔드포인트 호출
            // Axios POST 요청으로 인가 코드(code)를 백엔드에 전달합니다.
            // URL 경로는 백엔드 AuthController에 정의된 엔드포인트와 일치해야 합니다.
            // {provider} 자리에 'google'을 넣어줍니다.
            const response = await axios.post(apiUrl('/api/auth/social/google/callback'), {
                code: code, // 인가 코드 전송
                state: state, // 필요시 state 값 전송
                pkceCodeVerifier: pkceVerifier,
            });

            // 4. 백엔드 응답 처리
            // 백엔드에서 자체 JWT 토큰 및 사용자 정보를 응답받음
            const { token, userId, userType, loginId } = response.data;

            // 5. 응답에 토큰이 있는지 확인하고 로그인 성공 처리
            if (token) {
                setLoading(false); // 로딩 상태 해제

                // AuthContext 상태 업데이트
                setAuthState({ token, userId, userType, loginId });

                // localStorage에 인증 정보 저장
                localStorage.setItem('jwtToken', token);
                localStorage.setItem('userType', userType); // 백엔드에서 받은 최종 userType 저장 (e.g., 'candidate')
                localStorage.setItem('userId', userId);
                localStorage.setItem('loginId', loginId); // 백엔드에서 정의한 소셜 로그인 사용자의 loginId (e.g., 'google_12345')

                // 백엔드에서 받은 사용자 유형에 따라 적절한 대시보드 페이지로 이동
                 if (userType === 'candidate') {
                    navigate('/candidate/dashboard', { replace: true }); // 개인회원 대시보드 경로 (예시)
                } else if (userType === 'company') {
                    navigate('/company/dashboard', { replace: true }); // 기업회원 대시보드 경로 (예시, 소셜 로그인이 기업회원으로 가입되는 경우)
                } else {
                     console.warn("Google 로그인 성공 후 알 수 없는 사용자 유형 수신:", userType);
                    navigate('/', { replace: true }); // 예상치 못한 userType일 경우 기본 페이지로 이동
                }

            } else {
                // 백엔드에서 응답은 왔지만 토큰이 누락된 경우
                console.error('백엔드에서 Google 로그인 토큰을 받지 못했습니다.', response.data);
                 setMessage('로그인 처리 중 오류 발생: 백엔드 응답에 토큰 누락');
                 setLoading(false);
                 setIsProcessing(false); // ✅ 처리 완료 후 플래그 해제
                 navigate(`/auth/login?error=${encodeURIComponent('Token missing from backend response.')}`, { replace: true });
            }

        } catch (err) {
            // 6. 백엔드 API 호출 중 오류 발생 (네트워크, 백엔드 내부 오류 등)
            console.error('Google 로그인 백엔드 호출 중 오류 발생:', err.response?.data || err.message || err);
            setMessage(`로그인 처리 중 오류 발생: ${err.response?.data || err.message}`); // 사용자에게 오류 메시지 표시
             setLoading(false);
             // 오류 정보를 로그인 페이지로 전달하여 표시
             setIsProcessing(false); // ✅ 처리 완료 후 플래그 해제
             navigate(`/auth/login?error=${encodeURIComponent('Google login processing failed: ' + (err.response?.data || err.message))}`, { replace: true });
        }
    };

    // == 컴포넌트 렌더링 부분 ==
    // 로딩 중 또는 처리 결과 메시지를 보여주는 간단한 UI
    return (
        <div className="social-login-callback-page">
            {loading ? (
                 <div className="loading-indicator">
                     <p>{message}</p>
                     {/* 필요하다면 로딩 스피너 이미지 또는 CSS 애니메이션 추가 */}
                 </div>
            ) : (
                 <div className="process-complete-message">
                      <p>{message}</p>
                      {/* 오류 발생 시 사용자에게 추가 정보나 링크를 제공할 수 있습니다. */}
                 </div>
            )}
            {/* 에러 메시지를 별도로 표시할 필요는 없습니다. navigate로 로그인 페이지에 전달합니다. */}
        </div>
    );
}

export default GoogleAuthCallback; // 컴포넌트 내보내기

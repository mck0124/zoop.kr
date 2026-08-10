import axios from 'axios';
import { API_BASE_URL, isTrustedApiUrl } from './config';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 토큰을 자동으로 헤더에 추가
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token && isTrustedApiUrl(config.url || config.baseURL, API_BASE_URL)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 자동 로그아웃
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized 에러 (토큰 만료 또는 유효하지 않은 토큰)
    if (error.response && error.response.status === 401 && !window.location.pathname.startsWith('/auth/login')) {
      console.log('JWT 토큰이 만료되었습니다. 자동 로그아웃을 실행합니다.');
      
      // Persist the message for the login screen instead of blocking the user
      // with a browser alert from an interceptor.
      const responseMessage = error.response.data?.message || error.response.data;
      sessionStorage.setItem(
        'zoopAuthMessage',
        typeof responseMessage === 'string' ? responseMessage : 'Your session expired. Please sign in again.'
      );
      
      // 로컬 스토리지에서 인증 정보 제거
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginId');
      
      // 로그인 페이지로 리다이렉트
      window.location.href = '/auth/login?error=session_expired';
    }
    
    return Promise.reject(error);
  }
);

export default instance;

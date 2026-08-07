// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../api/config';

// 1. Context 객체 생성
const AuthContext = createContext();

// 2. Provider 컴포넌트 정의
export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState({
      token: null,
      userType: null,
      userId: null,
      loginId: null,
      // 필요한 경우 사용자 이름 등 추가 정보 필드
    });

    const [bookmarkedPostIds, setBookmarkedPostIds] = useState([]);

    const [isInitialized, setIsInitialized] = useState(false);

    // JWT 토큰 만료 확인 함수
    const isTokenExpired = (token) => {
      if (!token) return true;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
      } catch (error) {
        console.error('토큰 파싱 오류:', error);
        return true;
      }
    };

    // 자동 로그아웃 함수
    const autoLogout = (showAlert = true) => {
      console.log('토큰이 만료되어 자동 로그아웃을 실행합니다.');
      
      if (showAlert) {
        alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      // 로컬 스토리지에서 인증 관련 정보 제거
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginId');
      // 필요한 경우 userName 등 추가 정보 제거

      // authState 상태 초기화
      setAuthState({
        token: null,
        userType: null,
        userId: null,
        loginId: null,
        // 필요한 경우 추가 정보 필드도 null로 초기화
      });

      // 로그인 페이지로 리다이렉트
      window.location.href = '/auth/login';
    };

    useEffect(() => {
      const token = localStorage.getItem('jwtToken');
      const userType = localStorage.getItem('userType');
      const userId = localStorage.getItem('userId');
      const loginId = localStorage.getItem('loginId');
      // 필요한 경우 userName 등 추가 정보 로드

      if (token && userType && userId && loginId) {
        // 토큰 만료 확인
        if (isTokenExpired(token)) {
          console.log('저장된 토큰이 만료되었습니다.');
          autoLogout(false); // 초기 로드 시에는 알림 표시하지 않음
          return;
        }
        
        setAuthState({ token, userType, userId, loginId }); // 필요한 정보 포함
        
        // 북마크 목록 로드
        fetchBookmarks(userId);
      }
      setIsInitialized(true); // ✅ 상태 복원 완료 표시
    }, []);

    // 북마크 목록 가져오기
    const fetchBookmarks = async (userId) => {
      if (!userId) {
        setBookmarkedPostIds([]);
        return;
      }
      try {
        const res = await fetch(apiUrl(`/api/bookmarks/candidate/${userId}`));
        if (res.ok) {
          const data = await res.json();
          setBookmarkedPostIds(data.map(bookmark => bookmark.postId));
        }
      } catch (error) {
        console.error('북마크 로드 오류:', error);
      }
    };

    // 토큰 만료 감지를 위한 주기적 체크 (5분마다)
    useEffect(() => {
      if (!authState.token) return;

      const checkTokenExpiry = () => {
        if (isTokenExpired(authState.token)) {
          autoLogout(true); // 주기적 체크 시에는 알림 표시
        }
      };

      // 초기 체크
      checkTokenExpiry();

      // 5분마다 토큰 만료 확인
      const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }, [authState.token]);

    // ✅ 로그아웃 함수 정의
    const logout = () => {
      // 로컬 스토리지에서 인증 관련 정보 제거
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      localStorage.removeItem('loginId');
      // 필요한 경우 userName 등 추가 정보 제거

      // authState 상태 초기화
      setAuthState({
        token: null,
        userType: null,
        userId: null,
        loginId: null,
        // 필요한 경우 추가 정보 필드도 null로 초기화
      });

      // 북마크 상태 초기화
      setBookmarkedPostIds([]);
    };

    // 북마크 토글 함수
    const toggleBookmark = async (postId) => {
      const userId = authState.userId;
      if (!userId) {
        alert('로그인이 필요합니다.');
        return;
      }

      const isBookmarked = bookmarkedPostIds.includes(postId);
      
      try {
        if (isBookmarked) {
          const response = await fetch(apiUrl(`/api/bookmarks?candidateId=${userId}&postId=${postId}`), {
            method: 'DELETE' 
          });
          if (response.ok) {
            await fetchBookmarks(userId);
          } else {
            console.error('북마크 삭제 실패');
          }
        } else {
          const response = await fetch(apiUrl('/api/bookmarks'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ candidateId: userId, postId })
          });
          if (response.ok) {
            await fetchBookmarks(userId);
          } else {
            console.error('북마크 추가 실패');
          }
        }
      } catch (error) {
        console.error('북마크 토글 오류:', error);
      }
    };

    return (
      // ✅ value prop에 logout 함수 포함
      <AuthContext.Provider value={{ 
        authState, 
        setAuthState, 
        isInitialized, 
        logout, 
        bookmarkedPostIds, 
        toggleBookmark,
        fetchBookmarks: () => fetchBookmarks(authState.userId)
      }}>
        {children}
      </AuthContext.Provider>
    );
  }


// 4. Custom hook for easy access
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // useAuth 훅이 AuthProvider 내부에서 사용되지 않았을 때 오류 발생
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

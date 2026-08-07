import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLoadingSkeleton } from '../components/LoadingSkeleton';

export default function PrivateRoute({ children, allowedUserType }) {
  const { authState, isInitialized } = useAuth();

  // 인증 상태가 확정되기 전에는 아무것도 렌더링하지 않음 (로딩 스피너 등으로 대체 가능)
  if (!isInitialized) return <MainLoadingSkeleton />;

  // 토큰이 없으면 로그인 페이지로 이동
  if (!authState.token) {
    return <Navigate to="/auth/login" replace />;
  }

  // userType이 맞지 않으면 로그인 페이지로 이동
  if (allowedUserType && authState.userType !== allowedUserType) {
    return <Navigate to="/auth/login" replace />;
  }

  // 인증 상태가 확정된 후에만 children 렌더링
  return children;
}

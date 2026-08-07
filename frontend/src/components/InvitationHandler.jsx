import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { apiUrl } from '../api/config';

export default function InvitationHandler() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 추가
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleInvitation = async () => {
      try {
        // 1. 백엔드에 토큰 정보 요청
        const response = await fetch(apiUrl(`/api/invitations/clicked/${encodeURIComponent(token)}`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('초대 링크가 유효하지 않습니다.');
        }

        const data = await response.json();
        const { githubLogin, isSignedUp } = data;
        
        // 2. 회원가입 여부에 따라 적절한 페이지로 리다이렉트
        if (isSignedUp) {
          // 이미 회원가입된 경우 -> 로그인 페이지로 이동 (아이디 자동 기입)
          navigate('/auth/login', {
            replace: true,
            state: {
              fromInvite: true,
              githubLogin: githubLogin,
              message: '초대 링크를 통해 접속하셨습니다. 로그인해주세요.'
            }
          });
        } else {
          // 회원가입되지 않은 경우 -> 회원가입 페이지로 이동
          navigate(`/auth/applicant/signup/process/${token}${location.search}`, {
            replace: true,
            state: {
              fromInvite: true,
              githubLogin: githubLogin
            }
          });
        }
      } catch (error) {
        console.error('초대 링크 처리 오류:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    if (token) {
      handleInvitation();
    } else {
      setError('유효하지 않은 초대 링크입니다.');
      setLoading(false);
    }
  }, [token, navigate, location.search]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #28a745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#666' }}>
            초대 링크를 확인하는 중입니다...
          </p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⚠️</div>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>오류가 발생했습니다</h2>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </>
    );
  }

  return null;
}

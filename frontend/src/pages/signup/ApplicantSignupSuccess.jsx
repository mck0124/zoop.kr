import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function SignupSuccess() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#2dc997' }}>🎉 Sign-up complete!</h2>
        <p style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#333' }}>
          Your candidate account has been created successfully.
        </p>
        <button
          onClick={() => navigate('/auth/login')}
          style={{
            marginTop: '2rem',
            backgroundColor: '#e0f7ea',
            color: '#111',
            fontWeight: '600',
            fontSize: '0.95rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '999px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: 'none'
          }}
        >
          <span role="img" aria-label="arrow">👉</span> Go to log in
        </button>
      </div>
    </>
  );
}

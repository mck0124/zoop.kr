import React from 'react';

// 메인 페이지 로딩 스켈레톤
export const MainLoadingSkeleton = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#ffffff',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* 배경 애니메이션 효과 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 80%, rgba(30, 225, 174, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(48, 197, 155, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(22, 196, 94, 0.1) 0%, transparent 50%)',
      animation: 'pulse 4s ease-in-out infinite'
    }} />
    
    {/* 메인 로딩 컨테이너 */}
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '3rem 2.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(30, 225, 174, 0.1)',
      textAlign: 'center',
      position: 'relative',
      zIndex: 10,
      minWidth: '320px',
      maxWidth: '400px',
      animation: 'slideInUp 0.6s ease-out'
    }}>
      {/* 로고 아이콘 */}
      <div style={{
        width: '80px',
        height: '80px',
        margin: '0 auto 2rem',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* 외부 링 */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '3px solid #e2e8f0',
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
        
        {/* 내부 링 */}
        <div style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          border: '3px solid transparent',
          borderTop: '3px solid #30c59b',
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite'
        }} />
        
        {/* 중앙 아이콘 */}
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #30c59b 0%, #22c55e 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(48, 197, 155, 0.3)',
          animation: 'bounce 2s ease-in-out infinite'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      {/* 브랜드 이름 */}
      <div style={{
        fontSize: '2rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #30c59b 0%, #22c55e 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem',
        letterSpacing: '-0.02em'
      }}>
        ZOOP
      </div>
      
      {/* 로딩 메시지 */}
      <div style={{
        fontSize: '1.1rem',
        color: '#64748b',
        fontWeight: '500',
        marginBottom: '2rem',
        lineHeight: '1.5'
      }}>
        Loading your workspace
      </div>
      
      {/* 진행 바 */}
      <div style={{
        width: '100%',
        height: '6px',
        background: '#f1f5f9',
        borderRadius: '3px',
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #30c59b 0%, #22c55e 100%)',
          borderRadius: '3px',
          animation: 'progress 2s ease-in-out infinite',
          width: '30%'
        }} />
      </div>
      
      {/* 점 애니메이션 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #30c59b 0%, #22c55e 100%)',
              animation: `bounce 1.4s ease-in-out infinite ${i * 0.16}s`
            }}
          />
        ))}
      </div>
    </div>
    
    {/* CSS 애니메이션 스타일 */}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.05); }
      }
      
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
      
      @keyframes slideInUp {
        0% { 
          opacity: 0; 
          transform: translateY(30px); 
        }
        100% { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `}</style>
  </div>
);

// 카드 스켈레톤 컴포넌트
export const CardSkeleton = ({ count = 3 }) => (
  <div style={{ padding: '1rem' }}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          animation: 'slideInUp 0.6s ease-out'
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            marginRight: '1rem'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              height: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              width: '60%'
            }} />
            <div style={{
              height: '12px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              width: '40%'
            }} />
          </div>
        </div>
        
        {/* 내용 */}
        <div style={{
          height: '14px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '0.5rem'
        }} />
        <div style={{
          height: '14px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          marginBottom: '0.5rem',
          width: '80%'
        }} />
        <div style={{
          height: '14px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '60%'
        }} />
      </div>
    ))}
    
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
      
      @keyframes slideInUp {
        0% { 
          opacity: 0; 
          transform: translateY(20px); 
        }
        100% { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `}</style>
  </div>
);

// 테이블 스켈레톤 컴포넌트
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }}>
    {/* 테이블 헤더 */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '1rem',
      padding: '1rem',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0'
    }}>
      {Array.from({ length: columns }).map((_, index) => (
        <div
          key={index}
          style={{
            height: '16px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px'
          }}
        />
      ))}
    </div>
    
    {/* 테이블 행 */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
          padding: '1rem',
          borderBottom: '1px solid #f1f5f9'
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            style={{
              height: '14px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              width: colIndex === 0 ? '80%' : '100%'
            }}
          />
        ))}
      </div>
    ))}
    
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
    `}</style>
  </div>
);

// 간단한 스피너 컴포넌트
export const SimpleSpinner = ({ size = 'medium', color = '#30c59b' }) => {
  const sizeMap = {
    small: '24px',
    medium: '32px',
    large: '48px'
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: `3px solid #f3f4f6`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// 대시보드 스켈레톤 컴포넌트
export const DashboardSkeleton = () => (
  <div style={{ padding: '2rem' }}>
    {/* 헤더 */}
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        height: '32px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '8px',
        width: '300px',
        marginBottom: '1rem'
      }} />
      <div style={{
        height: '16px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        width: '200px'
      }} />
    </div>
    
    {/* 통계 카드들 */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            height: '20px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            width: '60%',
            marginBottom: '1rem'
          }} />
          <div style={{
            height: '32px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            width: '40%'
          }} />
        </div>
      ))}
    </div>
    
    {/* 차트 영역 */}
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '2rem'
    }}>
      <div style={{
        height: '24px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        width: '200px',
        marginBottom: '2rem'
      }} />
      <div style={{
        height: '300px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '8px'
      }} />
    </div>
    
    {/* 최근 활동 */}
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        height: '24px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        width: '150px',
        marginBottom: '1.5rem'
      }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          padding: '1rem',
          border: '1px solid #f3f4f6',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            marginRight: '1rem'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              height: '16px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              width: '70%'
            }} />
            <div style={{
              height: '12px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              width: '50%'
            }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 폼 스켈레톤 컴포넌트
export const FormSkeleton = () => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    maxWidth: '600px',
    margin: '2rem auto'
  }}>
    {/* 제목 */}
    <div style={{
      height: '32px',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200px 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '4px',
      width: '250px',
      marginBottom: '2rem'
    }} />
    
    {/* 폼 필드들 */}
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} style={{ marginBottom: '1.5rem' }}>
        <div style={{
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '120px',
          marginBottom: '0.5rem'
        }} />
        <div style={{
          height: '48px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }} />
      </div>
    ))}
    
    {/* 버튼 */}
    <div style={{
      height: '48px',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200px 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '8px',
      width: '120px',
      marginTop: '2rem'
    }} />
  </div>
);

// 리스트 스켈레톤 컴포넌트
export const ListSkeleton = ({ items = 5 }) => (
  <div style={{ padding: '1rem' }}>
    {/* 헤더 */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    }}>
      <div style={{
        height: '28px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        width: '200px'
      }} />
      <div style={{
        height: '40px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '8px',
        width: '120px'
      }} />
    </div>
    
    {/* 리스트 아이템들 */}
    {Array.from({ length: items }).map((_, index) => (
      <div
        key={index}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              height: '20px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              width: '60%'
            }} />
            <div style={{
              height: '14px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200px 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              width: '40%'
            }} />
          </div>
          <div style={{
            height: '32px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '6px',
            width: '80px'
          }} />
        </div>
      </div>
    ))}
  </div>
);

// 프로필 스켈레톤 컴포넌트
export const ProfileSkeleton = () => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    maxWidth: '800px',
    margin: '2rem auto'
  }}>
    {/* 프로필 헤더 */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: '2rem'
    }}>
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200px 100%',
        animation: 'shimmer 1.5s infinite',
        marginRight: '2rem'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          height: '32px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '200px',
          marginBottom: '1rem'
        }} />
        <div style={{
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '150px',
          marginBottom: '0.5rem'
        }} />
        <div style={{
          height: '16px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '100px'
        }} />
      </div>
    </div>
    
    {/* 섹션들 */}
    {['Basic information', 'Experience', 'Technical skills'].map((section, index) => (
      <div key={index} style={{ marginBottom: '2rem' }}>
        <div style={{
          height: '24px',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200px 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: '4px',
          width: '120px',
          marginBottom: '1rem'
        }} />
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            height: '16px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200px 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            width: `${80 - i * 10}%`
          }} />
        ))}
      </div>
    ))}
  </div>
);

export default MainLoadingSkeleton;

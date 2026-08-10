import React from 'react';
import { useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa';

const iconStyle = {
  width: 22,
  height: 22,
  marginRight: 8,
  color: '#30C59B',
  flexShrink: 0
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '1.08rem',
  color: '#222',
  fontWeight: 500,
  marginBottom: 2
};

const valueStyle = {
  fontSize: '1.08rem',
  color: '#444',
  marginLeft: 30,
  marginBottom: 16,
  maxWidth: '400px',
  wordBreak: 'break-word'
};

const ResumeBasicInfoSection = ({ form }) => {
  const [photo, setPhoto] = useState(null);
  const photoInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  return (
    <section className="resume-section">
      <h3>Basic information</h3>
      <div style={{ position: 'relative', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 }}>
          {/* 좌측: 기본 정보 */}
          <div style={{ flex: '1', minWidth: 0, maxWidth: '600px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* 이름 */}
              <div>
                <div style={labelStyle}>
                  {/* User SVG */}
                  <svg style={iconStyle} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6"/></svg>
                  <span>Name</span>
                </div>
                <div style={valueStyle}>{form.name || '-'}</div>
              </div>
              {/* 이메일 */}
              <div>
                <div style={labelStyle}>
                  {/* Mail SVG */}
                  <svg style={iconStyle} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/></svg>
                  <span>Email</span>
                </div>
                <div style={valueStyle}>{form.email || '-'}</div>
              </div>
              {/* 전화번호 */}
              <div>
                <div style={labelStyle}>
                  {/* Phone SVG */}
                  <svg style={iconStyle} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.08 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>Phone</span>
                </div>
                <div style={valueStyle}>{form.phone || '-'}</div>
              </div>
            </div>
          </div>
          {/* 우측: 증명사진 업로드 */}
          <div style={{ position: 'absolute', top: 48, right: 52, width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <div
              style={{ width: 110, height: 140, borderRadius: 12, background: '#f4f4f4', border: '1.5px solid #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, cursor: 'pointer', position: 'relative' }}
              onClick={() => photoInputRef.current?.click()}
              title="Upload profile photo"
            >
              {photo ? (
                <img src={photo} alt="Candidate profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <FaPlus style={{ fontSize: 32, color: '#bbb', marginBottom: 6 }} />
                  <span style={{ color: '#bbb', fontSize: 13 }}>Upload profile photo</span>
                </div>
              )}
              {/* 오버레이 플러스(이미지 있을 때, 마우스 오버 시) */}
              {photo && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.18)',
                    color: '#fff',
                    opacity: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 600,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none',
                  }}
                  className="photo-hover-overlay"
                >
                  <FaPlus style={{ fontSize: 28, color: '#fff' }} />
                </div>
              )}
            </div>
            {photo && (
              <button
                type="button"
                style={{ background: '#eee', color: '#888', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer' }}
                onClick={handlePhotoRemove}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBasicInfoSection;

import React, { useState, useEffect } from 'react';

const CameraDebug = ({ onClose }) => {
  const [cameraInfo, setCameraInfo] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [browserInfo, setBrowserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const gatherInfo = async () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        permissions: !!navigator.permissions,
        secureContext: window.isSecureContext,
      };

      setBrowserInfo(info);

      // 권한 상태 확인
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          setPermissionStatus({
            camera: cameraPermission.state,
            microphone: microphonePermission.state,
          });
        } catch (err) {
          setPermissionStatus({ error: err.message });
        }
      }

      // 카메라 정보 확인
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          const audioDevices = devices.filter(device => device.kind === 'audioinput');
          
          setCameraInfo({
            videoDevices: videoDevices.map(device => ({
              deviceId: device.deviceId,
              label: device.label || 'Unknown Camera',
              groupId: device.groupId,
            })),
            audioDevices: audioDevices.map(device => ({
              deviceId: device.deviceId,
              label: device.label || 'Unknown Microphone',
              groupId: device.groupId,
            })),
          });
        } catch (err) {
          setCameraInfo({ error: err.message });
        }
      }

      setLoading(false);
    };

    gatherInfo();
  }, []);

  const testCamera = async () => {
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      setFeedback({ type: 'success', message: 'Camera test passed. Your camera and microphone are working.' });
      
      // 스트림 정리
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setFeedback({ type: 'error', message: `Camera test failed: ${err.message}` });
    }
  };

  const requestPermissions = async () => {
    setFeedback(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setFeedback({ type: 'success', message: 'Permission granted. Devices are ready to use.' });
      stream.getTracks().forEach(track => track.stop());
      window.location.reload(); // 페이지 새로고침하여 상태 업데이트
    } catch (err) {
      setFeedback({ type: 'error', message: `Permission request failed: ${err.message}` });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        정보를 수집하고 있습니다...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        maxHeight: '80vh',
        overflow: 'auto',
        width: '90%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#333' }}>카메라 디버그 정보</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>
        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 8, color: feedback.type === 'error' ? '#9b1c1c' : '#087f5b', background: feedback.type === 'error' ? '#fff1f2' : '#ecfdf5' }}>
            {feedback.message}
          </div>
        )}

        {/* 브라우저 정보 */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#333', marginBottom: 10 }}>브라우저 정보</h3>
          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 14 }}>
            <div><strong>User Agent:</strong> {browserInfo.userAgent}</div>
            <div><strong>Platform:</strong> {browserInfo.platform}</div>
            <div><strong>Language:</strong> {browserInfo.language}</div>
            <div><strong>Secure Context:</strong> {browserInfo.secureContext ? '✅ Yes' : '❌ No'}</div>
            <div><strong>MediaDevices API:</strong> {browserInfo.mediaDevices ? '✅ Available' : '❌ Not Available'}</div>
            <div><strong>getUserMedia:</strong> {browserInfo.getUserMedia ? '✅ Available' : '❌ Not Available'}</div>
            <div><strong>Permissions API:</strong> {browserInfo.permissions ? '✅ Available' : '❌ Not Available'}</div>
          </div>
        </div>

        {/* 권한 상태 */}
        {permissionStatus && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#333', marginBottom: 10 }}>권한 상태</h3>
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 14 }}>
              {permissionStatus.error ? (
                <div style={{ color: '#ff6b6b' }}>권한 확인 오류: {permissionStatus.error}</div>
              ) : (
                <>
                  <div><strong>카메라:</strong> {permissionStatus.camera}</div>
                  <div><strong>마이크:</strong> {permissionStatus.microphone}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 카메라 정보 */}
        {cameraInfo && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#333', marginBottom: 10 }}>카메라 정보</h3>
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 14 }}>
              {cameraInfo.error ? (
                <div style={{ color: '#ff6b6b' }}>카메라 정보 확인 오류: {cameraInfo.error}</div>
              ) : (
                <>
                  <div><strong>비디오 장치:</strong> {cameraInfo.videoDevices.length}개</div>
                  {cameraInfo.videoDevices.map((device, index) => (
                    <div key={index} style={{ marginLeft: 10, marginTop: 5 }}>
                      {index + 1}. {device.label}
                    </div>
                  ))}
                  <div style={{ marginTop: 10 }}><strong>오디오 장치:</strong> {cameraInfo.audioDevices.length}개</div>
                  {cameraInfo.audioDevices.map((device, index) => (
                    <div key={index} style={{ marginLeft: 10, marginTop: 5 }}>
                      {index + 1}. {device.label}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={testCamera}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: 'none',
              background: '#30C59B',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            카메라 테스트
          </button>
          <button
            onClick={requestPermissions}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: 'none',
              background: '#007bff',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            권한 요청
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: 'white',
              color: '#666',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            새로고침
          </button>
        </div>

        {/* 해결 방법 */}
        <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 6 }}>
          <h4 style={{ marginBottom: 10, color: '#333' }}>일반적인 해결 방법:</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
            <li>브라우저 주소창 옆의 카메라/마이크 아이콘 클릭하여 권한 허용</li>
            <li>다른 프로그램에서 카메라를 사용 중이라면 종료</li>
            <li>Chrome, Firefox, Safari 등 최신 브라우저 사용</li>
            <li>HTTPS 환경에서 접속 (로컬 개발 시 localhost는 허용됨)</li>
            <li>브라우저 캐시 및 쿠키 삭제</li>
            <li>브라우저 재시작</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CameraDebug;

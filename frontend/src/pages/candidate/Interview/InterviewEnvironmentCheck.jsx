import React, { useEffect, useRef, useState } from 'react';
import './InterviewEnvironmentCheck.css';
import { useNavigate, useParams } from 'react-router-dom';
import CameraDebug from '../../../components/CameraDebug';

const SENTENCES = [
  'I can handle any challenge.',
  'I will do my best today.',
  'I approach challenges with a positive mindset.',
  'I am not afraid of new challenges.',
  'I enjoy growing together with my teammates.'
];

// Slide data for 2/4, 3/4, 4/4
const SLIDES = [
  {
    step: 1,
    title: 'Preparation time and\nrecording time are separate.',
    desc: 'Your answer is recorded only after preparation time ends.',
    img: process.env.PUBLIC_URL + '/images/talkingopinions.svg',
    button: 'Next',
  },
  {
    step: 2,
    title: 'Review the question and\nprepare your answer.',
    desc: 'Recording starts automatically when preparation time ends.',
    img: process.env.PUBLIC_URL + '/images/People-Working-Illustrations@4x.png',
    button: 'Start interview',
  },
];

function InterviewGuideSlides({ onStart }) {
  const [current, setCurrent] = useState(0); // 0: 1/2, 1: 2/2
  const [timeLeft, setTimeLeft] = useState(600); // 10분 = 600초
  const navigate = useNavigate();
  const { id } = useParams(); // scheduleId, if available
  const slide = SLIDES[current];

  // 카운트다운 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleStartInterview();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // Countdown intentionally starts once; handleStartInterview is the stable screen action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // slide가 undefined일 때 예외 방지 (모든 hook 호출 이후에 위치)
  if (!slide) return null;

  // 시간을 MM:SS 형식으로 변환
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = () => {
    // 면접 세션 페이지로 이동 (예: /interview-session/:id)
    if (id) {
      navigate(`/interview-session/${id}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
      <div style={{ background: 'white', borderRadius: 32, boxShadow: '0 12px 48px rgba(0,0,0,0.12)', padding: 48, width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 탭/진행 표시 */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ flex: 1, display: 'flex', gap: 24, fontWeight: 600, fontSize: 18 }}>
            <span style={{ color: '#222' }}>Guide <b>({slide.step}/2)</b></span>
          </div>
          <div style={{ background: '#f4f8ff', color: '#30C59B', fontWeight: 700, fontSize: 18, borderRadius: 12, padding: '6px 22px' }}>{formatTime(timeLeft)}</div>
        </div>
        {/* 제목/설명 */}
        <div style={{ fontWeight: 800, fontSize: 22, textAlign: 'center', marginBottom: 8, color: '#222', whiteSpace: 'pre-line' }}>
          {slide.title}
        </div>
        <div style={{ color: '#bbb', fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
          {slide.desc}
        </div>
        {/* 일러스트/이미지 */}
        <div style={{ width: 320, height: 200, background: '#f8f9fa', borderRadius: 18, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
          <img src={slide.img} alt="Interview guide illustration" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        {/* 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: current === 1 ? 32 : 0 }}>
          {current !== 0 && (
            <button onClick={() => setCurrent(current - 1)} style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f9f3', border: 'none', color: '#30C59B', fontSize: 28, cursor: 'pointer' }}>←</button>
          )}
          {/* 네비 dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1].map((i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i === current ? '#30C59B' : '#d1fae5', display: 'inline-block' }}></span>
            ))}
          </div>
          {/* 오른쪽 화살표(다음) 버튼은 current !== 1에서만 보이게 */}
          {current !== 1 && (
            <button onClick={() => setCurrent(current + 1)} style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f9f3', border: 'none', color: '#30C59B', fontSize: 28, cursor: 'pointer' }}>→</button>
          )}
        </div>
        {/* 2/2에서만 면접 시작하기 버튼 노출 */}
        {current === 1 && (
          <button
            onClick={handleStartInterview}
            style={{ width: 'auto', padding: '16px 32px', borderRadius: 20, border: 'none', background: '#30C59B', color: 'white', fontWeight: 600, fontSize: 18, cursor: 'pointer', marginTop: 8 }}
          >
            {slide.button}
          </button>
        )}
      </div>
    </div>
  );
}

function InterviewEnvironmentCheck({ onComplete }) {
  const [step, setStep] = useState('ready'); // 'ready' | 'testing' | 'result' | 'guide'
  const [selectedSentence, setSelectedSentence] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [voiceSuccess, setVoiceSuccess] = useState(false);
  const [faceSuccess, setFaceSuccess] = useState(false); // 카메라 성공 여부
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [, setCameraLoading] = useState(true);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [, setTestTimer] = useState(0);
  const [, setVoiceDetected] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setSelectedSentence(SENTENCES[Math.floor(Math.random() * SENTENCES.length)]);
  }, [step]);

  useEffect(() => {
    async function startMedia() {
      try {
        setCameraLoading(true);
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('This browser does not support camera access.');
        }
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true
        });
        setStream(userStream);
        setFaceSuccess(true);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
          videoRef.current.onloadedmetadata = () => {
            setCameraLoading(false);
          };
          console.log('videoRef.current:', videoRef.current);
          console.log('userStream:', userStream);
        } else {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = userStream;
              videoRef.current.onloadedmetadata = () => {
                setCameraLoading(false);
              };
              console.log('videoRef.current (retry):', videoRef.current);
              console.log('userStream (retry):', userStream);
            }
          }, 100);
        }
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(userStream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
      } catch (err) {
        console.error('카메라 접근 오류:', err);
        setCameraLoading(false);
        setFaceSuccess(false);
        
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access was denied. Allow camera permission in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera was found. Check that a camera is connected.');
        } else if (err.name === 'NotReadableError') {
          setCameraError('The camera is being used by another app. Close it and try again.');
        } else {
          setCameraError(`Camera access failed: ${err.message}`);
        }
      }
    }
    startMedia();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line
  // handleStartInterview is stable for this screen; the timer should be created once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 'testing') return;
    let timer = 0;
    let detected = false;
    function updateLevel() {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setMicLevel(avg);
      if (avg > 15) detected = true;
      timer += 1;
      setTestTimer(timer);
      if (timer < 60) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      } else {
        setVoiceDetected(detected);
        setVoiceSuccess(detected);
        setStep('result');
      }
    }
    setTestTimer(0);
    setVoiceDetected(false);
    animationFrameRef.current = requestAnimationFrame(updateLevel);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [step]);

  const handleStartTest = () => {
    setStep('testing');
  };
  const handleRetry = () => {
    setStep('ready');
    setVoiceSuccess(false);
    setVoiceDetected(false);
    setMicLevel(0);
  };

  const retryCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    
    // 기존 스트림 정리
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // 새 스트림 시작
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      setStream(userStream);
      setFaceSuccess(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraLoading(false);
        };
      }
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(userStream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
    } catch (err) {
      console.error('카메라 재시도 오류:', err);
      setCameraLoading(false);
      setFaceSuccess(false);
      setCameraError('Camera retry failed. Refresh the page or try another browser.');
    }
  };
  const handleComplete = () => {
    setShowGuide(true);
    setStep('guide');
  };
  const handleGuideStart = () => {
    if (onComplete) onComplete();
  };

  const faceStatus = faceSuccess
    ? { icon: '🟩', text: 'Face detected', color: '#30C59B', bg: '#e6f9f3', desc: 'Keep your face within the camera frame during the interview.' }
    : { icon: '🟥', text: 'Face not detected', color: '#ff4d4f', bg: '#ffeaea', desc: 'Adjust the camera so your face is clearly visible.' };
  const voiceStatus = voiceSuccess
    ? { icon: '🟩', text: 'Voice detected', color: '#30C59B', bg: '#e6f9f3', desc: 'Keep your voice at a consistent volume.' }
    : { icon: '🟥', text: 'Voice not detected', color: '#ff4d4f', bg: '#ffeaea', desc: 'Adjust your microphone or speak a little louder.' };

  const mainMsg = step === 'result'
    ? (faceSuccess && voiceSuccess ? 'Your camera and microphone are ready.' : 'We could not detect your voice clearly.')
    : 'Read the sentence below clearly.';
  const subMsg = step === 'result'
    ? ''
    : 'We are checking that your camera and microphone work properly.';

  if (showGuide || step === 'guide') {
    return <InterviewGuideSlides onStart={handleGuideStart} />;
  }

  // 디버그 모달 표시
  if (showDebug) {
    return <CameraDebug onClose={() => setShowDebug(false)} />;
  }

  // 카메라 에러가 있을 때
  if (cameraError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: 24, 
          boxShadow: '0 12px 48px rgba(0,0,0,0.12)', 
          padding: 48, 
          width: 500, 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>📹</div>
          <h2 style={{ color: '#ff6b6b', marginBottom: 16, fontSize: 24, fontWeight: 700 }}>
            Camera access error
          </h2>
          <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6, fontSize: 16 }}>
            {cameraError}
          </p>
          <div style={{ 
            background: '#f8f9fa', 
            padding: 20, 
            borderRadius: 12, 
            marginBottom: 32,
            textAlign: 'left',
            fontSize: 14,
            color: '#555'
          }}>
            <h4 style={{ marginBottom: 12, color: '#333' }}>Try these steps:</h4>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Click the camera icon near the browser address bar and allow access</li>
              <li>Close other apps that may be using the camera</li>
              <li>Refresh or restart the browser</li>
              <li>Use a current version of Chrome, Firefox, or Safari</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button
              onClick={retryCamera}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#30C59B',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Try again
            </button>
            <button
              onClick={() => setShowDebug(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '1px solid #007bff',
                background: 'white',
                color: '#007bff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Debug details
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: 'white',
                color: '#666',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
      <div style={{ background: 'white', borderRadius: 32, boxShadow: '0 12px 48px rgba(0,0,0,0.12)', padding: 56, width: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 22, textAlign: 'center', marginBottom: 16, color: '#222' }}>{mainMsg}</div>
        {subMsg && <div style={{ color: '#888', fontSize: 18, textAlign: 'center', marginBottom: 32 }}>{subMsg}</div>}
        {step !== 'result' && (
          <div style={{ marginBottom: 32, fontSize: 22, color: '#30C59B', fontWeight: 700, textAlign: 'center', minHeight: 32 }}>
            "{selectedSentence}"
          </div>
        )}
        <div style={{ position: 'relative', width: 480, height: 300, marginBottom: 24 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: 480,
              height: 300,
              background: '#000',
              borderRadius: 20,
              objectFit: 'cover'
            }}
          />
        </div>
        {step === 'result' && (
          <div style={{ width: '100%', marginBottom: 32, background: '#fff', borderRadius: 16, border: '1px solid #f0f0f0', padding: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ flex: 1, background: faceStatus.bg, color: faceStatus.color, borderRadius: 12, padding: '20px 16px', margin: 12, marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, gap: 8, flexDirection: 'column' }}>
                <span style={{ fontSize: 28 }}>{faceStatus.icon}</span> 
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>{faceStatus.text}</span>
                <div style={{ fontWeight: 400, fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center', lineHeight: '1.4', letterSpacing: '-0.2px', whiteSpace: 'pre-line' }}>{faceStatus.desc}</div>
              </div>
              <div style={{ flex: 1, background: voiceStatus.bg, color: voiceStatus.color, borderRadius: 12, padding: '20px 16px', margin: 12, marginLeft: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, gap: 8, flexDirection: 'column' }}>
                <span style={{ fontSize: 28 }}>{voiceStatus.icon}</span> 
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>{voiceStatus.text}</span>
                <div style={{ fontWeight: 400, fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center', lineHeight: '1.4', letterSpacing: '-0.2px', whiteSpace: 'pre-line' }}>{voiceStatus.desc}</div>
              </div>
            </div>
          </div>
        )}
        {step === 'ready' && (
          <button
            onClick={handleStartTest}
            style={{ width: '100%', padding: '22px 0', borderRadius: 20, border: 'none', background: '#30C59B', color: 'white', fontWeight: 700, fontSize: 22, cursor: 'pointer', marginTop: 12, marginBottom: 12 }}
          >
            Check setup
          </button>
        )}
        {step === 'result' && (
          <div style={{ display: 'flex', width: '100%', gap: 24 }}>
            <button
              onClick={handleComplete}
              disabled={!(faceSuccess && voiceSuccess)}
              style={{ flex: 1, padding: '20px 0', borderRadius: 20, border: 'none', background: '#30C59B', color: 'white', fontWeight: 700, fontSize: 20, cursor: faceSuccess && voiceSuccess ? 'pointer' : 'not-allowed', transition: 'background 0.18s' }}
            >
              Continue
            </button>
            <button
              onClick={handleRetry}
              style={{ flex: 1, padding: '20px 0', borderRadius: 20, border: 'none', background: '#444', color: 'white', fontWeight: 700, fontSize: 20, cursor: 'pointer', transition: 'background 0.18s' }}
            >
              Try again
            </button>
          </div>
        )}
        {/* 마이크 레벨 바: 카드 하단 */}
        <div style={{ width: '100%', marginTop: 40 }}>
          <div style={{
            width: '100%',
            height: 18,
            borderRadius: 9,
            background: '#e6f9f3',
            overflow: 'hidden',
            boxShadow: '0 2px 12px #30C59B22'
          }}>
            <div style={{
              width: `${Math.min(micLevel * 3, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #30C59B 60%, #6ee7b7 100%)',
              borderRadius: 9,
              transition: 'width 0.15s'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default InterviewEnvironmentCheck;

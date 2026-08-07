import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../api/config';

// InterviewSession.jsx: 2-column layout (left: question/timer, right: video), auto think/answer phase with timer and recording

const THINK_TIME = 30;  // 생각시간: 30초
const ANSWER_TIME = 60; // 답변시간: 2분 (120초)

const InterviewSession = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRef = useRef(null);

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState('think'); // 'think' | 'answer' | 'done'
  const [timer, setTimer] = useState(THINK_TIME);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // TTS 초기화
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechRef.current = window.speechSynthesis;
    }
  }, []);

  // TTS로 질문 읽기
  const speakQuestion = (text) => {
    if (!speechRef.current || !text) return;
    
    // 이전 음성 중지
    speechRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // 속도 조절 (0.1 ~ 10)
    utterance.pitch = 1; // 음높이 조절 (0 ~ 2)
    utterance.volume = 1; // 볼륨 (0 ~ 1)
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechRef.current.speak(utterance);
  };

  // 질문 다시 듣기
  const replayQuestion = () => {
    if (questions[currentIdx]) {
      speakQuestion(questions[currentIdx]);
    }
  };

  // 질문 가져오기
  useEffect(() => {
    if (!scheduleId) return;
    
    // scheduleId가 유효한 숫자인지 확인
    const scheduleIdNum = parseInt(scheduleId);
    if (isNaN(scheduleIdNum)) {
      setError('유효하지 않은 면접 일정 ID입니다.');
      return;
    }
    
    fetch(apiUrl(`/api/interview-videos/questions/${scheduleIdNum}`))
      .then(res => {
        if (!res.ok) throw new Error('질문을 불러오지 못했습니다');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('생성된 면접 질문이 없습니다. 면접 담당자에게 질문 생성을 다시 요청해주세요.');
        }
        setError('');
        setQuestions(data);
      })
      .catch(e => setError(e.message));
  }, [scheduleId]);

  // 질문 변경 시 TTS 재생
  useEffect(() => {
    if (questions[currentIdx] && phase === 'think') {
      // 1초 후에 질문 읽기 (사용자가 준비할 시간)
      const timer = setTimeout(() => {
        speakQuestion(questions[currentIdx]);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentIdx, phase, questions]);

  // 카메라 프리뷰 연결
  useEffect(() => {
    if (!questions.length) return undefined;
    let isMounted = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저에서는 카메라와 마이크를 사용할 수 없습니다. 최신 브라우저에서 다시 시도해주세요.');
      return undefined;
    }
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 },
        facingMode: 'user'
      }, 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })
      .then((stream) => {
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      })
      .catch((err) => {
        console.error('미디어 접근 오류:', err);
        if (err.name === 'NotAllowedError') {
          setError('카메라와 마이크 접근이 거부되었습니다. 브라우저에서 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('카메라나 마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해주세요.');
        } else {
          setError('미디어 접근에 실패했습니다: ' + err.message);
        }
      });
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      speechRef.current?.cancel();
    };
  }, [questions.length]);

  // phase & timer 관리
  useEffect(() => {
    if (!questions.length || phase === 'done') return;
    if (timer <= 0) {
      if (phase === 'think') {
        setPhase('answer');
        setTimer(ANSWER_TIME);
      } else if (phase === 'answer') {
        setPhase('upload');
      }
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, phase, questions.length]);

  // answer phase에서만 녹화 시작/종료
  useEffect(() => {
    if (phase === 'answer') {
      if (streamRef.current) {
        if (!window.MediaRecorder) {
          setError('이 브라우저에서는 면접 녹화를 지원하지 않습니다. 최신 Chrome, Safari 또는 Edge를 사용해주세요.');
          return;
        }
        const clonedStream = streamRef.current.clone();
        try {
          const mimeType = window.MediaRecorder.isTypeSupported?.('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : undefined;
          const recorder = mimeType
            ? new window.MediaRecorder(clonedStream, { mimeType })
            : new window.MediaRecorder(clonedStream);
          recorderRef.current = recorder;
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
            uploadVideo(blob);
            clonedStream.getTracks().forEach(track => track.stop());
          };
          recorder.start();
          setRecording(true);
        } catch {
          clonedStream.getTracks().forEach(track => track.stop());
          setError('면접 녹화를 시작하지 못했습니다. 카메라 권한과 브라우저 설정을 확인해주세요.');
        }
      }
    } else if (phase === 'upload') {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
        setRecording(false);
      }
    }
    // eslint-disable-next-line
  }, [phase]);

  useEffect(() => () => {
    speechRef.current?.cancel();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  // 업로드 함수
  const uploadVideo = async (blob) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('videoFile', blob, `interview_${scheduleId}_q${currentIdx + 1}.webm`);
    formData.append('scheduleId', scheduleId);
    formData.append('questionNumber', currentIdx + 1);
    formData.append('questionContent', questions[currentIdx]);
    try {
      const res = await fetch(apiUrl('/api/interview-videos/upload'), {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('업로드 실패');
      // 다음 질문으로
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(idx => idx + 1);
        setPhase('think');
        setTimer(THINK_TIME);
      } else {
        setPhase('done');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  // 면접 완료 후 2초 뒤 자동 이동
  useEffect(() => {
    if (phase === 'done') {
      const timeout = setTimeout(() => {
        navigate('/candidate/dashboard');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [phase, navigate]);

  // 안내 메시지
  let statusMsg = '';
  if (phase === 'think') statusMsg = '답변을 준비하세요.';
  else if (phase === 'answer') statusMsg = recording ? '답변을 녹화 중입니다...' : '녹화 준비 중...';
  else if (phase === 'upload') statusMsg = uploading ? '업로드 중...' : '업로드 준비 중...';
  else if (phase === 'done') statusMsg = '면접이 완료되었습니다!';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: 1100, minHeight: 620, background: 'white', borderRadius: 32, boxShadow: '0 8px 32px rgba(48,197,155,0.10)', overflow: 'hidden' }}>
        {/* 왼쪽: 질문/타이머/진행 */}
        <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', position: 'relative' }}>
          {/* 진행 바 */}
          <div style={{ width: '100%', marginBottom: 32 }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#30C59B', marginBottom: 8, letterSpacing: 1 }}>질문 진행</div>
            <div style={{ width: '100%', height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${questions.length ? ((currentIdx+1)/questions.length)*100 : 0}%`, height: '100%', background: 'linear-gradient(90deg,#30C59B 60%,#6ee7b7 100%)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'right' }}>{questions.length ? `${currentIdx+1} / ${questions.length}` : ''}</div>
          </div>
          
          {/* 질문 */}
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: '#222', textAlign: 'center', minHeight: 48 }}>
            {questions[currentIdx] || '질문을 불러오는 중...'}
          </div>
          
          {/* TTS 컨트롤 */}
          {phase === 'think' && questions[currentIdx] && (
            <div style={{ marginBottom: 18 }}>
              <button
                onClick={replayQuestion}
                disabled={isSpeaking}
                style={{
                  background: isSpeaking ? '#ccc' : '#30C59B',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSpeaking ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSpeaking ? (
                  <>
                    <span>🔊</span> 읽는 중...
                  </>
                ) : (
                  <>
                    <span>🔊</span> 질문 다시 듣기
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* 타이머/상태 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            {phase !== 'done' && (
              <div style={{ fontSize: 44, fontWeight: 800, color: '#30C59B', letterSpacing: 1, minWidth: 80, textAlign: 'center' }}>{timer}초</div>
            )}
            <div style={{ fontSize: 16, color: '#fff', background: phase === 'think' ? '#30C59B' : phase === 'answer' ? '#1976d2' : phase === 'upload' ? '#fbc02d' : '#aaa', borderRadius: 16, padding: '6px 18px', fontWeight: 600, letterSpacing: 1, boxShadow: '0 2px 8px #30C59B22' }}>
              {phase === 'think' && '준비 시간'}
              {phase === 'answer' && '답변 시간'}
              {phase === 'upload' && '업로드 중'}
              {phase === 'done' && '완료'}
            </div>
          </div>
          {/* 안내 메시지 */}
          <div style={{ color: '#888', fontSize: 16, marginBottom: 0, minHeight: 24 }}>{statusMsg}</div>
          {error && <div style={{ color: '#e74c3c', marginTop: 18, fontWeight: 600 }}>{error}</div>}
        </div>
        {/* 오른쪽: 비디오 */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222', position: 'relative' }}>
          <div style={{ width: 420, height: 320, background: '#111', borderRadius: 24, boxShadow: '0 4px 24px #0002', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '5px solid #30C59B' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', borderRadius: 18 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;

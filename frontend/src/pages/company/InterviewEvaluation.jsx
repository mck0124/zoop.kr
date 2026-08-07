import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import SEO from '../../components/SEO';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { apiUrl } from '../../api/config';

// SVG 아이콘 컴포넌트 (단색, 흰색/회색)
const LightbulbIcon = ({size=28, color='#bbb'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.3.3.5.7.5 1.1V17a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-1.9c0-.4.2-.8.5-1.1A7 7 0 0 0 12 2z"/></svg>
);
const ChatIcon = ({size=28, color='#bbb'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const WrenchIcon = ({size=28, color='#bbb'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.7 19.3l-2.4-2.4a1 1 0 0 0-1.4 0l-2.1 2.1a7 7 0 1 1 2.1-2.1l2.1-2.1a1 1 0 0 0 0-1.4l-2.4-2.4"/></svg>
);
const StarIcon = ({size=28, color='#bbb'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2"/></svg>
);
const BookIcon = ({size=28, color='#bbb'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M16 2v4"/><path d="M8 2v4"/></svg>
);
const CATEGORY_SVGS = {
  '전문성': <LightbulbIcon color="#bbb" />, '의사소통': <ChatIcon color="#bbb" />, '의사소통 능력': <ChatIcon color="#bbb" />, '문제해결': <WrenchIcon color="#bbb" />, '문제해결 능력': <WrenchIcon color="#bbb" />, '자신감': <StarIcon color="#bbb" />, '자신감과 태도': <StarIcon color="#bbb" />, '경험의 구체성': <BookIcon color="#bbb" />
};

export default function InterviewEvaluation() {
  const { postId, candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  const [evaluation, setEvaluation] = useState({
    adminIntrvwScore: '',
    adminIntrvwNotes: '',
    adminIntrvwSlctStatus: 'pending'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCandidateData();
    fetchInterviewVideos();
    fetchAnalysisResult();
    fetchExistingEvaluation();
  }, [candidateId]);

  const fetchCandidateData = async () => {
    try {
      const response = await fetch(apiUrl(`/api/progress/job-cand-progress/${candidateId}/with-candidate`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCandidate(data);
      }
    } catch (error) {
      console.error('후보자 정보 조회 실패:', error);
    }
  };

  const fetchInterviewVideos = async () => {
    try {
      const response = await fetch(apiUrl(`/api/interview-videos/by-job-candidate/${candidateId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('면접 영상 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisResult = async () => {
    try {
      // jobCandidateId로 직접 면접 분석 결과 조회
      const response = await fetch(apiUrl(`/api/analysis/${candidateId}/interview`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('면접 분석 결과:', data);
        setAnalysisResult(data);
      } else {
        console.log('면접 분석 결과가 없습니다.');
      }
    } catch (error) {
      console.error('면접 분석 결과 조회 실패:', error);
    }
  };

  const fetchExistingEvaluation = async () => {
    try {
      const response = await fetch(apiUrl(`/api/admin-interview-evaluations/${candidateId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExistingEvaluation(data);
        // 기존 평가가 있으면 폼에 설정
        setEvaluation({
          adminIntrvwScore: data.adminIntrvwScore?.toString() || '',
          adminIntrvwNotes: data.adminIntrvwNotes || '',
          adminIntrvwSlctStatus: data.adminIntrvwSlctStatus || 'pending'
        });
      }
    } catch (error) {
      console.error('기존 평가 조회 실패:', error);
    }
  };

  // 분석 데이터 파싱 함수
  const parseAnalysisData = (analysisData) => {
    if (!analysisData) return null;
    try {
      console.log('파싱할 분석 데이터:', analysisData);
      
      // JSON 형태인 경우 파싱 (새 구조)
      if (typeof analysisData === 'string' && analysisData.trim().startsWith('{')) {
        const parsed = JSON.parse(analysisData);
        console.log('파싱된 JSON:', parsed);
        
        // 새 구조: analysis.categories, analysis.total_feedback, analysis.visualization
        if (parsed.analysis && parsed.analysis.categories && Array.isArray(parsed.analysis.categories)) {
          return {
            categories: parsed.analysis.categories,
            totalScore: parsed.analysis.visualization?.score_distribution?.current || parsed.score || null,
            totalFeedback: parsed.analysis.total_feedback || null,
            visualization: parsed.analysis.visualization || null
          };
        }
        
        // 직접 categories가 있는 경우
        if (parsed.categories && Array.isArray(parsed.categories)) {
          return {
            categories: parsed.categories,
            totalScore: parsed.visualization?.score_distribution?.current || parsed.score || null,
            totalFeedback: parsed.total_feedback || null,
            visualization: parsed.visualization || null
          };
        }
      }
      
      // 구버전 파싱 로직 (텍스트 기반)
      const lines = analysisData.split('\n');
      const categories = [];
      let totalScore = 0;
      let overallEvaluation = '';
      for (const line of lines) {
        if (line.includes('점 -')) {
          const match = line.match(/(.+):\s*(\d+)점\s*-\s*(.+)/);
          if (match) {
            const category = match[1].trim();
            const score = parseInt(match[2]);
            const reason = match[3].trim();
            categories.push({ category, score, reason });
            totalScore += score;
          }
        } else if (line.includes('총점:')) {
          const match = line.match(/총점:\s*(\d+)점/);
          if (match) {
            totalScore = parseInt(match[1]);
          }
        } else if (line.includes('종합평가:')) {
          overallEvaluation = line.replace('종합평가:', '').trim();
        }
      }
      return {
        categories,
        totalScore,
        overallEvaluation
      };
    } catch (error) {
      console.error('분석 데이터 파싱 오류:', error);
      return null;
    }
  };

  const parsedAnalysis = parseAnalysisData(analysisResult?.analysisData);
  console.log('파싱된 분석 결과:', parsedAnalysis);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(apiUrl('/api/admin-interview-evaluations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify({
          jobCandidateId: parseInt(candidateId),
          evaluatedByAdminId: parseInt(localStorage.getItem('userId')),
          adminIntrvwEvaluationDate: new Date().toISOString(),
          adminIntrvwScore: parseFloat(evaluation.adminIntrvwScore),
          adminIntrvwNotes: evaluation.adminIntrvwNotes,
          adminIntrvwSlctStatus: evaluation.adminIntrvwSlctStatus
        }),
      });

      if (response.ok) {
        alert('면접 평가가 성공적으로 저장되었습니다.');
        // 기존 평가 데이터를 새로고침하여 완료된 평가 표시
        await fetchExistingEvaluation();
        // 후보자 데이터도 새로고침하여 업데이트된 stage 정보 반영
        await fetchCandidateData();
      } else {
        alert('면접 평가 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('면접 평가 저장 실패:', error);
      alert('면접 평가 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ fontFamily: 'SUIT, Apple SD Gothic Neo, sans-serif' }}>
        <Navbar />
        <div style={{ padding: '7rem 3rem', textAlign: 'center' }}>
          <p>면접 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 카테고리별 이모지 매핑
  const CATEGORY_ICONS = {
    '전문성': '💡',
    '의사소통': '🗣️',
    '의사소통 능력': '🗣️',
    '문제해결': '🛠️',
    '문제해결 능력': '🛠️',
    '자신감': '😎',
    '자신감과 태도': '😎',
    '경험의 구체성': '📚',
  };

  return (
    <div style={{ fontFamily: 'SUIT, Apple SD Gothic Neo, sans-serif', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Navbar />
      <SEO
        title="면접 평가"
        description="후보자의 면접 평가를 작성하고 분석 결과를 확인할 수 있는 페이지입니다."
        keywords="면접 평가, AI 분석, 후보자 평가, 면접 결과, 면접 분석"
      />
      <div style={{ padding: '7rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#2d3748' }}>
            면접 평가
          </h1>

          {candidate && (
            <div style={{ 
              background: '#f8fafc', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '2rem',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                후보자 정보
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>GitHub:</strong> {candidate.githubLogin}
                </div>
                <div>
                  <strong>이메일:</strong> {candidate.candidateEmail}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* 면접 영상 섹션 */}
            <div style={{ 
              background: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                면접 영상
              </h2>
              {videos.length === 0 ? (
                <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
                  면접 영상이 없습니다.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {videos
                    .slice() // copy array to avoid mutating state
                    .sort((a, b) => a.questionNumber - b.questionNumber)
                    .map((video, index) => (
                      <div key={video.videoId} style={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        padding: '1rem' 
                      }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          질문 {video.questionNumber}
                        </h3>
                        <p style={{ color: '#4a5568', marginBottom: '1rem' }}>
                          {video.questionContent}
                        </p>
                        <video 
                          controls 
                          style={{ width: '100%', borderRadius: '8px' }}
                          src={video.videoFilePath}
                        >
                          브라우저가 비디오를 지원하지 않습니다.
                        </video>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* AI 분석 결과 섹션 */}
            <div style={{ 
              background: '#ffffff', 
              padding: '1.5rem', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                AI 면접 분석 결과
              </h2>
              {parsedAnalysis && parsedAnalysis.categories ? (
                <div>
                  {/* 종합 요약 헤더 */}
                  <div style={{
                    background: '#fff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '18px',
                    boxShadow: '0 1px 6px #22c55e0a',
                    padding: '1.7rem 1.2rem 1.2rem 1.2rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.7rem'
                  }}>
                    <div style={{
                      background: '#22c55e',
                      color: '#fff',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '1.7rem',
                      padding: '0.25em 1.1em',
                      boxShadow: '0 2px 8px #22c55e11',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 4
                    }}>
                      <StarIcon size={26} color="#fff" />
                      {parsedAnalysis.totalScore}점
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 500,
                      color: '#22c55e',
                      letterSpacing: '-0.5px'
                    }}>
                      AI 면접 종합 평가
                    </div>
                  </div>

                  {/* 카테고리별 상세 카드 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2.5rem',
                  }}>
                    {parsedAnalysis.categories.map((cat, idx) => (
                      <div key={cat.name || idx} style={{
                        background: '#fff',
                        borderRadius: '20px',
                        border: '1.5px solid #e5e7eb',
                        padding: '2rem 1.5rem',
                        boxShadow: '0 2px 8px #22c55e0a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.1rem',
                        position: 'relative',
                        transition: 'box-shadow 0.18s',
                        minHeight: 180,
                        cursor: 'pointer',
                      }}
                      onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 24px #22c55e22'}
                      onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px #22c55e0a'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 2 }}>
                          <span style={{ fontSize: '2.1rem' }}>{CATEGORY_SVGS[cat.name] || <StarIcon color="#bbb" />}</span>
                          <span style={{ fontWeight: 800, fontSize: '1.18rem', color: '#22c55e' }}>{cat.name}</span>
                          <span style={{ color: '#222', fontWeight: 700, fontSize: '1.08rem', marginLeft: 8, background: '#f0fdf4', borderRadius: 12, padding: '4px 16px' }}>{cat.score}/{cat.max_score}</span>
                        </div>
                        <div style={{ fontSize: '1.01rem', color: '#333', marginBottom: 2 }}><b>근거:</b> {cat.reason}</div>
                        <div style={{ fontSize: '1.01rem', color: '#444' }}><b>좋은 예시:</b> {cat.good_example}</div>
                        <div style={{ fontSize: '1.01rem', color: '#888' }}><b>아쉬운 예시:</b> {cat.bad_example}</div>
                        <div style={{ fontSize: '1.01rem', color: '#444' }}><b>개선점:</b> {cat.improvement}</div>
                        <div style={{ fontSize: '1.01rem', color: '#444' }}><b>확신도:</b> {typeof cat.confidence === 'number' ? `${Math.round(cat.confidence * 100)}%` : '확인 필요'}</div>
                        {Array.isArray(cat.evidence) && cat.evidence.length > 0 && (
                          <div style={{ fontSize: '0.94rem', color: '#4b5563', background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                            <b>답변에서 확인한 근거</b>
                            {cat.evidence.slice(0, 3).map((item, evidenceIndex) => (
                              <div key={`${cat.name}-evidence-${evidenceIndex}`} style={{ marginTop: 5 }}>
                                · {item.claim || '확인된 근거 없음'} <span style={{ color: item.source === 'unverified' ? '#dc2626' : '#9ca3af' }}>({item.source || 'missing'}{item.answer_index ? ` · 답변 ${item.answer_index}` : ''})</span>
                                {item.quote && <div style={{ margin: '4px 0 0 12px', color: item.source === 'unverified' ? '#b91c1c' : '#64748b', fontStyle: 'italic' }}>“{item.quote}”</div>}
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                          {cat.tags && cat.tags.length > 0 ? cat.tags.map((tag, i) => (
                            <span key={tag+i} style={{
                              background: '#f0fdf4',
                              color: '#22c55e',
                              fontWeight: 700,
                              fontSize: '1.01rem',
                              borderRadius: 10,
                              padding: '3px 14px',
                              marginRight: 2,
                              marginBottom: 2,
                              letterSpacing: '-0.5px',
                              border: '1px solid #bbf7d0',
                              boxShadow: '0 1px 4px #22c55e11',
                            }}>{tag}</span>
                          )) : <span style={{ color: '#bbb' }}>-</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* After the category cards, render radar chart and 평균/상위10% info if available */}
                  {parsedAnalysis.visualization && parsedAnalysis.visualization.category_scores && (
                    <>
                      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto 1.2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #22c55e11', border: '1.5px solid #e2e8f0', padding: '1.5rem', overflow: 'visible' }}>
                        <h3 style={{ fontSize: '1.13rem', fontWeight: '700', marginBottom: '1.2rem', color: '#22c55e', letterSpacing: '-0.5px', textAlign: 'center' }}>카테고리별 점수 레이더 차트</h3>
                        <ResponsiveContainer width="100%" height={340}>
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={parsedAnalysis.visualization.category_labels.map((label, i) => ({
                            category: label,
                            score: parsedAnalysis.visualization.category_scores[i],
                            max: parsedAnalysis.categories[i]?.max_score || 25
                          }))}>
                            <PolarGrid stroke="#e0e0e0" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: '#888', fontWeight: 600, fontSize: 15 }} tickLine={false} tickMargin={18} />
                            <Radar name="점수" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.18} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ margin: '0 auto 2.5rem auto', maxWidth: 520, background: '#f8fafc', borderRadius: 14, padding: '1.1rem 1.5rem', boxShadow: '0 2px 8px #22c55e11', border: '1.5px solid #e2e8f0', fontSize: '0.92rem', color: '#64748b', textAlign: 'center' }}>
                        현재 점수는 이 지원자의 답변에서 확인된 항목별 점수 합계입니다. 비교 모집단이 없어 평균·상위권 수치는 표시하지 않습니다.
                      </div>
                    </>
                  )}

                  {/* After radar chart and 평균/상위10% info, render 전체 요약 if available */}
                  {parsedAnalysis.totalFeedback && (
                    <div style={{ background: 'linear-gradient(90deg,#f0fdf4 60%,#e6f9f3 100%)', padding: '1.5rem', borderRadius: '14px', border: '1.5px solid #bbf7d0', marginBottom: '2rem', boxShadow: '0 2px 12px #30c59b11' }}>
                      <h3 style={{ fontSize: '1.13rem', fontWeight: '700', marginBottom: '0.7rem', color: '#166534', letterSpacing: '-0.5px' }}>전체 요약</h3>
                      <div style={{ fontSize: '1.01rem', color: '#14532d', marginBottom: 8 }}><b>요약:</b> {parsedAnalysis.totalFeedback.summary}</div>
                      <div style={{ fontSize: '1.01rem', color: '#14532d', marginBottom: 8 }}><b>헤드헌팅 추천 포인트:</b> {parsedAnalysis.totalFeedback.headhunting_point}</div>
                      <div style={{ fontSize: '1.01rem', color: '#14532d', marginBottom: 8 }}><b>추천/코멘트:</b> {parsedAnalysis.totalFeedback.recommendation}</div>
                      {parsedAnalysis.totalFeedback.limitations?.length > 0 && (
                        <div style={{ fontSize: '0.94rem', color: '#4b5563', marginBottom: 8 }}><b>분석의 한계:</b> {parsedAnalysis.totalFeedback.limitations.join(' ')}</div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {parsedAnalysis.totalFeedback.tags && parsedAnalysis.totalFeedback.tags.length > 0 ? parsedAnalysis.totalFeedback.tags.map((tag, i) => (
                          <span key={tag+i} style={{
                            background: 'linear-gradient(90deg,#30c59b22 60%,#6ee7b733 100%)',
                            color: '#059669',
                            fontWeight: 600,
                            fontSize: '0.97rem',
                            borderRadius: 8,
                            padding: '2px 12px',
                            marginRight: 2,
                            marginBottom: 2,
                            letterSpacing: '-0.5px',
                            border: '1px solid #b2f5ea',
                            boxShadow: '0 1px 4px #30c59b11',
                          }}>{tag}</span>
                        )) : <span style={{ color: '#bbb' }}>-</span>}
                      </div>
                    </div>
                  )}
                </div>
              ) : analysisResult ? (
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
                    상세 분석
                  </h3>
                  <div style={{ 
                    whiteSpace: 'pre-line', 
                    fontSize: '0.9rem', 
                    lineHeight: '1.5',
                    color: '#4a5568'
                  }}>
                    {analysisResult.analysisData}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  color: '#718096', 
                  textAlign: 'center', 
                  padding: '2rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p>AI 면접 분석 결과가 없습니다.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    분석이 진행 중이거나 아직 완료되지 않았습니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 평가 폼 섹션 */}
          <div style={{ 
            background: '#ffffff', 
            padding: '1.5rem', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginTop: '2rem'
          }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
              면접 평가
            </h2>
            
            {existingEvaluation ? (
              <div>
                <div style={{ 
                  background: '#f0fdf4', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#166534' }}>
                    평가 완료
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#14532d', margin: 0 }}>
                    이 후보자에 대한 면접 평가가 이미 완료되었습니다.
                  </p>
                </div>
                
                <div style={{ 
                  background: '#fff', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1.5px solid #22c55e',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 12px #22c55e11',
                }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', color: '#22c55e', letterSpacing: '-0.5px' }}>
                    기존 평가 결과
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.2rem' }}>
                    <span style={{
                      background: '#22c55e',
                      color: '#fff',
                      borderRadius: '999px',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      padding: '0.25em 1.1em',
                      boxShadow: '0 2px 8px #22c55e22',
                      letterSpacing: '-0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}>{existingEvaluation.adminIntrvwScore}점</span>
                    <span style={{ 
                      color: existingEvaluation.adminIntrvwSlctStatus === 'selected' ? '#22c55e' : existingEvaluation.adminIntrvwSlctStatus === 'rejected' ? '#dc2626' : '#a3a3a3',
                      background: existingEvaluation.adminIntrvwSlctStatus === 'selected' ? '#f0fdf4' : existingEvaluation.adminIntrvwSlctStatus === 'rejected' ? '#fef2f2' : '#f3f4f6',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      padding: '0.25em 1.1em',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 4px #22c55e11',
                      marginLeft: 4,
                    }}>
                      {existingEvaluation.adminIntrvwSlctStatus === 'selected' ? '선정' : 
                       existingEvaluation.adminIntrvwSlctStatus === 'rejected' ? '미선정' : '검토 중'}
                    </span>
                  </div>
                  {existingEvaluation.adminIntrvwNotes && (
                    <div style={{ marginBottom: '1.2rem' }}>
                      <strong style={{ color: '#22c55e', fontWeight: 600 }}>평가 의견</strong>
                      <p style={{ 
                        margin: '0.5rem 0 0 0', 
                        padding: '0.85rem', 
                        background: '#f8fafc', 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.98rem',
                        lineHeight: '1.5',
                        color: '#222',
                      }}>
                        {existingEvaluation.adminIntrvwNotes}
                      </p>
                    </div>
                  )}
                  <div style={{ color: '#888', fontSize: '0.98rem', fontWeight: 500 }}>
                    평가일: {new Date(existingEvaluation.adminIntrvwEvaluationDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
                    점수 (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={evaluation.adminIntrvwScore}
                    onChange={(e) => setEvaluation({...evaluation, adminIntrvwScore: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                      outline: 'none',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #22c55e33';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
                    평가 의견
                  </label>
                  <textarea
                    value={evaluation.adminIntrvwNotes}
                    onChange={(e) => setEvaluation({...evaluation, adminIntrvwNotes: e.target.value})}
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                      outline: 'none',
                    }}
                    placeholder="면접 평가 의견을 작성해주세요..."
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #22c55e33';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
                    선정 상태
                  </label>
                  <select
                    value={evaluation.adminIntrvwSlctStatus}
                    onChange={(e) => setEvaluation({...evaluation, adminIntrvwSlctStatus: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                      outline: 'none',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#22c55e';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #22c55e33';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="pending">검토 중</option>
                    <option value="selected">선정</option>
                    <option value="rejected">미선정</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/company/dashboard')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: '#ffffff',
                      color: '#4a5568',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    취소
                  </button>
                  {/* 면접 평가 버튼 Toss-style로 변경 */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '999px',
                      height: '44px',
                      padding: '0 1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.7rem',
                      fontWeight: 700,
                      fontSize: '1.08rem',
                      boxShadow: '0 2px 8px rgba(34,197,94,0.13)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'background 0.18s, box-shadow 0.18s, transform 0.14s',
                      letterSpacing: '0.01em',
                      outline: 'none',
                      marginTop: '0.5rem',
                    }}
                    onMouseEnter={e => {
                      if (!submitting) {
                        e.currentTarget.style.background = '#16a34a';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(34,197,94,0.18)';
                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!submitting) {
                        e.currentTarget.style.background = '#22c55e';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(34,197,94,0.13)';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M9 7h6" />
                      <path d="M9 11h6" />
                      <path d="M9 15h2" />
                      <path d="M15 19l2 2 4-4" stroke="#22c55e" strokeWidth="2" fill="none"/>
                    </svg>
                    면접 평가
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

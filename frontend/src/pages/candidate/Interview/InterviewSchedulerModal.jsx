import React, { useState, useEffect, useCallback } from 'react';
import './InterviewSchedulerModal.css';
import { apiUrl } from '../../../api/config';

function InterviewSchedulerModal({ isOpen, onClose, onSchedule, postId, candidateId }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date()); // 현재 시간을 실시간으로 관리
  const [jobPosting, setJobPosting] = useState(null); // 공고 정보
  const [maxInterviewDate, setMaxInterviewDate] = useState(null); // 면접 가능 최대 날짜

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000); // 1초마다 업데이트 (더 빠른 반응을 위해)

    return () => clearInterval(timer);
  }, []);

  // 오늘 날짜
  const today = currentDate; // currentDate 사용
  const todayString = today.toISOString().split('T')[0];

  // 현재 시간 + 1시간 이후의 시간대 옵션들 생성
  const generateTimeSlots = useCallback(() => {
    const now = currentDate; // currentDate 사용
    const currentHour = now.getHours();
    
    const slots = [];
    
    // 오늘 날짜인 경우에만 현재 시간 + 1시간 이후부터, 다른 날짜는 9시부터
    const isToday = selectedDate === todayString;
    const actualStartHour = isToday ? currentHour + 1 : 9;
    
    // 24시를 넘어가는 경우 처리
    if (actualStartHour >= 24) {
      return slots; // 빈 배열 반환 (선택 가능한 시간 없음)
    }
    
    for (let hour = actualStartHour; hour <= 23; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    
    console.log('시간 슬롯 생성:', {
      currentHour,
      isToday,
      actualStartHour,
      selectedDate,
      todayString,
      slots
    });
    
    return slots;
  }, [currentDate, selectedDate, todayString]);

  const [timeSlots, setTimeSlots] = useState([]);

  // 공고 정보 가져오기 및 면접 가능 날짜 계산
  useEffect(() => {
    if (isOpen && postId) {
      const fetchJobPosting = async () => {
        try {
          const response = await fetch(apiUrl(`/api/postings/info/${postId}`));
          if (response.ok) {
            const data = await response.json();
            setJobPosting(data);
            
            // 공고 마감일로부터 1주일 후까지 면접 가능
            if (data.postExpiryDate) {
              const expiryDate = new Date(data.postExpiryDate);
              const maxDate = new Date(expiryDate);
              maxDate.setDate(maxDate.getDate() + 7); // 마감일 + 7일
              setMaxInterviewDate(maxDate);
              console.log('면접 가능 최대 날짜:', maxDate.toLocaleDateString('ko-KR'));
            }
          }
        } catch (error) {
          console.error('공고 정보 가져오기 실패:', error);
        }
      };
      
      fetchJobPosting();
    }
  }, [isOpen, postId]);

  // 선택된 날짜가 변경될 때마다 시간 옵션 업데이트
  useEffect(() => {
    setTimeSlots(generateTimeSlots());
  }, [selectedDate, currentDate, generateTimeSlots]);

  // 달력 관련 함수들
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    
    console.log('월 정보:', {
      year,
      month: month + 1,
      firstDay: firstDay.toLocaleDateString('ko-KR'),
      lastDay: lastDay.toLocaleDateString('ko-KR'),
      daysInMonth,
      startingDayOfWeek,
      startingDayName: ['일', '월', '화', '수', '목', '금', '토'][startingDayOfWeek]
    });
    
    return { daysInMonth, startingDayOfWeek };
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 오늘 이전 날짜는 비활성화
    if (targetDate < today) {
      return true;
    }
    
    // 공고 마감일 + 1주일 이후 날짜는 비활성화
    if (maxInterviewDate) {
      const maxDate = new Date(maxInterviewDate);
      maxDate.setHours(0, 0, 0, 0);
      if (targetDate > maxDate) {
        return true;
      }
    }
    
    return false;
  };

  const isDateSelected = (date) => {
    return formatDate(date) === selectedDate;
  };

  const isToday = (date) => {
    const today = new Date();
    const todayFormatted = formatDate(today);
    const dateFormatted = formatDate(date);
    return dateFormatted === todayFormatted;
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date)) {
      const formattedDate = formatDate(date);
      console.log('선택된 날짜:', formattedDate);
      setSelectedDate(formattedDate);
      // 날짜가 변경되면 선택된 시간 초기화
      setSelectedTime('');
    }
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      console.log('월 변경:', direction, newMonth.toLocaleDateString('ko-KR'));
      return newMonth;
    });
    
    // 월이 변경되면 선택된 날짜 초기화
    setSelectedDate('');
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    console.log('달력 렌더링:', {
      currentMonth: currentMonth.toLocaleDateString('ko-KR'),
      daysInMonth,
      startingDayOfWeek,
      startingDayName: ['일', '월', '화', '수', '목', '금', '토'][startingDayOfWeek]
    });
    
    const days = [];
    
    // 이전 달의 마지막 날짜들
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    // 이전 달의 날짜들을 올바르게 계산 (일요일부터 시작)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const day = prevMonthDays - startingDayOfWeek + i + 1;
      if (day > 0) { // 음수 방지
        days.push(
          <div key={`prev-${day}`} className="calendar-day prev-month">
            {day}
          </div>
        );
      }
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      const isTodayDate = isToday(date);
      
      console.log(`날짜 ${day}일:`, {
        date: date.toLocaleDateString('ko-KR'),
        isDisabled,
        isSelected,
        isTodayDate
      });
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          {day}
        </div>
      );
    }
    
    // 다음 달의 첫 날짜들 (6주 * 7일 = 42개 셀을 맞추기 위해)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="calendar-day next-month">
          {day}
        </div>
      );
    }
    
    return days;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError('날짜와 시간을 모두 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 선택된 날짜와 시간을 ISO 형식으로 변환
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      const requestData = {
        postId: postId,
        candidateId: candidateId,
        scheduledTime: scheduledDateTime.toISOString()
      };

      console.log('면접 일정 등록 요청:', requestData);

      const response = await fetch(apiUrl('/api/interview-schedules'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('API 성공 응답:', result);
      
      if (result.success) {
        // 성공 시 부모 컴포넌트에 알림
        onSchedule(postId, {
          date: selectedDate,
          time: selectedTime,
          link: result.interviewLink
        });
      } else {
        throw new Error(result.message || '면접 일정 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('면접 일정 등록 오류:', error);
      setError(error.message || '면접 일정 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedDate('');
      setSelectedTime('');
      setError('');
      onClose();
    }
  };

  const handleTimeSlotClick = (time) => {
    // currentDate 사용 (실시간 업데이트되는 시간)
    const currentDateString = currentDate.toISOString().split('T')[0];
    
    // 오늘 날짜가 선택되었을 때만 시간 제한 적용
    if (selectedDate === currentDateString) {
      const [selectedHour] = time.split(':').map(Number);
      const currentHour = currentDate.getHours();
      
      // 현재 시간 + 1시간 계산
      let oneHourLaterHour = currentHour + 1;
      if (oneHourLaterHour >= 24) {
        oneHourLaterHour = 0;
      }
      
      // 시간 비교 (분 단위는 무시하고 시간만 비교)
      const isDisabled = selectedHour < oneHourLaterHour;
      
      if (isDisabled) {
        setError(`현재 시간 ${currentHour}:00으로부터 1시간 이후부터 선택 가능합니다.`);
        return;
      }
    }
    
    setSelectedTime(time);
    setError('');
  };

  // 시간대가 비활성화되어야 하는지 확인하는 함수
  const isTimeDisabled = (time) => {
    // currentDate 사용 (실시간 업데이트되는 시간)
    const currentDateString = currentDate.toISOString().split('T')[0];
    
    // 오늘 날짜가 선택되었을 때만 시간 제한 적용
    if (selectedDate === currentDateString) {
      const [selectedHour] = time.split(':').map(Number);
      const currentHour = currentDate.getHours();
      
      // 현재 시간 + 1시간 계산
      const oneHourLaterHour = currentHour + 1;
      
      // 시간 비교 (분 단위는 무시하고 시간만 비교)
      const isDisabled = selectedHour < oneHourLaterHour;
      
      console.log(`시간 슬롯 ${time} 비활성화 체크:`, {
        selectedHour,
        currentHour,
        oneHourLaterHour,
        isDisabled
      });
      
      return isDisabled;
    }
    
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span style={{ fontWeight: 600, fontSize: 20, color: '#333' }}>Schedule interview</span>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isSubmitting}
            style={{ marginLeft: 'auto' }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="scheduler-form">
          {/* 공고 정보 및 면접 가능 기간 표시 */}
          {jobPosting && (
            <div className="job-info-section" style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="job-info-card" style={{ background: '#f8fafc', border: '1.5px solid #e0e7ef', borderRadius: 12, padding: 16, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <img src={process.env.PUBLIC_URL + '/icons/interview.svg'} alt="interview" style={{ width: 24, height: 24 }} />
                  <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>{jobPosting.postTitle}</span>
                  <span style={{ fontWeight: 500, fontSize: 15, color: '#222', marginLeft: 8 }}>{jobPosting.companyName}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#e0f2fe', color: '#0284c7', borderRadius: 6, padding: '2px 10px', fontSize: 14, fontWeight: 600 }}>
                    <svg width="16" height="16" fill="none" stroke="#0284c7" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 13v7m0 0H7m5 0h5"/></svg>
                    {jobPosting.postProgrammingLanguage || '기술스택 미지정'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#e0fbe6', color: '#22c55e', borderRadius: 6, padding: '2px 10px', fontSize: 14, fontWeight: 600 }}>
                    <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 7-8 12-8 12S4 17 4 10a8 8 0 0 1 8-8z"/></svg>
                    {jobPosting.postLocation || '위치 미지정'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#388e3c', fontWeight: 600, fontSize: 15 }}>
                    <svg width="18" height="18" fill="none" stroke="#388e3c" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    면접 가능 기간: <span style={{ color: '#222', fontWeight: 700, marginLeft: 2 }}>오늘 ~ {maxInterviewDate ? maxInterviewDate.toLocaleDateString('ko-KR') : '공고 마감일 + 1주일'}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#b91c1c', fontWeight: 600, fontSize: 15 }}>
                    <svg width="18" height="18" fill="none" stroke="#b91c1c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    공고 마감일: <span style={{ color: '#222', fontWeight: 700, marginLeft: 2 }}>{jobPosting.postExpiryDate ? new Date(jobPosting.postExpiryDate).toLocaleDateString('ko-KR') : '정보 없음'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="scheduler-layout">
            {/* 왼쪽: 달력 */}
            <div className="calendar-section">
              <h3>Select a date</h3>
              <div style={{ margin: '8px 0 16px 0', color: '#388e3c', fontSize: '15px', fontWeight: 500 }}>
                면접은 선택하신 날짜로부터 1주일 이내에 진행하실 수 있습니다.
              </div>
              <div className="calendar-container">
                <div className="calendar-header">
                  <button 
                    type="button" 
                    className="month-nav-btn"
                    onClick={() => handleMonthChange('prev')}
                    disabled={isSubmitting}
                  >
                    ‹
                  </button>
                  <h4 className="current-month">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h4>
                  <button 
                    type="button" 
                    className="month-nav-btn"
                    onClick={() => handleMonthChange('next')}
                    disabled={isSubmitting}
                  >
                    ›
                  </button>
                </div>
                
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  <div className="calendar-days">
                    {renderCalendar()}
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 시간대 선택 */}
            <div className="time-section">
              <h3>Select a time</h3>
              <div className="time-slots-scroll">
                {timeSlots.map((time) => {
                  const isDisabled = !selectedDate || isTimeDisabled(time);
                  return (
                    <button
                      key={`${time}-${currentDate.getTime()}`}
                      type="button"
                      className={`time-slot ${selectedTime === time ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => handleTimeSlotClick(time)}
                      disabled={isSubmitting || isDisabled}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 선택된 정보 행 */}
          {(selectedDate || selectedTime) && (
            <div className="selected-info-row" style={{ minHeight: '48px', alignItems: 'center' }}>
              {selectedDate && (
                <div className="selected-date-info">
                  <p>선택된 날짜: {(() => {
                    const [year, month, day] = selectedDate.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    return date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    });
                  })()}</p>
                </div>
              )}
              {selectedTime && (
                <div className="selected-time-info">
                  <p>선택된 시간: {selectedTime}</p>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="modal-actions" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting || !selectedDate || !selectedTime}
              style={{ height: '48px', fontSize: '16px', fontWeight: 600, minWidth: '140px' }}
            >
              {isSubmitting ? '등록 중...' : '일정 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InterviewSchedulerModal;

import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ResumeEducationSection = ({ form, setForm }) => {
  const handleChange = (idx, field, value) => {
    const newEducation = [...(form.education || [])];
    if (field === 'admissionDate' && value) {
      // value: Date 객체
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      newEducation[idx]['admissionYear'] = year;
      newEducation[idx]['admissionMonth'] = month;
      newEducation[idx]['admissionDate'] = `${year}-${month}`;
    } else if (field === 'graduationDate' && value) {
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      newEducation[idx]['graduationYear'] = year;
      newEducation[idx]['graduationMonth'] = month;
      newEducation[idx]['graduationDate'] = `${year}-${month}`;
    } else if (field === 'isGraduated') {
      newEducation[idx]['graduationStatus'] = value ? '졸업' : '재학';
      newEducation[idx]['isGraduated'] = value;
    } else {
      newEducation[idx][field] = value;
    }
    setForm((prev) => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    setForm((prev) => ({ 
      ...prev, 
      education: [...(prev.education || []), { 
        schoolType: '대학교', // 기본값 설정
        school: '', 
        major: '', 
        admissionDate: '', 
        admissionYear: '',
        admissionMonth: '',
        graduationDate: '',
        graduationYear: '',
        graduationMonth: '',
        graduationStatus: '',
        region: '',
        isGraduated: false 
      }] 
    }));
  };

  const removeEducation = (idx) => {
    const newEducation = [...(form.education || [])];
    newEducation.splice(idx, 1);
    setForm((prev) => ({ ...prev, education: newEducation }));
  };

  // YYYY-MM 문자열을 Date 객체로 변환
  const parseYearMonth = (str) => {
    if (!str) return null;
    const [year, month] = str.split('-');
    if (!year || !month) return null;
    return new Date(Number(year), Number(month) - 1);
  };

  return (
    <div style={{maxWidth: '1200px', margin: '0 auto'}}>
      <section className="resume-section">
        <h3>Education</h3>
        {(form.education || []).map((edu, idx) => (
          <div className="education-card" key={idx}>
            <div className="education-form-row" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              {/* 첫째 줄: 학교유형, 학교명, 전공(적당히), 졸업체크박스 */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', width: '100%', alignItems: 'center' }}>
                <div className="education-field" style={{ flex: 1, minWidth: 0 }}>
                  <label>School type</label>
                  <select 
                    value={edu.schoolType || '대학교'} 
                    onChange={e => handleChange(idx, 'schoolType', e.target.value)}
                  >
                    <option value="고등학교">고등학교</option>
                    <option value="전문대학">전문대학</option>
                    <option value="대학교">대학교</option>
                    <option value="대학원">대학원</option>
                  </select>
                </div>
                <div className="education-field" style={{ flex: 1.5, minWidth: 0 }}>
                  <label>School</label>
                  <input 
                    type="text" 
                    value={edu.school} 
                    onChange={e => handleChange(idx, 'school', e.target.value)}
                    placeholder="Enter school name"
                  />
                </div>
                <div className="education-field" style={{ flex: 1.5, minWidth: 0 }}>
                  <label>Major</label>
                  <input 
                    type="text" 
                    value={edu.major} 
                    onChange={e => handleChange(idx, 'major', e.target.value)}
                    placeholder="Enter major"
                  />
                </div>
                <div className="education-field" style={{ width: '90px', minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <label className="checkbox-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                    <input 
                      type="checkbox" 
                      checked={edu.isGraduated} 
                      onChange={e => handleChange(idx, 'isGraduated', e.target.checked)}
                    />
                    <span className="checkbox-text">Graduated</span>
                  </label>
                </div>
              </div>
              {/* 둘째 줄: 입학년월, 졸업년월, 졸업상태, 지역, 삭제버튼(오른쪽 끝) */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', alignItems: 'flex-end' }}>
                <div className="education-field" style={{ flex: 1, minWidth: 0 }}>
                  <label>Enrollment month</label>
                  <DatePicker
                    selected={parseYearMonth(edu.admissionDate)}
                    onChange={date => handleChange(idx, 'admissionDate', date)}
                    dateFormat="yyyy-MM"
                    showMonthYearPicker
                    showFullMonthYearPicker
                    placeholderText="입학년월 선택"
                    className="datepicker-input"
                    maxDate={new Date()}
                    isClearable
                  />
                </div>
                <div className="education-field" style={{ flex: 1, minWidth: 0 }}>
                  <label>Graduation month</label>
                  <DatePicker
                    selected={parseYearMonth(edu.graduationDate)}
                    onChange={date => handleChange(idx, 'graduationDate', date)}
                    dateFormat="yyyy-MM"
                    showMonthYearPicker
                    showFullMonthYearPicker
                    placeholderText="졸업년월 선택"
                    className="datepicker-input"
                    maxDate={new Date()}
                    isClearable
                  />
                </div>
                <div className="education-field" style={{ flex: 1, minWidth: 0 }}>
                  <label>Graduation status</label>
                  <select
                    value={edu.graduationStatus || ''}
                    onChange={e => handleChange(idx, 'graduationStatus', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="졸업">졸업</option>
                    <option value="재학">재학</option>
                    <option value="중퇴">중퇴</option>
                    <option value="휴학">휴학</option>
                  </select>
                </div>
                <div className="education-field" style={{ flex: 1, minWidth: 0 }}>
                  <label>Location</label>
                  <input 
                    type="text"
                    value={edu.region}
                    onChange={e => handleChange(idx, 'region', e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
                <div style={{ flex: 1 }} />
                <button 
                  type="button" 
                  className="remove-education-btn" 
                  onClick={() => removeEducation(idx)}
                  style={{ marginLeft: 'auto' }}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="add-education-btn minimal-add-btn green-btn"
          onClick={addEducation}
          style={{
            background: '#fff',
            color: '#30C59B',
            border: '1.5px solid #30C59B',
            borderRadius: '8px',
            padding: '0.55rem 1.1rem',
            fontSize: '1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.7rem',
            transition: 'background 0.15s, color 0.15s, border 0.15s',
            cursor: 'pointer',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#30C59B';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.border = '1.5px solid #30C59B';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#30C59B';
            e.currentTarget.style.border = '1.5px solid #30C59B';
          }}
        >
          <FaPlus style={{ fontSize: 16 }} /> 학력 추가
        </button>
      </section>
    </div>
  );
};

export default ResumeEducationSection;

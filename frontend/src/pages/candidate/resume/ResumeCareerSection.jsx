import React from 'react';
import { FaPlus, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ResumeCareerSection = ({ form, setForm }) => {
  const handleChange = (idx, field, value) => {
    const newCareer = [...(form.career || [])];
    if (field === 'startDate' && value) {
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      newCareer[idx]['startYear'] = year;
      newCareer[idx]['startMonth'] = month;
      newCareer[idx]['startDate'] = `${year}-${month}`;
    } else if (field === 'endDate' && value) {
      const year = value.getFullYear();
      const month = (value.getMonth() + 1).toString().padStart(2, '0');
      newCareer[idx]['endYear'] = year;
      newCareer[idx]['endMonth'] = month;
      newCareer[idx]['endDate'] = `${year}-${month}`;
    } else if (field === 'job') {
      newCareer[idx]['jobTitle'] = value;
      newCareer[idx]['job'] = value;
    } else if (field === 'current') {
      newCareer[idx]['isCurrent'] = value;
      newCareer[idx]['current'] = value;
      if (value) newCareer[idx]['endDate'] = '';
    } else {
      newCareer[idx][field] = value;
    }
    setForm((prev) => ({ ...prev, career: newCareer }));
  };

  const addCareer = () => {
    setForm((prev) => ({ 
      ...prev, 
      career: [...(prev.career || []), { 
        company: '', 
        job: '', 
        jobTitle: '',
        department: '',
        position: '',
        startDate: '', 
        startYear: '',
        startMonth: '',
        endDate: '',
        endYear: '',
        endMonth: '',
        current: false,
        isCurrent: false,
        isCompanyHidden: false
      }] 
    }));
  };

  const removeCareer = (idx) => {
    const newCareer = [...(form.career || [])];
    newCareer.splice(idx, 1);
    setForm((prev) => ({ ...prev, career: newCareer }));
  };

  // YYYY-MM 문자열을 Date 객체로 변환
  const parseYearMonth = (str) => {
    if (!str) return null;
    const [year, month] = str.split('-');
    if (!year || !month) return null;
    return new Date(Number(year), Number(month) - 1);
  };

  return (
    <section className="resume-section">
      <h3>Work experience</h3>
      {(form.career || []).map((car, idx) => (
        <div className="career-card" key={idx}>
          <div className="career-form-grid">
            {/* 1행: 회사명, 직무, 부서, 직급 */}
            <div className="career-row career-row-1">
              <div className="career-field flex2">
                <label>Company</label>
                <div className="company-input-wrapper">
                  <input 
                    type="text"
                    value={car.company} 
                    onChange={e => handleChange(idx, 'company', e.target.value)}
                    placeholder="Enter company name"
                    className={car.isCompanyHidden ? 'hidden-company' : ''}
                  />
                  <button
                    type="button"
                    className="company-hide-toggle"
                    onClick={() => handleChange(idx, 'isCompanyHidden', !car.isCompanyHidden)}
                    title={car.isCompanyHidden ? 'Show company name' : 'Hide company name'}
                  >
                    {car.isCompanyHidden ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="career-field flex2">
                <label>Role</label>
                <input 
                  type="text"
                  value={car.jobTitle} 
                  onChange={e => handleChange(idx, 'jobTitle', e.target.value)}
                  placeholder="Enter role"
                />
              </div>
              <div className="career-field">
                <label>Department</label>
                <input 
                  type="text"
                  value={car.department}
                  onChange={e => handleChange(idx, 'department', e.target.value)}
                  placeholder="Enter department"
                />
              </div>
              <div className="career-field">
                <label>Level</label>
                <input 
                  type="text"
                  value={car.position}
                  onChange={e => handleChange(idx, 'position', e.target.value)}
                  placeholder="Enter level"
                />
              </div>
            </div>
            {/* 2행: 시작년월, 종료년월, 삭제버튼 */}
            <div className="career-row career-row-2">
              <div className="career-field">
                <label>Start month</label>
                <DatePicker
                  selected={parseYearMonth(car.startDate)}
                  onChange={date => handleChange(idx, 'startDate', date)}
                  dateFormat="yyyy-MM"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  placeholderText="Select start month"
                  className="datepicker-input"
                  maxDate={new Date()}
                  isClearable
                />
              </div>
              <div className="career-field">
                <label>End month</label>
                <DatePicker
                  selected={parseYearMonth(car.endDate)}
                  onChange={date => handleChange(idx, 'endDate', date)}
                  dateFormat="yyyy-MM"
                  showMonthYearPicker
                  showFullMonthYearPicker
                  placeholderText="Select end month"
                  className="datepicker-input"
                  maxDate={new Date()}
                  isClearable
                  disabled={car.current}
                />
              </div>
            </div>
            {/* 3행: 재직중 체크박스와 삭제버튼을 같은 줄에 좌우로 배치 */}
            <div className="career-row career-row-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="career-field career-checkbox-wrap" style={{ flex: 1 }}>
                <label className="career-checkbox-label" style={{ marginBottom: 0 }}>
                  <input 
                    type="checkbox" 
                    checked={car.current} 
                    onChange={e => handleChange(idx, 'current', e.target.checked)}
                  />
                  <span className="career-checkbox-text">Currently working</span>
                </label>
              </div>
              <div className="career-field career-delete-wrap" style={{}}>
                <button 
                  type="button" 
                  className="remove-career-btn" 
                  onClick={() => removeCareer(idx)}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="add-career-btn minimal-add-btn green-btn"
        onClick={addCareer}
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
        <FaPlus style={{ fontSize: 16 }} /> 경력 추가
      </button>
    </section>
  );
};

export default ResumeCareerSection;

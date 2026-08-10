// JobSelectionModal.jsx
import React, { useState } from 'react';
import './JobSelectionModal.css'; // You'll create this CSS file

function JobSelectionModal({ onClose, onSelectJob }) {
  // You might want to manage selected jobs internally first
  const [selectedJob, setSelectedJob] = useState('');

  const jobRoles = [
    '개발PM', '게임개발', '기술지원', '데이터 사이언티스트', '데이터분석가',
    '데이터엔지니어', '백엔드/서버개발', '보안관제', '보안컨설팅', '웹개발',
    '웹마스터', '유지보수', '정보보안', '퍼블리셔', '프론트엔드', 'BI 엔지니어',
    'CISO', 'CPO', 'DBA'
  ];

  const professionalFields = [
    '검색엔진', '네트워크', '데이터리벌링', '데이터마이닝', '데이터시각화',
    '딥러닝', '루비온레일즈', '머신러닝', '메타버스', '모델링', '모의해킹',
    '미들웨어', '반응형웹', '방화벽', '블록체인', '빅데이터', '빌딩',
    '솔루션', '스크립트', '신경망'
  ];

  const techStacks = [
    '그누보드', '라즈베리파이', '스크립트코드', '스마트컨트랙트', '아두이노',
    '액션스크립트', '어셈블리', '와이어샤크', '임베디드리눅스', '파워빌더',
    '폴스택', '.NET', 'ABAP', 'AIX', 'Ajax', 'Android', 'Angular', 'Apache',
    'ArcGIS', 'ASP'
  ];

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    // You could also allow multiple selections here
  };

  const handleConfirm = () => {
    if (onSelectJob) {
      onSelectJob(selectedJob); // Pass the selected job back to the parent
    }
    onClose(); // Close the modal
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Role and profession</h2>
          {/* You can add a close button here if needed */}
        </div>
        <div className="modal-body">
          <div className="selection-category">
            <h3>Role and profession</h3>
            <div className="tags-container">
              {jobRoles.map((job) => (
                <span
                  key={job}
                  className={`tag ${selectedJob === job ? 'selected' : ''}`}
                  onClick={() => handleJobSelect(job)}
                >
                  {job}
                </span>
              ))}
            </div>
          </div>

          <div className="selection-category">
            <h3>Specialty</h3>
            <div className="tags-container">
              {professionalFields.map((field) => (
                <span
                  key={field}
                  className={`tag ${selectedJob === field ? 'selected' : ''}`}
                  onClick={() => handleJobSelect(field)}
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          <div className="selection-category">
            <h3>Tech stack</h3>
            <div className="tags-container">
              {techStacks.map((tech) => (
                <span
                  key={tech}
                  className={`tag ${selectedJob === tech ? 'selected' : ''}`}
                  onClick={() => handleJobSelect(tech)}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search or add a role"
              // You might want to implement a search/add functionality here
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="confirm-button" onClick={handleConfirm}>Apply</button>
        </div>
      </div>
    </div>
  );
}

export default JobSelectionModal;

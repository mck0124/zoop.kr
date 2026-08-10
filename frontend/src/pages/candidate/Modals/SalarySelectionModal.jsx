// SalarySelectionModal.jsx
import React, { useState } from 'react';
import './SalarySelectionModal.css'; // 이 컴포넌트의 스타일 시트

function SalarySelectionModal({ onClose, onSelectSalary }) {
  // 이미지에 있는 연봉 범위 데이터
  const salaryRanges = [
    '회사내규에 따름',
    '1,400만원 이하',
    '1,400~1,600만원',
    '1,600~1,800만원',
    '1,800~2,000만원',
    '2,000~2,200만원',
    '2,200~2,400만원',
    '2,400~2,600만원',
    '2,600~2,800만원',
    '2,800~3,000만원',
    '3,000~3,200만원',
    '3,200~3,400만원',
    '3,400~3,600만원',
    '3,600~3,800만원',
    '3,800~4,000만원',
    '4,000~5,000만원',
    '5,000~6,000만원',
    '6,000~7,000만원',
    '7,000~8,000만원',
    '8,000~9,000만원',
    '9,000~1억원',
    '1억원 이상',
    '면접 후 결정'
  ];

  const [selectedSalary, setSelectedSalary] = useState('');

  const handleSalaryClick = (salary) => {
    setSelectedSalary(salary);
  };

  const handleConfirm = () => {
    if (onSelectSalary) {
      onSelectSalary(selectedSalary); // 선택된 연봉을 부모 컴포넌트로 전달
    }
    onClose(); // 모달 닫기
  };

  return (
    <div className="modal-overlay"> {/* JobSelectionModal과 동일한 오버레이 사용 */}
      <div className="salary-modal-content"> {/* 연봉 모달 전용 클래스 */}
        <div className="salary-modal-header">
          <h3>Salary</h3>
        </div>
        <div className="salary-modal-body">
          <ul className="salary-list">
            {salaryRanges.map((range) => (
              <li
                key={range}
                className={selectedSalary === range ? 'selected' : ''}
                onClick={() => handleSalaryClick(range)}
              >
                {range}
              </li>
            ))}
          </ul>
        </div>
        <div className="salary-modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="confirm-button" onClick={handleConfirm}>Apply</button>
        </div>
      </div>
    </div>
  );
}

export default SalarySelectionModal;

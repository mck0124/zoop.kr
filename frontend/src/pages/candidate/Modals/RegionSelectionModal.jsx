// RegionSelectionModal.jsx
import React, { useState } from 'react';
import './RegionSelectionModal.css'; // 이 컴포넌트의 스타일 시트

function RegionSelectionModal({ onClose, onSelectRegion }) {
  const [selectedRegion, setSelectedRegion] = useState('');

  // 예시 지역 데이터 (실제 애플리케이션에서는 API 등으로 관리될 수 있습니다)
  const regions = [
    '서울', '경기', '광주', '대구', '대전', '부산', '울산', '인천', '강원',
    '경남', '경북', '전남', '전북', '제주', '충남', '충북', '세종'
  ];

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
  };

  const handleConfirm = () => {
    if (onSelectRegion) {
      onSelectRegion(selectedRegion); // 선택된 지역을 부모 컴포넌트로 전달
    }
    onClose(); // 모달 닫기
  };

  return (
    <div className="modal-overlay">
      <div className="region-modal-content"> {/* 지역 모달 전용 클래스 */}
        <div className="region-modal-header">
          <h3>Location</h3>
        </div>
        <div className="region-modal-body">
          <ul className="region-list">
            {regions.map((region) => (
              <li
                key={region}
                className={selectedRegion === region ? 'selected' : ''}
                onClick={() => handleRegionClick(region)}
              >
                {region}
              </li>
            ))}
          </ul>
        </div>
        <div className="region-modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="confirm-button" onClick={handleConfirm}>Apply</button>
        </div>
      </div>
    </div>
  );
}

export default RegionSelectionModal;

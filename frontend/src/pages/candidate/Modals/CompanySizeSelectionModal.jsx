// CompanySizeSelectionModal.jsx
import React, { useState } from 'react';
import './CompanySizeSelectionModal.css';

function CompanySizeSelectionModal({ onClose, onSelectCompanySize }) {
  const companySizes = [
    '중소기업',
    '스타트업',
    '중견기업',
    '대기업',
    '외국계기업'
  ];

  const [selectedSize, setSelectedSize] = useState('');

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };

  const handleConfirm = () => {
    if (onSelectCompanySize) {
      onSelectCompanySize(selectedSize);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="company-size-modal-content">
        <div className="company-size-modal-header">
          <h3>Company size</h3>
        </div>
        <div className="company-size-modal-body">
          <ul className="company-size-list">
            {companySizes.map((size) => (
              <li
                key={size}
                className={selectedSize === size ? 'selected' : ''}
                onClick={() => handleSizeClick(size)}
              >
                {size}
              </li>
            ))}
          </ul>
        </div>
        <div className="company-size-modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="confirm-button" onClick={handleConfirm}>Apply</button>
        </div>
      </div>
    </div>
  );
}

export default CompanySizeSelectionModal;

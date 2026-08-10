import React, { useState } from 'react';
import './BenefitSelectionModal.css';

const BenefitSelectionModal = ({ isOpen, onClose, onSave, selectedBenefits = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('근무 환경');
  const [selectedItems, setSelectedItems] = useState(selectedBenefits);

  const categories = [
    '급여제도',
    '근무 환경',
    '출퇴근/근무제도',
    '지원금/보험',
    '리프레시',
    '조직 문화',
    '교육/생활',
    '선물'
  ];

  const benefitsByCategory = {
    '급여제도': [
      '성과급',
      '인센티브',
      '스톡옵션',
      '연봉제',
      '시급제',
      '일급제',
      '월급제',
      '연봉 협상',
      '연봉 인상',
      '연봉 보장',
      '연봉 상위 10%',
      '연봉 상위 25%',
      '연봉 상위 50%',
      '연봉 상위 75%',
      '연봉 상위 90%'
    ],
    '근무 환경': [
      '수유실',
      '사내 어린이집 운영',
      '휴게실',
      '수면실',
      '회의실',
      '공기청정기',
      '카페테리아',
      '게임기',
      '전용 사옥',
      '사내 정원',
      '건물 내 경사로',
      '휠체어용 난간',
      '유도점자블록',
      '장애인 화장실',
      '장애인 전용주차장',
      '장애인 엘리베이터',
      '비상경보장치',
      '문턱 없음',
      '유니폼지급',
      '스마트기기',
      '노트북',
      '사원증',
      '자회사 제품할인',
      '콘도/리조트 이용권',
      '사내도서관',
      '사무용품 지급',
      '최고 성능 컴퓨터',
      '안마실/안마의자',
      '사내 의원/약국',
      '스탠딩 책상',
      '비자 발급 지원'
    ],
    '출퇴근/근무제도': [
      '유연근무제',
      '재택근무',
      '시차출근제',
      '선택근무제',
      '반반근무제',
      '주4일제',
      '주3일제',
      '주2일제',
      '주1일제',
      '무제한 휴가',
      '반차',
      '반반차',
      '반반반차',
      '반반반반차',
      '반반반반반차',
      '반반반반반반차',
      '반반반반반반반차',
      '반반반반반반반반차',
      '반반반반반반반반반차',
      '반반반반반반반반반반차'
    ],
    '지원금/보험': [
      '식대 지원',
      '교통비 지원',
      '주거비 지원',
      '통신비 지원',
      '복리후생비',
      '경조사 지원',
      '의료비 지원',
      '치료비 지원',
      '검진비 지원',
      '보험료 지원',
      '연금 지원',
      '퇴직연금',
      '확정급여형',
      '확정기여형',
      'IRP',
      '개인연금',
      '퇴직연금',
      '퇴직연금',
      '퇴직연금',
      '퇴직연금'
    ],
    '리프레시': [
      '휴가',
      '반차',
      '반반차',
      '반반반차',
      '반반반반차',
      '반반반반반차',
      '반반반반반반차',
      '반반반반반반반차',
      '반반반반반반반반차',
      '반반반반반반반반반차',
      '반반반반반반반반반반차'
    ],
    '조직 문화': [
      '수평적 조직문화',
      '자유로운 조직문화',
      '창의적인 조직문화',
      '혁신적인 조직문화',
      '도전적인 조직문화',
      '협력적인 조직문화',
      '개방적인 조직문화',
      '민주적인 조직문화',
      '자율적인 조직문화',
      '유연한 조직문화'
    ],
    '교육/생활': [
      '교육비 지원',
      '학자금 지원',
      '도서구입비',
      '자격증 취득 지원',
      '어학연수 지원',
      '해외연수 지원',
      '사내 교육',
      '사외 교육',
      '온라인 교육',
      '오프라인 교육'
    ],
    '선물': [
      '생일 선물',
      '기념일 선물',
      '명절 선물',
      '연말 선물',
      '입사 기념 선물',
      '퇴사 기념 선물',
      '결혼 기념 선물',
      '출산 기념 선물',
      '장기 근속 선물',
      '특별한 날 선물'
    ]
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleBenefitToggle = (benefit) => {
    setSelectedItems(prev => {
      if (prev.includes(benefit)) {
        return prev.filter(item => item !== benefit);
      } else {
        return [...prev, benefit];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedItems);
    onClose();
  };

  const handleCancel = () => {
    setSelectedItems(selectedBenefits);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="benefit-modal-overlay">
      <div className="benefit-modal">
        <div className="benefit-modal-header">
          <h3>Select benefits</h3>
          <button className="close-button" onClick={handleCancel}>×</button>
        </div>
        
        <div className="benefit-modal-content">
          <div className="categories-section">
            <div className="categories-scroll">
              <ul className="categories-list">
                {categories.map(category => (
                  <li 
                    key={category}
                    className={selectedCategory === category ? 'active' : ''}
                  >
                    <button 
                      type="button"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <span>{category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="benefits-section">
            <div className="benefits-scroll">
              <ul className="benefits-list">
                {benefitsByCategory[selectedCategory]?.map(benefit => (
                  <li key={benefit}>
                    <label className="benefit-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(benefit)}
                        onChange={() => handleBenefitToggle(benefit)}
                      />
                      <span className="benefit-text">{benefit}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="benefit-modal-footer">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancel
          </button>
          <button type="button" className="btn-save" onClick={handleSave}>
              Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BenefitSelectionModal;

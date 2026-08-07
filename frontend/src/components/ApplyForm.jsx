import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaCode, FaFileAlt, FaGithub } from 'react-icons/fa';

function ApplyForm({ post, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    githubLogin: '',
    languages: '',
    experience: '',
    portfolio: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요';
    }

    if (!formData.githubLogin.trim()) {
      newErrors.githubLogin = 'GitHub 아이디를 입력해주세요';
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.githubLogin)) {
      newErrors.githubLogin = 'GitHub 아이디는 영문, 숫자, 하이픈(-)만 사용 가능합니다';
    }

    if (!formData.languages.trim()) {
      newErrors.languages = '보유 기술을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        postId: post.postId,
        postTitle: post.postTitle
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('지원 신청 오류:', error);
      alert('지원 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    {
      name: 'name',
      label: '이름',
      type: 'text',
      placeholder: '홍길동',
      icon: FaUser,
      required: true
    },
    {
      name: 'email',
      label: '이메일',
      type: 'email',
      placeholder: 'example@email.com',
      icon: FaEnvelope,
      required: true
    },
    {
      name: 'phone',
      label: '연락처',
      type: 'tel',
      placeholder: '010-1234-5678',
      icon: FaPhone,
      required: true
    },
    {
      name: 'githubLogin',
      label: 'GitHub 아이디',
      type: 'text',
      placeholder: 'username',
      icon: FaGithub,
      required: true
    }
  ];

  return (
    <motion.form 
      className="apply-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="form-header">
        <h3>{post.postTitle} 지원하기</h3>
        <p>아래 정보를 입력하여 지원해주세요</p>
      </div>

      <div className="form-section">
        <h4>기본 정보</h4>
        <div className="form-grid">
          {inputFields.map(field => (
            <div key={field.name} className="form-group">
              <label htmlFor={field.name}>
                <field.icon />
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className={errors[field.name] ? 'error' : ''}
              />
              {errors[field.name] && (
                <span className="error-message">{errors[field.name]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4>기술 및 경험</h4>
        <div className="form-group">
          <label htmlFor="languages">
            <FaCode />
            보유 기술 <span className="required">*</span>
          </label>
          <textarea
            id="languages"
            name="languages"
            value={formData.languages}
            onChange={handleChange}
            placeholder="예: JavaScript, React, Node.js, Python, Java 등"
            rows="3"
            className={errors.languages ? 'error' : ''}
          />
          {errors.languages && (
            <span className="error-message">{errors.languages}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="experience">
            <FaFileAlt />
            관련 경험 (선택)
          </label>
          <textarea
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            placeholder="관련 프로젝트나 업무 경험을 간단히 설명해주세요"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="portfolio">
            <FaFileAlt />
            포트폴리오 URL (선택)
          </label>
          <input
            type="url"
            id="portfolio"
            name="portfolio"
            value={formData.portfolio}
            onChange={handleChange}
            placeholder="https://your-portfolio.com"
          />
        </div>
      </div>

      <div className="form-section">
        <h4>지원 동기</h4>
        <div className="form-group">
          <label htmlFor="message">
            지원 동기 및 자기소개 (선택)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="이 포지션에 지원하게 된 동기나 본인에 대한 소개를 자유롭게 작성해주세요"
            rows="5"
          />
        </div>
      </div>

      <div className="form-footer">
        <motion.button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          취소
        </motion.button>
        <motion.button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSubmitting ? (
            <>
              <div className="spinner"></div>
              지원 중...
            </>
          ) : (
            '지원하기'
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}

export default ApplyForm;

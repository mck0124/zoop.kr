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
  const [submitError, setSubmitError] = useState('');

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
      newErrors.name = 'Please enter your name.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number.';
    }

    if (!formData.githubLogin.trim()) {
      newErrors.githubLogin = 'Please enter your GitHub username.';
    } else if (!/^[a-zA-Z0-9-]+$/.test(formData.githubLogin)) {
      newErrors.githubLogin = 'Use only letters, numbers, and hyphens in your GitHub username.';
    }

    if (!formData.languages.trim()) {
      newErrors.languages = 'Please list at least one skill.';
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
    setSubmitError('');
    
    try {
      const submitData = {
        ...formData,
        postId: post.postId,
        postTitle: post.postTitle
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitError('We could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    {
      name: 'name',
      label: 'Full name',
      type: 'text',
      placeholder: 'Minchan Kim',
      icon: FaUser,
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'example@email.com',
      icon: FaEnvelope,
      required: true
    },
    {
      name: 'phone',
      label: 'Phone number',
      type: 'tel',
      placeholder: '010-1234-5678',
      icon: FaPhone,
      required: true
    },
    {
      name: 'githubLogin',
      label: 'GitHub username',
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
        <h3>Apply for {post.postTitle}</h3>
        <p>Share a few details so the hiring team can review your application.</p>
      </div>
      {submitError && <p role="alert" style={{ color: '#b42318', marginBottom: '1rem' }}>{submitError}</p>}

      <div className="form-section">
        <h4>Basic information</h4>
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
        <h4>Skills and experience</h4>
        <div className="form-group">
          <label htmlFor="languages">
            <FaCode />
            Skills <span className="required">*</span>
          </label>
          <textarea
            id="languages"
            name="languages"
            value={formData.languages}
            onChange={handleChange}
            placeholder="e.g. JavaScript, React, Node.js, Python, Java"
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
            Relevant experience (optional)
          </label>
          <textarea
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            placeholder="Briefly describe relevant projects or work experience"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="portfolio">
            <FaFileAlt />
            Portfolio URL (optional)
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
        <h4>Motivation</h4>
        <div className="form-group">
          <label htmlFor="message">
            Motivation and introduction (optional)
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us why this role interests you and introduce yourself"
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
          Cancel
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
              Submitting...
            </>
          ) : (
            'Submit application'
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}

export default ApplyForm;

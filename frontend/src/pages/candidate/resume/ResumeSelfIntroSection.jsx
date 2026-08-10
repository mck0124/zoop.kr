import React, { useState } from 'react';

const ResumeSelfIntroSection = ({ form, setForm }) => {
  const [coreSkills, setCoreSkills] = useState([]);
  const [urls, setUrls] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const maxLen = 1000;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, selfIntro: e.target.value }));
  };

  const handleAICareer = () => {
    setAiLoading(true);
    setTimeout(() => {
      setForm((prev) => ({ ...prev, selfIntro: 'AI-generated career summary example. Connect your experience, projects, skills, and measurable outcomes here.' }));
      setAiLoading(false);
    }, 1200);
  };

  const addCoreSkill = () => {
    const skill = prompt('Enter a core skill');
    if (skill) setCoreSkills([...coreSkills, skill]);
  };
  const addUrl = () => {
    const url = prompt('Enter a URL');
    if (url) setUrls([...urls, url]);
  };

  return (
    <section className="resume-section">
      <div className="selfintro-card" style={{ background: 'white', border: 'none', borderRadius: 20, padding: 0, boxShadow: 'none', margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ color: '#222', fontSize: '1.5rem', fontWeight: 700, paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0', flex: 1, position: 'relative' }}>
            Career summary
            <span style={{
              content: "''",
              position: 'absolute',
              bottom: -2,
              left: 0,
              width: 60,
              height: 2,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: 1,
              display: 'inline-block',
            }} />
          </div>
        </div>
        <div className="selfintro-tip">
          <b>AI-assisted!</b> TIP. More specific experience details lead to stronger generated results.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="selfintro-btns" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="selfintro-sub-btn" onClick={addCoreSkill}>+ Core skill</button>
            <button className="selfintro-sub-btn" onClick={addUrl}>+ URL</button>
          </div>
          <button className="ai-career-btn" onClick={handleAICareer} disabled={aiLoading} style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {aiLoading ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
        <div className="selfintro-inputs">
          {coreSkills.length > 0 && (
            <div className="core-skills-list">
              {coreSkills.map((s, i) => <span key={i} className="core-skill-chip">{s}</span>)}
            </div>
          )}
          {urls.length > 0 && (
            <div className="urls-list">
              {urls.map((u, i) => <span key={i} className="url-chip">{u}</span>)}
            </div>
          )}
          <textarea
            value={form.selfIntro || ''}
            onChange={handleChange}
            rows={7}
            maxLength={maxLen}
            placeholder="Describe your experience, projects, skills, and outcomes (e.g. Python, data analysis, leadership)."
          />
          <div className="selfintro-footer">
            <span className="selfintro-count">{(form.selfIntro || '').length} / {maxLen} characters</span>
          </div>
        </div>
      </div>
    </section>
  );
};
export default ResumeSelfIntroSection;

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ko', label: '한국어', name: '한국어' },
  { code: 'zh', label: '中文', name: '中文' },
];

const LanguageContext = createContext(null);

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('zoopLanguage');
  return SUPPORTED_LANGUAGES.some(({ code }) => code === saved) ? saved : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem('zoopLanguage', language);
    window.localStorage.setItem('aboutLang', language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

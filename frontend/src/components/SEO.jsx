import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  structuredData 
}) => {
  const location = useLocation();

  useEffect(() => {
    // 페이지 제목 설정
    document.title = title || 'ZOOP - Evidence-first hiring platform';
    
    // 메타 태그 업데이트
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph 태그 업데이트
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', image);
    updateMetaTag('og:url', url || window.location.href);
    updateMetaTag('og:type', type);
    
    // Twitter Card 태그 업데이트
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Canonical URL 설정
    updateCanonicalUrl(url);
    
    // 구조화된 데이터 추가
    if (structuredData) {
      addStructuredData(structuredData);
    }
    
    // Google Analytics 페이지뷰 추적 (선택사항)
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname + location.search
      });
    }
  }, [title, description, keywords, image, url, type, structuredData, location]);

  const updateMetaTag = (name, content) => {
    if (!content) return;
    
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.querySelector(`meta[property="${name}"]`);
    }
    
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      // 새 메타 태그 생성
      meta = document.createElement('meta');
      if (name.startsWith('og:')) {
        meta.setAttribute('property', name);
      } else if (name.startsWith('twitter:')) {
        meta.setAttribute('name', name);
      } else {
        meta.setAttribute('name', name);
      }
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
    }
  };

  const updateCanonicalUrl = (url) => {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url || window.location.href);
  };

  const addStructuredData = (data) => {
    // 기존 구조화된 데이터 제거
    const existingScript = document.querySelector('script[data-seo="structured-data"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    // 새 구조화된 데이터 추가
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'structured-data');
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  };

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default SEO;

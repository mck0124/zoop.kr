// Keep browser service URLs in one place. Local development can run without
// copying an env file, while production still requires explicit public URLs.
export const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const localDefaults = process.env.NODE_ENV !== 'production' ? {
  core: 'http://localhost:8080',
  chatbot: 'http://localhost:8101',
  interview: 'http://localhost:8102',
  matching: 'http://localhost:8103',
  ocr: 'http://localhost:5103',
} : null;
const serviceUrl = (configured, fallback) => (configured || fallback || API_BASE_URL || '').replace(/\/$/, '');

export const PYTHON_API_URL = serviceUrl(process.env.REACT_APP_PYTHON_API_URL, localDefaults?.chatbot);
export const CHATBOT_API_URL = serviceUrl(process.env.REACT_APP_CHATBOT_API_URL, localDefaults?.chatbot || PYTHON_API_URL);
export const INTERVIEW_API_URL = serviceUrl(process.env.REACT_APP_INTERVIEW_API_URL, localDefaults?.interview || PYTHON_API_URL);
export const MATCHING_API_URL = serviceUrl(process.env.REACT_APP_MATCHING_API_URL, localDefaults?.matching || PYTHON_API_URL);
export const OCR_API_URL = serviceUrl(process.env.REACT_APP_OCR_API_URL, localDefaults?.ocr);

export function apiUrl(path, baseUrl = API_BASE_URL) {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isTrustedApiUrl(url, baseUrl = API_BASE_URL) {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('/api/')) return true;
  if (!baseUrl || !/^https?:\/\//i.test(url)) return false;
  return url === baseUrl || url.startsWith(`${baseUrl}/`);
}

export function withApiBase(url, baseUrl = API_BASE_URL) {
  if (typeof url !== 'string') return url;
  return url
    .replace(/^http:\/\/localhost:8080/, API_BASE_URL)
    .replace(/^http:\/\/localhost:8101/, CHATBOT_API_URL)
    .replace(/^http:\/\/localhost:8102/, INTERVIEW_API_URL)
    .replace(/^http:\/\/localhost:8103/, MATCHING_API_URL)
    .replace(/^http:\/\/localhost:5103/, OCR_API_URL);
}

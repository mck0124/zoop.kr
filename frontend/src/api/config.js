// Keep browser service URLs in one place so production builds never depend on localhost.
export const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
export const PYTHON_API_URL = (process.env.REACT_APP_PYTHON_API_URL || API_BASE_URL).replace(/\/$/, '');
export const CHATBOT_API_URL = (process.env.REACT_APP_CHATBOT_API_URL || PYTHON_API_URL).replace(/\/$/, '');
export const INTERVIEW_API_URL = (process.env.REACT_APP_INTERVIEW_API_URL || PYTHON_API_URL).replace(/\/$/, '');
export const MATCHING_API_URL = (process.env.REACT_APP_MATCHING_API_URL || PYTHON_API_URL).replace(/\/$/, '');
export const OCR_API_URL = (process.env.REACT_APP_OCR_API_URL || API_BASE_URL).replace(/\/$/, '');

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
    .replace(/^http:\/\/localhost:8081/, API_BASE_URL)
    .replace(/^http:\/\/localhost:8001/, CHATBOT_API_URL)
    .replace(/^http:\/\/localhost:8002/, INTERVIEW_API_URL)
    .replace(/^http:\/\/localhost:8003/, MATCHING_API_URL)
    .replace(/^http:\/\/localhost:5003/, OCR_API_URL);
}

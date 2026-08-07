import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Load shared candidate navigation styles once in a deterministic order.
import './pages/candidate/Portfolio/PortfolioNavbar.css';
import './pages/candidate/Sidebar/Sidebar.css';
import './pages/candidate/Sidebar/Header.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import axios from 'axios';
import { API_BASE_URL, isTrustedApiUrl, withApiBase } from './api/config';

// Transitional compatibility for legacy screens that still build absolute API URLs.
// New code should use apiUrl() directly; this boundary keeps old flows deployable.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const originalUrl = typeof input === 'string' ? input : input?.url;
  const rewrittenUrl = withApiBase(originalUrl);
  const isApiRequest = isTrustedApiUrl(rewrittenUrl);
  const token = localStorage.getItem('jwtToken');
  const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
  if (isApiRequest && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (input instanceof Request) {
    return nativeFetch(new Request(rewrittenUrl, input), { ...init, headers });
  }
  return nativeFetch(rewrittenUrl, { ...init, headers });
};
axios.interceptors.request.use(config => {
  if (typeof config.url === 'string') config.url = withApiBase(config.url);
  if (!config.baseURL) config.baseURL = API_BASE_URL;
  const token = localStorage.getItem('jwtToken');
  if (token && isTrustedApiUrl(config.url, API_BASE_URL) && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

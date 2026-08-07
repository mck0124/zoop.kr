import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import axios from 'axios';
import { API_BASE_URL, withApiBase } from './api/config';

// Transitional compatibility for legacy screens that still build absolute API URLs.
// New code should use apiUrl() directly; this boundary keeps old flows deployable.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === 'string') return nativeFetch(withApiBase(input), init);
  if (input instanceof Request) return nativeFetch(new Request(withApiBase(input.url), input), init);
  return nativeFetch(input, init);
};
axios.interceptors.request.use(config => {
  if (typeof config.url === 'string') config.url = withApiBase(config.url);
  if (!config.baseURL) config.baseURL = API_BASE_URL;
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

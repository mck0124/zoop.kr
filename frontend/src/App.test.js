import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the ZOOP recruiting landing page', () => {
  window.localStorage.clear();
  render(<App />);
  expect(screen.getByText(/Everything hiring needs/)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Verified evidence' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '챗봇 열기' })).toBeInTheDocument();
});

test('switches the landing page between English, Korean, and Chinese', () => {
  window.localStorage.clear();
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'View in 한국어' }));
  expect(screen.getByText(/채용의 모든 것/)).toBeInTheDocument();
  expect(window.localStorage.getItem('zoopLanguage')).toBe('ko');

  fireEvent.click(screen.getByRole('button', { name: 'View in 中文' }));
  expect(screen.getByText(/招聘所需的一切/)).toBeInTheDocument();
  expect(window.localStorage.getItem('zoopLanguage')).toBe('zh');
});

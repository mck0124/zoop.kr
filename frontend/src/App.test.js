import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the ZOOP recruiting landing page', () => {
  render(<App />);
  expect(screen.getByText(/채용의 모든 것/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '챗봇 열기' })).toBeInTheDocument();
});

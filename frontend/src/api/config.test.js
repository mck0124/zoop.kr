import { isTrustedApiUrl } from './config';

test('only treats same-origin or configured API URLs as trusted', () => {
  expect(isTrustedApiUrl('/api/candidates', '')).toBe(true);
  expect(isTrustedApiUrl('https://accounts.google.com/o/oauth2/auth', '')).toBe(false);
  expect(isTrustedApiUrl('https://api.example.com/api/candidates', 'https://api.example.com')).toBe(true);
  expect(isTrustedApiUrl('https://api.example.com.attacker.test/api', 'https://api.example.com')).toBe(false);
});

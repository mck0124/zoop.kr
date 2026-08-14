import { formatSalaryRange, formatSalaryValue } from './formatters';

test('formats stored ten-thousand-won salary values in English', () => {
  expect(formatSalaryRange('5000', '6000')).toBe('KRW 50M – KRW 60M');
});

test('keeps already absolute salary values readable', () => {
  expect(formatSalaryValue('120000')).toBe('KRW 120K');
  expect(formatSalaryValue('')).toBe('Not specified');
});

export function formatSalaryValue(value) {
  if (value === null || value === undefined || value === '') return 'Not specified';
  const raw = String(value).replace(/[^0-9.-]/g, '');
  const number = Number(raw);
  if (!Number.isFinite(number)) return String(value);

  // Job creation stores Korean ten-thousand-won units for values below 100,000.
  const won = Math.abs(number) < 100000 ? number * 10000 : number;
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(won);
  return `KRW ${compact}`;
}

export function formatSalaryRange(start, end) {
  if ((start === null || start === undefined || start === '') && (end === null || end === undefined || end === '')) {
    return 'Not specified';
  }
  return `${formatSalaryValue(start)} – ${formatSalaryValue(end)}`;
}

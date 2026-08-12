import {
  DEMO_CANDIDATE_POSTINGS,
  DEMO_COMPANY_INFO,
  DEMO_COMPANY_POSTINGS,
} from './demoData';

const candidate = { candidateId: 1001, candidateName: 'Alex Morgan', githubLogin: 'demo.candidate', candidateEmail: 'alex@demo.example', candidateBio: 'Frontend engineer focused on accessible product experiences.', candidateGithubUrl: 'https://github.com/demo-candidate' };
const applicants = [{ candidateId: 1001, candidateName: 'Alex Morgan', githubLogin: 'demo.candidate', candidateEmail: 'alex@demo.example', score: 92, analysisScore: 92, jobCandCurrStage: '2y', postId: 9001, githubSearchResultId: 6001, githubProfileUrl: 'https://github.com/demo-candidate', avatarUrl: '/person.png', repositoriesCount: 24, followers: 180 }];
const analysis = { version: 'github-evidence-v1', score: 92, summary: 'Strong evidence of frontend product ownership and reliable delivery.', evidence: [{ verification_state: 'verified', claim: 'Built production React interfaces', source: 'GitHub activity' }], dimensions: [{ name: 'Product engineering', score: 92, evidence: [{ verification_state: 'verified', source: 'Repository history' }] }] };

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export function demoFetch(input, init = {}) {
  const rawUrl = typeof input === 'string' ? input : input?.url || '';
  const url = new URL(rawUrl, window.location.origin);
  const path = url.pathname;
  const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();

  if (path.includes('/api/candidates/') && path.endsWith('/job-postings')) return Promise.resolve(jsonResponse(DEMO_CANDIDATE_POSTINGS));
  if (path.match(/\/api\/candidates\/\d+$/)) return Promise.resolve(jsonResponse(candidate));
  if (path.includes('/api/candidates')) {
    if (path.includes('/preferences')) return Promise.resolve(jsonResponse({ preferredJobs: ['Frontend'], preferredRegions: ['Remote'] }));
    if (path.includes('/check-id')) return Promise.resolve(jsonResponse({ available: true }));
    return Promise.resolve(jsonResponse(candidate));
  }
  if (path.endsWith('/api/postings/company')) return Promise.resolve(jsonResponse(DEMO_COMPANY_POSTINGS));
  if (path.includes('/api/postings/info/')) return Promise.resolve(jsonResponse({ ...DEMO_COMPANY_POSTINGS[0], postDescription: 'Build trustworthy hiring tools with a small, focused team.' }));
  if (path.includes('/api/postings')) return Promise.resolve(jsonResponse({ ...DEMO_COMPANY_POSTINGS[0], postId: 9001 }));
  if (path.includes('/api/companyadmins/info')) return Promise.resolve(jsonResponse({ ...DEMO_COMPANY_INFO, companyAdminId: 2001 }));
  if (path.includes('/api/companyadmins')) return Promise.resolve(jsonResponse({ companyAdminId: 2001, loginId: 'demo.company', adminName: 'Hiring Team' }));
  if (path.includes('/api/github-search')) return Promise.resolve(jsonResponse(applicants));
  if (path.includes('/api/ai-analysis-results')) return Promise.resolve(jsonResponse([]));
  if (path.includes('/api/ai-analysis') || path.includes('/api/analysis')) return Promise.resolve(jsonResponse(analysis));
  if (path.includes('/api/interviews') || path.includes('/api/interview-schedules')) return Promise.resolve(jsonResponse({ interviewId: 7001, postId: 9001, candidateId: 1001, status: 'SCHEDULED', scheduledAt: '2026-08-20T10:00:00' }));
  if (path.includes('/api/bookmarks')) return Promise.resolve(jsonResponse(method === 'GET' ? [{ postId: 9001 }] : { success: true }));
  if (path.includes('/api/resumes') || path.includes('/api/portfolios')) return Promise.resolve(jsonResponse({ success: true, portfolioUrl: 'https://github.com/demo-candidate', status: 'SUBMITTED' }));
  if (path.includes('/api/progress') || path.includes('/api/invitations') || path.includes('/api/email')) return Promise.resolve(jsonResponse({ success: true, message: 'Demo action completed.' }));
  if (path.includes('/api/applications') || path.includes('/api/job-candidates')) return Promise.resolve(jsonResponse({ success: true, applicationId: 9901 }));
  if (path.includes('/api/notifications')) return Promise.resolve(jsonResponse([]));

  // A successful no-op keeps secondary demo buttons usable without a database.
  return Promise.resolve(jsonResponse({ success: true, demo: true }));
}

export function installDemoApiMocks() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const rawUrl = typeof input === 'string' ? input : input?.url || '';
    if (new URL(rawUrl, window.location.origin).pathname.startsWith('/api/')) return demoFetch(input, init);
    return nativeFetch(input, init);
  };
}

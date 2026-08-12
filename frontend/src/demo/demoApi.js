import {
  DEMO_CANDIDATE_POSTINGS,
  DEMO_COMPANY_INFO,
  DEMO_COMPANY_POSTINGS,
} from './demoData';

const DEMO_GITHUB_LOGIN = 'gaearon';
const DEMO_CANDIDATE_CACHE_KEY = 'zoop.demo.githubCandidates';
const candidate = { candidateId: 1001, candidateName: 'Alex Morgan', githubLogin: DEMO_GITHUB_LOGIN, candidateEmail: 'alex@demo.example', candidateBio: 'GitHub profile loaded from the public GitHub API.', candidateGithubUrl: `https://github.com/${DEMO_GITHUB_LOGIN}` };
const applicants = [{
  ...candidate,
  candidateName: 'Dan Abramov',
  login: DEMO_GITHUB_LOGIN,
  candidateGithubUrl: `https://github.com/${DEMO_GITHUB_LOGIN}`,
  githubProfileUrl: `https://github.com/${DEMO_GITHUB_LOGIN}`,
  candidateLanguages: 'JavaScript, TypeScript',
  languages: ['JavaScript', 'TypeScript'],
  followers: 0,
  publicRepos: 0,
  repositoriesCount: 0,
  analysisScore: null,
  score: null,
}];
const analysis = { version: 'github-evidence-v1', score: 92, summary: 'Strong evidence of frontend product ownership and reliable delivery.', evidence: [{ verification_state: 'verified', claim: 'Built production React interfaces', source: 'GitHub activity' }], dimensions: [{ name: 'Product engineering', score: 92, evidence: [{ verification_state: 'verified', source: 'Repository history' }] }] };

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function fetchRealGithubCandidate() {
  const cached = window.localStorage.getItem(DEMO_CANDIDATE_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch { window.localStorage.removeItem(DEMO_CANDIDATE_CACHE_KEY); }
  }

  const profileResponse = await fetch(`https://api.github.com/users/${DEMO_GITHUB_LOGIN}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!profileResponse.ok) throw new Error(`GitHub profile request failed: ${profileResponse.status}`);
  const profile = await profileResponse.json();

  const reposResponse = await fetch(`https://api.github.com/users/${DEMO_GITHUB_LOGIN}/repos?per_page=12&sort=updated`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  const repos = reposResponse.ok ? await reposResponse.json() : [];
  const languageCounts = repos.reduce((counts, repo) => {
    if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
    return counts;
  }, {});
  const languages = Object.keys(languageCounts).sort((a, b) => languageCounts[b] - languageCounts[a]);
  const realCandidate = {
    candidateId: 1001,
    candidateName: profile.name || profile.login,
    githubLogin: profile.login,
    login: profile.login,
    candidateEmail: 'alex@demo.example',
    candidateBio: profile.bio || 'Public GitHub contributor',
    candidateGithubUrl: profile.html_url,
    githubProfileUrl: profile.html_url,
    profileUrl: profile.html_url,
    avatarUrl: profile.avatar_url,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
    repositoriesCount: profile.public_repos,
    githubCreatedAt: profile.created_at,
    candidateLanguages: languages.join(', '),
    languages,
    repositories: repos.map(repo => ({
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at,
    })),
    jobCandCurrStage: '2y',
    postId: 9001,
    githubSearchResultId: 6001,
    analysisScore: null,
    score: null,
  };
  window.localStorage.setItem(DEMO_CANDIDATE_CACHE_KEY, JSON.stringify(realCandidate));
  return realCandidate;
}

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
  if (path.includes('/api/github-search')) {
    return fetchRealGithubCandidate()
      .then(realCandidate => jsonResponse([realCandidate]))
      .catch(() => jsonResponse(applicants));
  }
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

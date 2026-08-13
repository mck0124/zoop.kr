import {
  DEMO_CANDIDATE_POSTINGS,
  DEMO_COMPANY_INFO,
  DEMO_COMPANY_POSTINGS,
} from './demoData';

const DEMO_GITHUB_LOGINS = ['gaearon', 'sindresorhus', 'kentcdodds', 'yyx990803', 'tj'];
const DEMO_CANDIDATE_CACHE_KEY = 'zoop.demo.githubCandidates';
const candidate = { candidateId: 1001, candidateName: 'Minchan Kim', githubLogin: DEMO_GITHUB_LOGINS[0], candidateEmail: 'minchan0124@gmail.com', candidateBio: 'GitHub profile loaded from the public GitHub API.', candidateGithubUrl: `https://github.com/${DEMO_GITHUB_LOGINS[0]}` };
const applicants = DEMO_GITHUB_LOGINS.map((login, index) => ({
  ...candidate,
  candidateId: 1001 + index,
  candidateName: login,
  login,
  githubLogin: login,
  candidateGithubUrl: `https://github.com/${login}`,
  githubProfileUrl: `https://github.com/${login}`,
  candidateLanguages: '',
  languages: [],
  followers: 0,
  publicRepos: 0,
  repositoriesCount: 0,
  analysisScore: null,
  score: null,
  githubSearchResultId: 6001 + index,
}));
const analysis = { version: 'github-evidence-v1', score: 92, summary: 'Strong evidence of frontend product ownership and reliable delivery.', evidence: [{ verification_state: 'verified', claim: 'Built production React interfaces', source: 'GitHub activity' }], dimensions: [{ name: 'Product engineering', score: 92, evidence: [{ verification_state: 'verified', source: 'Repository history' }] }] };

const DEMO_DASHBOARD_CANDIDATES = [
  { login: 'gaearon', stage: '2y', score: 94, email: 'gaearon@demo.example', searched: '2026-08-08T09:20:00Z', interviewDate: '2026-08-21T14:00:00Z' },
  { login: 'sindresorhus', stage: '1n', score: 89, email: 'sindresorhus@demo.example', searched: '2026-08-07T15:40:00Z' },
  { login: 'kentcdodds', stage: '2y', score: 87, email: 'kentcdodds@demo.example', searched: '2026-08-06T11:10:00Z' },
  { login: 'yyx990803', stage: '0', score: 82, email: 'yyx990803@demo.example', searched: '2026-08-05T16:25:00Z' },
  { login: 'tj', stage: '3y', score: 78, email: 'tj@demo.example', searched: '2026-08-04T10:05:00Z' },
].map((item, index) => ({
  jobCandidateId: 7100 + index,
  postId: 9001,
  githubSearchResultId: 6001 + index,
  candidate: {
    candidateId: 1001 + index,
    githubLogin: item.login,
    login: item.login,
    candidateName: item.login,
    candidateEmail: item.email,
    githubProfileUrl: `https://github.com/${item.login}`,
    candidateGithubUrl: `https://github.com/${item.login}`,
    candidateBio: 'Technical candidate discovered through public GitHub activity.',
    githubSearchDate: item.searched,
    jobCandidateId: 7100 + index,
    postId: 9001,
    candPortfolioId: 8100 + index,
    interviewDate: item.interviewDate,
    analysisScore: item.score,
  },
  jobCandCurrStage: item.stage,
  candPortfolioId: 8100 + index,
  aiAnalysis: {
    analysisId: 9100 + index,
    analysisScore: item.score,
    analysisData: JSON.stringify({
      version: 'github-evidence-v1', score: item.score, evidence_coverage: 100, confidence: 0.82,
      dimensions: [{ name: 'GitHub profile signals', score: item.score, evidence: [{ verification_state: 'verified', source: 'GitHub public API' }] }],
      evidence: [{ verification_state: 'verified', source: 'GitHub public API', claim: 'Public technical activity observed' }],
    }),
  },
}));

const dashboardCandidatesFor = (postId, filter) => {
  let rows = DEMO_DASHBOARD_CANDIDATES.filter(row => row.postId === Number(postId));
  if (filter === 'interview-scheduled') rows = rows.filter(row => row.candidate.interviewDate);
  if (filter === 'interview-completed') rows = rows.filter(row => row.jobCandCurrStage === '3y');
  if (filter === 'no-response') rows = rows.filter(row => row.jobCandCurrStage === '0');
  if (filter === 'response') rows = rows.filter(row => row.jobCandCurrStage !== '0');
  if (filter === 'matched-candidates') rows = rows.filter(row => row.candPortfolioId);
  if (filter === 'additional-applicants') rows = rows.filter(row => row.jobCandCurrStage === '0');
  return rows;
};

const DEMO_NOTIFICATIONS = [
  { notificationId: 1, type: 'candidate-response', title: 'Candidate response received', message: 'sindresorhus opened your invitation for Frontend Engineer.', createdAt: '2026-08-12T09:15:00Z', isRead: false },
  { notificationId: 2, type: 'interview-scheduled', title: 'Interview scheduled', message: 'gaearon is scheduled for an interview on August 21.', createdAt: '2026-08-11T16:30:00Z', isRead: false },
  { notificationId: 3, type: 'new-match', title: 'New candidate match', message: 'A new candidate matched your Evidence Platform role.', createdAt: '2026-08-10T11:00:00Z', isRead: true },
];

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const clamp = (value, min, max) => Math.max(min, Math.min(max, Math.round(value)));

async function fetchGithubCandidate(login, index, searchIndex) {
  const profileResponse = await fetch(`https://api.github.com/users/${login}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  if (!profileResponse.ok) throw new Error(`GitHub profile request failed: ${profileResponse.status}`);
  const profile = await profileResponse.json();

  const reposResponse = await fetch(`https://api.github.com/users/${login}/repos?per_page=30&sort=updated`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  const repos = reposResponse.ok ? await reposResponse.json() : [];
  const languageCounts = repos.reduce((counts, repo) => {
    if (repo.language) counts[repo.language] = (counts[repo.language] || 0) + 1;
    return counts;
  }, {});
  const languages = Object.keys(languageCounts).sort((a, b) => languageCounts[b] - languageCounts[a]);
  const stars = repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);
  const latestRepoDate = repos.map(repo => Date.parse(repo.updated_at)).filter(Number.isFinite).sort((a, b) => b - a)[0];
  const daysSinceActivity = latestRepoDate ? Math.max(0, (Date.now() - latestRepoDate) / 86400000) : 999;
  const daysSinceJoined = Math.max(1, (Date.now() - Date.parse(profile.created_at)) / 86400000);
  const candidate = {
    candidateId: 1001 + index,
    candidateName: profile.name || profile.login,
    githubLogin: profile.login,
    login: profile.login,
    candidateEmail: `${profile.login}@demo.example`,
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
    repositories: repos.map(repo => ({ name: repo.name, full_name: repo.full_name, html_url: repo.html_url, description: repo.description, language: repo.language, stargazers_count: repo.stargazers_count, forks_count: repo.forks_count, updated_at: repo.updated_at })),
    followerScore: clamp(Math.log10(profile.followers + 1) * 3.2, 0, 10),
    repoScore: clamp(Math.log10(profile.public_repos + 1) * 6.5, 0, 15),
    languageScore: clamp(languages.length * 3, 0, 15),
    activityScore: clamp(daysSinceActivity < 30 ? 20 : daysSinceActivity < 90 ? 16 : daysSinceActivity < 365 ? 10 : 4, 0, 20),
    projectQualityScore: clamp(Math.log10(stars + 1) * 8, 0, 20),
    technicalDepthScore: clamp(Math.min(20, languages.length * 2 + Math.log10(repos.length + 1) * 5 + Math.min(4, daysSinceJoined / 3650)), 0, 20),
    githubStars: stars,
    githubDataSource: 'GitHub public API',
    jobCandCurrStage: '2y',
    postId: 9001,
    githubSearchResultId: searchIndex,
    analysisScore: null,
    score: null,
  };
  return candidate;
}

async function fetchRealGithubCandidates() {
  const cached = window.localStorage.getItem(DEMO_CANDIDATE_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 1) return parsed;
    } catch { /* refresh the cache below */ }
    window.localStorage.removeItem(DEMO_CANDIDATE_CACHE_KEY);
  }
  const candidates = await Promise.all(DEMO_GITHUB_LOGINS.map((login, index) => fetchGithubCandidate(login, index, 6001 + index)));
  window.localStorage.setItem(DEMO_CANDIDATE_CACHE_KEY, JSON.stringify(candidates));
  return candidates;
}

function buildDemoAiAnalysisResults(candidates) {
  return candidates.map(candidate => {
    const repositories = Array.isArray(candidate.repositories) ? candidate.repositories : [];
    const languages = Array.isArray(candidate.languages) ? candidate.languages : [];
    const dimensions = [
      ['팔로워 수', candidate.followerScore, 'Public follower count from the GitHub profile'],
      ['공개 저장소 수', candidate.repoScore, 'Public repository count from the GitHub profile'],
      ['언어 다양성', candidate.languageScore, `Observed ${languages.length} programming language(s) across public repositories`],
      ['최근 활동성', candidate.activityScore, 'Most recently updated public repositories'],
      ['프로젝트 품질', candidate.projectQualityScore, `Observed ${candidate.githubStars || 0} total star(s) across sampled repositories`],
      ['기술적 깊이', candidate.technicalDepthScore, 'Repository history, language breadth, and public project volume'],
    ].map(([name, score, claim]) => ({
      name,
      score,
      max: name === '팔로워 수' ? 10 : name === '공개 저장소 수' ? 15 : name === '언어 다양성' ? 15 : name === '최근 활동성' ? 20 : 20,
      evidence: [{ verification_state: 'verified', source: 'GitHub public API', claim }],
    }));
    const score = dimensions.reduce((sum, dimension) => sum + Number(dimension.score || 0), 0);
    return {
      githubSearchResultId: candidate.githubSearchResultId,
      analysisData: JSON.stringify({
        version: 'github-evidence-v1',
        score,
        summary: `GitHub profile signals were analyzed from ${repositories.length} public repositories.`,
        evidence_coverage: 100,
        confidence: 0.82,
        decision: 'review',
        dimensions,
        evidence: dimensions.flatMap(dimension => dimension.evidence),
        gaps: ['Verify ownership and design decisions in a representative project'],
      }),
    };
  });
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
  if (path.includes('/api/postings/info/')) {
    const postId = Number(path.split('/').pop());
    return Promise.resolve(jsonResponse(DEMO_COMPANY_POSTINGS.find(post => post.postId === postId) || DEMO_COMPANY_POSTINGS[0]));
  }
  if (path.includes('/api/postings')) return Promise.resolve(jsonResponse({ ...DEMO_COMPANY_POSTINGS[0], postId: 9001 }));
  if (path.includes('/api/companyadmins/info')) return Promise.resolve(jsonResponse({ ...DEMO_COMPANY_INFO, companyAdminId: 2001 }));
  if (path.includes('/api/companyadmins')) return Promise.resolve(jsonResponse({ companyAdminId: 2001, loginId: 'demo.company', adminName: 'Hiring Team' }));
  if (path.includes('/api/github-search/by-post/')) {
    const parts = path.split('/');
    const postId = Number(parts[parts.indexOf('by-post') + 1]);
    const filter = parts[parts.indexOf('by-post') + 2] || 'all';
    return Promise.resolve(jsonResponse(dashboardCandidatesFor(postId, filter)));
  }
  if (path.includes('/api/github-search')) {
    return fetchRealGithubCandidates()
      .then(realCandidates => jsonResponse(realCandidates))
      .catch(() => jsonResponse(applicants));
  }
  if (path.includes('/api/ai-analysis-results')) {
    let cachedCandidates = [];
    try { cachedCandidates = JSON.parse(window.localStorage.getItem(DEMO_CANDIDATE_CACHE_KEY) || '[]'); } catch { cachedCandidates = []; }
    return Promise.resolve(jsonResponse(buildDemoAiAnalysisResults(Array.isArray(cachedCandidates) ? cachedCandidates : applicants)));
  }
  if (path.includes('/api/notifications/unread-count')) return Promise.resolve(jsonResponse({ count: DEMO_NOTIFICATIONS.filter(item => !item.isRead).length }));
  if (path.includes('/api/notifications')) return Promise.resolve(jsonResponse(DEMO_NOTIFICATIONS));
  if (path.includes('/api/ai-analysis') || path.includes('/api/analysis')) return Promise.resolve(jsonResponse(analysis));
  if (path.includes('/api/interviews') || path.includes('/api/interview-schedules')) return Promise.resolve(jsonResponse({ interviewId: 7001, postId: 9001, candidateId: 1001, status: 'SCHEDULED', scheduledAt: '2026-08-20T10:00:00' }));
  if (path.includes('/api/bookmarks')) return Promise.resolve(jsonResponse(method === 'GET' ? [{ postId: 9001 }] : { success: true }));
  if (path.includes('/api/resumes') || path.includes('/api/portfolios')) return Promise.resolve(jsonResponse({ success: true, portfolioUrl: 'https://github.com/demo-candidate', status: 'SUBMITTED' }));
  if (path.includes('/api/progress') || path.includes('/api/invitations') || path.includes('/api/email')) return Promise.resolve(jsonResponse({ success: true, message: 'Demo action completed.' }));
  if (path.includes('/api/applications') || path.includes('/api/job-candidates')) return Promise.resolve(jsonResponse({ success: true, applicationId: 9901 }));

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

// Demo access is opt-in so hardcoded credentials can never be enabled by accident.
export const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';

const demoToken = (subject) => {
  const payload = btoa(JSON.stringify({ sub: subject, exp: Math.floor(Date.now() / 1000) + 86400 }));
  return `demo.${payload}.zoop`;
};

export const DEMO_ACCOUNTS = {
  candidate: {
    loginId: 'demo.candidate',
    password: 'ZoopDemo2026!',
    userId: '1001',
    displayName: 'Alex Morgan',
    token: demoToken('demo.candidate'),
  },
  company: {
    loginId: 'demo.company',
    password: 'ZoopDemo2026!',
    userId: '2001',
    displayName: 'Northstar Labs',
    token: demoToken('demo.company'),
  },
};

export const DEMO_CANDIDATE_POSTINGS = [
  {
    postId: 9001,
    companyName: 'Northstar Labs',
    postTitle: 'Frontend Engineer — Evidence Platform',
    postPostedDate: '2026-08-01',
    postExpiryDate: '2026-09-15',
    jobCandCurrStage: '2y',
  },
  {
    postId: 9002,
    companyName: 'Mosaic Commerce',
    postTitle: 'Product Engineer',
    postPostedDate: '2026-08-04',
    postExpiryDate: '2026-09-22',
    jobCandCurrStage: '1n',
  },
];

export const DEMO_COMPANY_INFO = {
  companyId: 3001,
  companyName: 'Northstar Labs',
  businessNumber: 'DEMO-2026-001',
  ceoName: 'Jordan Lee',
  adminName: 'Hiring Team',
  email: 'hiring@northstar.example',
  address: 'San Francisco, CA',
};

export const DEMO_COMPANY_POSTINGS = [
  {
    postId: 9001,
    postTitle: 'Frontend Engineer — Evidence Platform',
    postLocation: 'Remote / San Francisco',
    postHeadcount: 2,
    postPostedDate: '2026-08-01',
    postStatus: 'ACTIVE',
  },
];

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
    postDescription: 'Build trustworthy hiring tools with a small, focused team.',
    postSalaryStart: 120000,
    postSalaryEnd: 165000,
    postHeadcount: 2,
    postPostedDate: '2026-08-01',
    postExpiryDate: '2026-09-15',
    postStatus: 'ACTIVE',
  },
  {
    postId: 9002,
    postTitle: 'Product Engineer',
    postLocation: 'New York / Hybrid',
    postDescription: 'Own product experiments from discovery through delivery.',
    postSalaryStart: 130000,
    postSalaryEnd: 175000,
    postHeadcount: 1,
    postPostedDate: '2026-07-12',
    postExpiryDate: '2026-08-30',
    postStatus: 'ACTIVE',
  },
  {
    postId: 8998,
    postTitle: 'Backend Engineer',
    postLocation: 'Remote / United States',
    postDescription: 'Build reliable services for evidence-driven workflows.',
    postSalaryStart: 125000,
    postSalaryEnd: 170000,
    postHeadcount: 2,
    postPostedDate: '2026-04-10',
    postExpiryDate: '2026-06-30',
    postStatus: 'CLOSED',
  },
];

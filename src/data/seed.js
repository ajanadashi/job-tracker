const { pool, close } = require('./db');
const applications = require('./applicationRepository');

const SAMPLE = [
  { company: 'Stripe', position: 'Backend Engineer', status: 'interviewing', location: 'Remote', salaryRange: '$120k-$150k', url: 'https://stripe.com/jobs', notes: 'Phone screen went well.', appliedAt: '2026-10-20' },
  { company: 'Shopify', position: 'Full-Stack Developer', status: 'applied', location: 'Remote (EU)', appliedAt: '2026-10-28' },
  { company: 'Vercel', position: 'Developer Advocate', status: 'wishlist', notes: 'Need to tailor the CV first.' },
  { company: 'Notion', position: 'Software Engineer', status: 'rejected', location: 'Berlin', appliedAt: '2026-09-30' },
  { company: 'Linear', position: 'Platform Engineer', status: 'offer', salaryRange: '$140k', appliedAt: '2026-09-15' },
];

async function seed() {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM applications');
  if (rows[0].n > 0 && !process.argv.includes('--force')) {
    console.log('[seed] applications already exist, skipping (use --force to reset)');
    return;
  }
  if (process.argv.includes('--force')) {
    await pool.query('TRUNCATE email_jobs, applications');
  }
  for (const item of SAMPLE) await applications.create(item);
  console.log(`[seed] inserted ${SAMPLE.length} applications`);
}

seed()
  .then(() => close())
  .catch(async (err) => {
    console.error(err);
    await close();
    process.exit(1);
  });

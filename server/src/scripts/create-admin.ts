import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

// One-off bootstrap for a fresh database (e.g. a new Railway Postgres) where no Admin exists yet
// to generate signup codes for anyone else. Run once via `node dist/scripts/create-admin.js`.
// Override via env vars; falls back to the same credentials documented in AGENTS.md.
async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@campusconnect.edu';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123';
  const fullName = process.env.ADMIN_NAME ?? 'Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'Admin', status: 'Active', isEmailVerified: true },
    create: {
      email,
      passwordHash,
      fullName,
      role: 'Admin',
      status: 'Active',
      isEmailVerified: true,
    },
  });

  console.log(`Admin ready: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

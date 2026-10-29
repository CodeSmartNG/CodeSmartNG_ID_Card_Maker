import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

/* =========================================================
   HELPERS
   ========================================================= */

const hashPassword = (pw) => bcrypt.hash(pw, 12);

const pad = (n, len = 4) => String(n).padStart(len, '0');

// Deterministic member numbers: CSNG-<ORG>-<YEAR>-<SEQ>
const makeMemberNumber = (orgSlug, year, seq) =>
  `${orgSlug.toUpperCase().slice(0, 6)}-${year}-${pad(seq)}`;

// Card number: CRD-<YEAR>-<RANDOM>
const makeCardNumber = (year) =>
  `CRD-${year}-${randomBytes(3).toString('hex').toUpperCase()}`;

// Public verification token — 32 hex chars
const makeVerificationId = () => randomBytes(16).toString('hex');

// Paystack-style reference
const makeReference = (cardId) =>
  `CSNG-${cardId.slice(-8)}-${Date.now()}`;

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log('🌱 Starting seed...');

  /* ---------- 1. Wipe (idempotent dev seeding) ---------- */
  // Order matters due to FKs
  await prisma.payment.deleteMany();
  await prisma.iDCard.deleteMany();
  await prisma.member.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log('🧹 Cleared existing data');

  /* ---------- 2. Organizations ---------- */
  const acme = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corporation',
      email: 'admin@acme.test',
      phone: '+2348011111111',
      address: '12 Marina Road, Lagos Island, Lagos',
      template: 'classic',
    },
  });

  const greenfield = await prisma.organization.create({
    data: {
      name: 'Greenfield Academy',
      slug: 'greenfield-academy',
      email: 'info@greenfield.test',
      phone: '+2348022222222',
      address: '45 Unity Avenue, Abuja',
      template: 'modern',
    },
  });

  console.log('🏢 Created 2 organizations');

  /* ---------- 3. Users ---------- */
  const acmeAdmin = await prisma.user.create({
    data: {
      name: 'Sarah Okafor',
      email: 'sarah@acme.test',
      passwordHash: await hashPassword('Password1'),
      role: 'ADMIN',
      organizationId: acme.id,
    },
  });

  const acmeStaff = await prisma.user.create({
    data: {
      name: 'Tunde Bello',
      email: 'tunde@acme.test',
      passwordHash: await hashPassword('Password1'),
      role: 'STAFF',
      organizationId: acme.id,
    },
  });

  const greenAdmin = await prisma.user.create({
    data: {
      name: 'Mrs. Adaeze Nwosu',
      email: 'adaeze@greenfield.test',
      passwordHash: await hashPassword('Password1'),
      role: 'ADMIN',
      organizationId: greenfield.id,
    },
  });

  console.log('👤 Created 3 users (password: Password1)');

  /* ---------- 4. Members (Acme) ---------- */
  const acmeMemberSeed = [
    { firstName: 'John',     lastName: 'Doe',        position: 'CEO',                department: 'Executive', email: 'john.doe@acme.test',     phone: '+2348030000001' },
    { firstName: 'Chioma',   lastName: 'Eze',        position: 'Head of Finance',    department: 'Finance',   email: 'chioma.eze@acme.test',   phone: '+2348030000002' },
    { firstName: 'Ibrahim',  lastName: 'Musa',       position: 'Lead Engineer',      department: 'Engineering', email: 'ibrahim.musa@acme.test', phone: '+2348030000003' },
    { firstName: 'Funke',    lastName: 'Adeyemi',    position: 'HR Manager',         department: 'People',    email: 'funke.a@acme.test',      phone: '+2348030000004' },
    { firstName: 'Emeka',    lastName: 'Obi',        position: 'Senior Developer',   department: 'Engineering', email: 'emeka.obi@acme.test',    phone: '+2348030000005' },
    { firstName: 'Aisha',    lastName: 'Abdullahi',  position: 'Product Designer',   department: 'Product',   email: 'aisha.a@acme.test',      phone: '+2348030000006' },
  ];

  const acmeMembers = [];
  for (let i = 0; i < acmeMemberSeed.length; i++) {
    const m = acmeMemberSeed[i];
    const member = await prisma.member.create({
      data: {
        ...m,
        memberNumber: makeMemberNumber(acme.slug, 2025, i + 1),
        organizationId: acme.id,
        photoUrl: null,
      },
    });
    acmeMembers.push(member);
  }
  console.log(`👥 Created ${acmeMembers.length} Acme members`);

  /* ---------- 5. Members (Greenfield) ---------- */
  const greenMemberSeed = [
    { firstName: 'David',   lastName: 'Okonkwo', position: 'Principal',    department: 'Admin', email: 'david.o@gf.test', phone: '+2348040000001' },
    { firstName: 'Blessing',lastName: 'Uche',    position: 'Teacher',      department: 'Sciences', email: 'blessing.u@gf.test', phone: '+2348040000002' },
    { firstName: 'Kelechi', lastName: 'Nnamdi',  position: 'Bursar',       department: 'Finance', email: 'kelechi.n@gf.test', phone: '+2348040000003' },
    { firstName: 'Zainab',  lastName: 'Yusuf',   position: 'Librarian',    department: 'Library', email: 'zainab.y@gf.test', phone: '+2348040000004' },
  ];

  const greenMembers = [];
  for (let i = 0; i < greenMemberSeed.length; i++) {
    const m = greenMemberSeed[i];
    const member = await prisma.member.create({
      data: {
        ...m,
        memberNumber: makeMemberNumber(greenfield.slug, 2025, i + 1),
        organizationId: greenfield.id,
        photoUrl: null,
      },
    });
    greenMembers.push(member);
  }
  console.log(`👥 Created ${greenMembers.length} Greenfield members`);

  /* ---------- 6. ID Cards (mixed states for testing) ---------- */
  const now = new Date();
  const year = now.getFullYear();

  // Card 1 — Acme, GENERATED (fully paid + issued)
  const card1 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'GENERATED',
      memberId: acmeMembers[0].id,
      organizationId: acme.id,
      verificationId: makeVerificationId(),
      issuedAt: now,
      expiresAt: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
      frontImageUrl: null,
      backImageUrl: null,
      pdfUrl: null,
    },
  });

  // Card 2 — Acme, PAID (awaiting generation job)
  const card2 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'PAID',
      memberId: acmeMembers[1].id,
      organizationId: acme.id,
      verificationId: makeVerificationId(),
      issuedAt: now,
      expiresAt: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    },
  });

  // Card 3 — Acme, PENDING_PAYMENT (has an open Payment)
  const card3 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'PENDING_PAYMENT',
      memberId: acmeMembers[2].id,
      organizationId: acme.id,
      verificationId: makeVerificationId(),
    },
  });

  // Card 4 — Acme, DRAFT (designer saved, never paid)
  const card4 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'DRAFT',
      memberId: acmeMembers[3].id,
      organizationId: acme.id,
      verificationId: makeVerificationId(),
      designJson: {
        template: 'classic',
        primaryColor: '#0f172a',
        accentColor: '#f59e0b',
      },
    },
  });

  // Card 5 — Greenfield, GENERATED (verification testing)
  const card5 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'GENERATED',
      memberId: greenMembers[0].id,
      organizationId: greenfield.id,
      verificationId: makeVerificationId(),
      issuedAt: now,
      expiresAt: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    },
  });

  // Card 6 — Acme, REVOKED (verification should return revoked)
  const card6 = await prisma.iDCard.create({
    data: {
      cardNumber: makeCardNumber(year),
      status: 'REVOKED',
      memberId: acmeMembers[4].id,
      organizationId: acme.id,
      verificationId: makeVerificationId(),
      issuedAt: now,
      expiresAt: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    },
  });

  console.log('🪪 Created 6 ID cards (DRAFT, PENDING_PAYMENT, PAID, GENERATED, REVOKED)');

  /* ---------- 7. Payments ---------- */
  // Success — card1
  await prisma.payment.create({
    data: {
      reference: makeReference(card1.id),
      amount: 250000,
      currency: 'NGN',
      status: 'SUCCESS',
      provider: 'paystack',
      cardId: card1.id,
      organizationId: acme.id,
      paidAt: now,
      metadata: { channel: 'card', bank: 'GTBank' },
    },
  });

  // Success — card2
  await prisma.payment.create({
    data: {
      reference: makeReference(card2.id),
      amount: 250000,
      currency: 'NGN',
      status: 'SUCCESS',
      provider: 'paystack',
      cardId: card2.id,
      organizationId: acme.id,
      paidAt: now,
    },
  });

  // Pending — card3
  await prisma.payment.create({
    data: {
      reference: makeReference(card3.id),
      amount: 250000,
      currency: 'NGN',
      status: 'PENDING',
      provider: 'paystack',
      cardId: card3.id,
      organizationId: acme.id,
    },
  });

  // Success — card5 (greenfield)
  await prisma.payment.create({
    data: {
      reference: makeReference(card5.id),
      amount: 250000,
      currency: 'NGN',
      status: 'SUCCESS',
      provider: 'paystack',
      cardId: card5.id,
      organizationId: greenfield.id,
      paidAt: now,
    },
  });

  console.log('💳 Created 4 payments (3 success, 1 pending)');

  /* ---------- 8. Summary ---------- */
  console.log('\n✅ Seed complete!\n');
  console.log('┌──────────────────────────────────────────────────────┐');
  console.log('│  🔑 LOGIN CREDENTIALS (password: Password1)          │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log('│  Acme Admin:        sarah@acme.test                  │');
  console.log('│  Acme Staff:        tunde@acme.test                  │');
  console.log('│  Greenfield Admin:  adaeze@greenfield.test           │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log('│  🪪 VERIFICATION URLS                                 │');
  console.log('├──────────────────────────────────────────────────────┤');
  console.log(`│  Valid (GENERATED):    /verify/${card1.verificationId.slice(0, 8)}…        │`);
  console.log(`│  Revoked:              /verify/${card6.verificationId.slice(0, 8)}…        │`);
  console.log(`│  Paid (no PDF):        /verify/${card2.verificationId.slice(0, 8)}…        │`);
  console.log('└──────────────────────────────────────────────────────┘\n');
}

/* =========================================================
   RUN
   ========================================================= */

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

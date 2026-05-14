import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const SUPABASE_ID = 'a1b2c3d4-0000-0000-0000-ef1234567890';
  const EMAIL = 'demo@goldmind.ai';

  // Hapus data lama jika ada (idempotent)
  const existing = await prisma.user.findFirst({ where: { email: EMAIL } });
  if (existing) {
    await prisma.membership.deleteMany({ where: { userId: existing.id } });
    await prisma.transaction.deleteMany({ where: { userId: existing.id } });
    await prisma.chatSession.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('🗑️  Data demo lama dihapus');
  }

  // Buat user demo
  const user = await prisma.user.create({
    data: {
      supabase_id: SUPABASE_ID,
      email: EMAIL,
      name: 'Demo GoldMind',
      phone: '',
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ User demo dibuat:', user.id);

  // Buat membership aktif 30 hari
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      startDate: now,
      endDate: endDate,
      isActive: true,
    },
  });

  console.log('✅ Membership aktif hingga:', endDate.toLocaleDateString('id-ID'));
  console.log('\n📋 AKUN DEMO:');
  console.log('   Email    : demo@goldmind.ai');
  console.log('   Password : Demo1234!');
  console.log('   Status   : ACTIVE');
  console.log('   Aktif s/d:', endDate.toLocaleDateString('id-ID'));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

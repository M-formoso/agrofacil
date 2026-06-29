import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seed AgroFacil...');

  await seedSuperadmin();
  await seedDemo();
  await seedCultivos();
}

/// Crea (o actualiza) el superadmin de la plataforma a partir de variables de entorno.
/// Si SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD no están seteados, salta este paso con un warning.
async function seedSuperadmin(): Promise<void> {
  const email = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD;
  const nombre = process.env.SUPERADMIN_NOMBRE?.trim() ?? 'Superadmin';

  if (!email || !password) {
    console.warn('⚠  SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD no seteados — salto el seed del superadmin.');
    return;
  }

  // El superadmin necesita una Cuenta legacy por el FK histórico de Usuario.cuentaId.
  // Creamos una cuenta "Plataforma" interna que no se usa para datos agro reales.
  const cuentaPlataforma = await prisma.cuenta.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000ff' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-0000000000ff',
      nombre: 'Plataforma AgroFácil',
      emailContacto: email,
    },
  });

  const passwordHash = await bcrypt.hash(password, 12);
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      passwordHash,
      rolGlobal: 'superadmin',
      activo: true,
    },
    create: {
      email,
      passwordHash,
      nombre,
      rolGlobal: 'superadmin',
      cuentaId: cuentaPlataforma.id,
    },
  });

  // Membresía en la cuenta plataforma para satisfacer el chequeo de membresía del login.
  await prisma.usuarioCuenta.upsert({
    where: { usuarioId_cuentaId: { usuarioId: usuario.id, cuentaId: cuentaPlataforma.id } },
    update: { activo: true },
    create: {
      usuarioId: usuario.id,
      cuentaId: cuentaPlataforma.id,
      rol: 'ingeniero',
    },
  });

  console.log(`✓ Superadmin: ${usuario.email}`);
}

async function seedDemo(): Promise<void> {
  const cuenta = await prisma.cuenta.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Campo Demo',
      emailContacto: 'demo@agrofacil.dev',
    },
  });

  const passwordHash = await bcrypt.hash('agrofacil123', 12);
  const usuario = await prisma.usuario.upsert({
    where: { email: 'demo@agrofacil.dev' },
    update: {},
    create: {
      cuentaId: cuenta.id,
      email: 'demo@agrofacil.dev',
      passwordHash,
      nombre: 'Productor Demo',
    },
  });

  await prisma.usuarioCuenta.upsert({
    where: { usuarioId_cuentaId: { usuarioId: usuario.id, cuentaId: cuenta.id } },
    update: { activo: true },
    create: { usuarioId: usuario.id, cuentaId: cuenta.id, rol: 'ingeniero' },
  });

  console.log(`✓ Cuenta demo: ${cuenta.nombre}`);
  console.log(`✓ Usuario demo: ${usuario.email} / agrofacil123`);
}

async function seedCultivos(): Promise<void> {
  const cultivos = ['soja', 'trigo', 'maíz', 'girasol', 'sorgo'];
  for (const nombre of cultivos) {
    await prisma.cultivo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log(`✓ Cultivos: ${cultivos.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

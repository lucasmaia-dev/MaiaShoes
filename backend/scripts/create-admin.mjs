// Configuração local excluída do Git. Nunca recebe senhas em argumentos de terminal.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { hashPassword } from '../dist/auth/password.js';

const config = parseEnv(await readFile(new URL('../.env.admin.local', import.meta.url), 'utf8'));
const username = config.ADMIN_USERNAME?.trim().toLowerCase();
const name = config.ADMIN_NAME?.trim();
const password = config.ADMIN_PASSWORD;
if (!username || !/^[a-z0-9_.-]{3,32}$/.test(username) || !name || name.length > 100 || !password || password.length < 8 || password.length > 128) {
  throw new Error('Configure ADMIN_NAME, ADMIN_USERNAME e uma senha de 8 a 128 caracteres em .env.admin.local.');
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    if (existing.role !== 'ADMIN') throw new Error('Este usuário já é cliente. Nenhum perfil ou senha foi alterado.');
    console.log('O administrador já existe; nenhuma senha foi alterada.');
  } else {
    await prisma.user.create({ data: { name, username, passwordHash: await hashPassword(password), role: 'ADMIN' } });
    console.log(`Administrador ${username} criado. A senha não é exibida nem armazenada em texto no banco.`);
  }
} finally { await prisma.$disconnect(); }

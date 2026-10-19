// Verificação local: lê credenciais sem exibi-las e remove apenas o cliente temporário criado aqui.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';

const config = parseEnv(await readFile(new URL('../.env.admin.local', import.meta.url), 'utf8'));
const base = 'http://127.0.0.1:3000';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const headers = { 'Content-Type': 'application/json', 'X-MaiaShoes-Request': '1' };
const call = (path, options = {}) => fetch(`${base}${path}`, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(15000) });
const cookie = (response) => response.headers.get('set-cookie')?.split(';')[0];
let customerId;
let adminCookie;
let clientCookie;
try {
  assert.equal((await call('/api/products')).status, 200);
  assert.equal((await call('/api/products', { method: 'POST', body: '{}' })).status, 401);
  const adminResponse = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: config.ADMIN_USERNAME, password: config.ADMIN_PASSWORD }) });
  assert.equal(adminResponse.status, 200);
  assert.match(adminResponse.headers.get('set-cookie'), /HttpOnly/);
  adminCookie = cookie(adminResponse);
  const admin = await adminResponse.json();
  assert.equal(admin.role, 'ADMIN'); assert.equal('passwordHash' in admin, false); assert.equal('token' in admin, false);
  assert.equal((await call('/api/products', { method: 'POST', headers: { Cookie: adminCookie }, body: '{}' })).status, 400);
  const adminPage = await call('/admin', { headers: { Cookie: adminCookie } });
  assert.equal(adminPage.status, 200);
  assert.ok((await adminPage.text()).includes('Área do administrador'));
  const username = `teste_${randomBytes(8).toString('hex')}`;
  const signup = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Verificação temporária', username, password: randomBytes(24).toString('hex') }) });
  assert.equal(signup.status, 201);
  const customer = await signup.json(); customerId = customer.id; clientCookie = cookie(signup);
  assert.equal(customer.role, 'CLIENTE');
  for (const [path, method] of [['/api/products', 'POST'], ['/api/products/1/image', 'PATCH'], ['/api/products/1/category', 'PATCH']]) {
    assert.equal((await call(path, { method, headers: { Cookie: clientCookie }, body: '{}' })).status, 403);
  }
  const customerAdmin = await call('/admin', { headers: { Cookie: clientCookie } });
  // Com streaming, o Next.js entrega o redirecionamento em uma meta tag, não em um 307 inicial.
  const customerAdminHtml = await customerAdmin.text();
  assert.ok(customerAdmin.url.endsWith('/conta') || /http-equiv="refresh"[^>]*url=\/conta/.test(customerAdminHtml));
  const account = await call('/conta', { headers: { Cookie: clientCookie } });
  assert.equal(account.status, 200);
  assert.ok((await account.text()).includes('Cliente'));
  assert.equal((await call('/api/auth/logout', { method: 'POST', headers: { Cookie: adminCookie } })).status, 204);
  assert.equal((await call('/api/auth/me', { headers: { Cookie: adminCookie } })).status, 401);
  console.log('Login de administrador, cadastro de cliente, cookie, proteções da API/painel e logout conferidos no banco real.');
} finally {
  if (adminCookie) await call('/api/auth/logout', { method: 'POST', headers: { Cookie: adminCookie } }).catch(() => {});
  if (clientCookie) await call('/api/auth/logout', { method: 'POST', headers: { Cookie: clientCookie } }).catch(() => {});
  if (customerId) await prisma.user.delete({ where: { id: customerId } });
  await prisma.$disconnect();
}

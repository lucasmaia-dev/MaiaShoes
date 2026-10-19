// Preparação exclusiva do ambiente local. A senha administrativa nunca é exibida.
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import pg from 'pg';

const adminFile = new URL('../../.env.postgres.local', import.meta.url);
const envFile = new URL('../.env', import.meta.url);
const admin = parseEnv(await readFile(adminFile, 'utf8'));
let password;
try {
  const existing = parseEnv(await readFile(envFile, 'utf8'));
  const url = new URL(existing.DATABASE_URL);
  if (url.username !== 'maiashoes_app' || url.pathname !== '/maiashoes') {
    throw new Error('Configuração existente diferente da esperada; preservada.');
  }
  password = decodeURIComponent(url.password);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  password = randomBytes(24).toString('hex');
  await writeFile(envFile, [
    `DATABASE_URL="postgresql://maiashoes_app:${password}@127.0.0.1:5432/maiashoes?schema=public"`,
    `SHADOW_DATABASE_URL="postgresql://maiashoes_app:${password}@127.0.0.1:5432/maiashoes_shadow?schema=public"`,
    '',
  ].join('\n'), { flag: 'wx', mode: 0o600 });
}

const client = new pg.Client({
  host: '127.0.0.1', port: 5432, database: 'postgres',
  user: admin.POSTGRES_USER, password: admin.POSTGRES_PASSWORD,
  connectionTimeoutMillis: 5000,
});
try {
  await client.connect();
  const role = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', ['maiashoes_app']);
  if (role.rowCount === 0) {
    // A senha é hexadecimal e a role é fixa: nenhum valor fornecido pelo usuário é interpolado.
    if (!/^[a-f0-9]{48}$/.test(password)) throw new Error('Formato inesperado para a senha local.');
    await client.query(`CREATE ROLE maiashoes_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
    console.log('Usuário local maiashoes_app criado.');
  }
  for (const database of ['maiashoes', 'maiashoes_shadow']) {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (found.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}" OWNER maiashoes_app`);
      console.log(`Banco ${database} criado.`);
    }
  }
  console.log('Preparação local concluída; credenciais mantidas em backend/.env.');
} finally {
  await client.end();
}

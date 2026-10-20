import 'dotenv/config';
import { readFile, writeFile, access } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { buildCatalogPlan } from '../dist/products/catalog-plan.js';
import { syncCatalog } from '../dist/products/catalog-import.js';

const args = process.argv.slice(2);
if (args.some((arg) => !['--apply', '--report'].includes(arg))) throw new Error('Use sem argumentos para simular; --apply grava; --report gera a conferência.');
const manifest = JSON.parse((await readFile(new URL('../../frontend/src/data/product-images.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
const raw = JSON.parse(await readFile(new URL('../../data/catalog-2026-10-20.json', import.meta.url), 'utf8'));
const plan = buildCatalogPlan(raw, manifest);
for (const photo of manifest) await access(new URL(`../../frontend/public${photo.url}`, import.meta.url));
for (const product of plan.products) console.log(`${product.catalogCode}: R$ ${product.price} — ${product.imageUrls.length} foto(s)`);
console.log(`${plan.products.length} produtos com preço e ${plan.pendingPhotos.length} fotos pendentes de associação/preço.`);

if (args.includes('--report')) {
  const markdown = [
    '# Conferência do catálogo — 20/10/2026', '',
    'Preços finais de venda confirmados pelo usuário. Cada combinação de modelo e cor possui um código estável; fotos adicionais entram na mesma galeria. Nomes e cores são descritivos, a partir das imagens; não há declaração de originalidade, estoque, numeração ou composição sem confirmação.', '',
    `**${manifest.length} fotos no acervo; ${plan.products.length} produtos preparados; ${plan.pendingPhotos.length} fotos sem associação/preço confirmado.**`, '',
    '| Código | Produto | Preço | Fotos |', '| --- | --- | --- | --- |',
    ...plan.products.map((p) => `| ${p.catalogCode} | ${p.name} | R$ ${p.price.replace('.', ',')} | ${p.photoIds.join(', ')} |`), '',
    '## Fontes dos preços', '', ...Object.entries(raw.priceSources).map(([key, value]) => `- **${key}:** ${value}`), '',
    '## Pendências', '', ...raw.reviewNotes.map((note) => `- Fotos ${note.photos.join(', ')}: ${note.reason}`), '',
    `Demais fotos não associadas: ${plan.pendingPhotos.map((p) => p.id).join(', ')}. Elas continuam disponíveis no seletor do painel, mas não geram novos produtos com preço estimado.`, '',
    'O lote pode atualizar um cadastro manual somente quando adoptExistingByImage está explicitamente habilitado e existe uma única foto exatamente correspondente. O ID é preservado e o item recebe seu código de catálogo; não há deduplicação por nome aproximado. Duas correspondências abortam a transação. Os demais cadastros manuais são preservados. O cadastro local genérico Tênis Nike, sem foto, também teve seu preço corrigido para R$ 200 conforme a confirmação; nenhum modelo ou foto foi presumido para ele.', '',
    '## Repetir a importação', '', 'De backend/, execute npm run build e npm run catalog:preview. Confira o plano antes de usar npm run catalog:import. A simulação não altera o banco. A aplicação usa transação e códigos únicos; repetir o lote não duplica produtos nem altera updatedAt dos itens iguais. O comando não apaga cadastros. Para rever fotos e preços, consulte catalogo-2026-10-20.html nesta pasta.', '',
  ].join('\n');
  await writeFile(new URL('../../docs/catalogo-2026-10-20.md', import.meta.url), markdown);
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const photoHtml = (photo) => `<figure><img loading="lazy" src="../frontend/public${escape(photo.url)}" alt="Foto ${escape(photo.id)}"><figcaption>Foto ${escape(photo.id)}</figcaption></figure>`;
  const sections = plan.products.map((p) => `<section><h2>${escape(p.name)} · R$ ${p.price.replace('.', ',')}</h2><p>${escape(p.catalogCode)}</p><div class="photos">${p.photoIds.map((id) => photoHtml(manifest.find((photo) => photo.id === id))).join('')}</div></section>`).join('');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conferência do catálogo MaiaShoes</title><style>body{font:16px system-ui;background:#f3f2ee;color:#252525;margin:0;padding:32px}main{max-width:1200px;margin:auto}h1{font-size:36px}h2{font-size:22px}section{background:white;padding:24px;margin:20px 0;border:1px solid #d8d5cc}.photos{display:flex;flex-wrap:wrap;gap:14px}figure{margin:0;width:160px}img{width:160px;height:220px;object-fit:contain;background:#eee}figcaption{font-size:13px;padding:6px}p{line-height:1.7}a{color:inherit}</style><main><h1>Catálogo MaiaShoes · 20/10/2026</h1><p>${plan.products.length} modelos/cores organizados. Preços finais de venda confirmados. As fotos de um mesmo produto ficam juntas; nenhuma numeração ou disponibilidade foi presumida.</p>${sections}<section><h2>A confirmar · ${plan.pendingPhotos.length} fotos</h2><p>Imagens preservadas no acervo, sem cadastro automático. Consulte os motivos no <a href="catalogo-2026-10-20.md">relatório</a>.</p><div class="photos">${plan.pendingPhotos.map(photoHtml).join('')}</div></section></main></html>`;
  await writeFile(new URL('../../docs/catalogo-2026-10-20.html', import.meta.url), html);
  console.log('Conferência escrita em docs/catalogo-2026-10-20.md e .html.');
}

if (args.includes('--apply')) {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const result = await prisma.$transaction((tx) => syncCatalog(tx, plan.products), { timeout: 30000 });
    console.log(`Importação concluída: ${result.created} criados, ${result.updated} atualizados (${result.adopted} associados por foto), ${result.unchanged} sem mudanças.`);
  } finally { await prisma.$disconnect(); }
} else console.log('Simulação: nenhum cadastro foi alterado.');

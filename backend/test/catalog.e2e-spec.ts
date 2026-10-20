import { readFileSync, existsSync } from 'node:fs';
import { buildCatalogPlan } from '../src/products/catalog-plan.js';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
const catalog = read('../../data/catalog-2026-10-20.json');
const photos = read('../../frontend/src/data/product-images.json');

describe('Conferência do catálogo recebido', () => {
  it('prepara 46 modelos/cores, associa todas as fotos novas exceto a composição e preserva pendências', () => {
    const plan = buildCatalogPlan(catalog, photos);
    expect(plan.products).toHaveLength(46);
    const used = plan.products.flatMap((p) => p.photoIds);
    for (let n = 77; n <= 100; n++) expect(used.includes(String(n).padStart(3, '0'))).toBe(n !== 90);
    expect(plan.pendingPhotos.map((p) => p.id)).toEqual(expect.arrayContaining(['018', '019', '028', '035', '062', '066', '075', '090']));
    for (const item of plan.products) expect(item.imageUrl).toBe(item.imageUrls[0]);
    for (const photo of photos) expect(existsSync(new URL(`../../frontend/public${photo.url}`, import.meta.url))).toBe(true);
  });

  it('aplica a exceção de preço da renda sem generalizar para outros tênis', () => {
    const plan = buildCatalogPlan(catalog, photos);
    expect(plan.products.find((p) => p.catalogCode === 'SAMBA-RENDA-ROSA')?.price).toBe('180.00');
    expect(plan.products.filter((p) => p.source === catalog.priceSources.samba).every((p) => p.price === '160.00')).toBe(true);
    expect(plan.products.find((p) => p.catalogCode === 'MIZUNO-VERDE-AGUA')?.photoIds).toEqual(['012']);
  });

  it.each([['nike', '200.00'], ['adidas', '160.00'], ['new-balance', '220.00']])('aplica o preço confirmado para %s', (source, price) => {
    const products = buildCatalogPlan(catalog, photos).products.filter((p) => p.source === catalog.priceSources[source]);
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.price === price)).toBe(true);
  });

  it('preserva Campus, couro e renda como exceções e habilita associação exata só para o Nike existente', () => {
    const plan = buildCatalogPlan(catalog, photos);
    for (const [code, price] of [['CAMPUS-BRANCO-VERDE', '200.00'], ['CASUAL-MARROM-BRANCO', '220.00'], ['SAMBA-RENDA-ROSA', '180.00']]) expect(plan.products.find((p) => p.catalogCode === code)?.price).toBe(price);
    expect(plan.products.filter((p) => p.adoptExistingByImage).map((p) => p.catalogCode)).toEqual(['NIKE-ZOOMX-PRETO']);
  });

  it.each(['unconfirmed', 'duplicate-code', 'duplicate-photo', 'missing-photo', 'untrusted-path', 'missing-source', 'invalid-money'])('rejeita o lote inteiro antes de gravar: %s', (kind) => {
    const data = structuredClone(catalog); const images = structuredClone(photos);
    if (kind === 'unconfirmed') data.pricesAreRetail = false;
    if (kind === 'duplicate-code') data.products[1].code = data.products[0].code;
    if (kind === 'duplicate-photo') data.products[1].photos.push(data.products[0].photos[0]);
    if (kind === 'missing-photo') data.products[0].photos = ['999'];
    if (kind === 'untrusted-path') images[0].url = '../../.env';
    if (kind === 'missing-source') data.products[0].source = 'unknown';
    if (kind === 'invalid-money') data.products[0].price = '160,00';
    expect(() => buildCatalogPlan(data, images)).toThrow();
  });
});

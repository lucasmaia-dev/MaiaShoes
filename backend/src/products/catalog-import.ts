import type { Prisma } from '../generated/prisma/client.js';
import type { CatalogItem } from './catalog-plan.js';

/** Executar dentro da transação do chamador; nunca associa por nome aproximado. */
export async function syncCatalog(tx: Prisma.TransactionClient, products: CatalogItem[]) {
  const counts = { created: 0, updated: 0, unchanged: 0, adopted: 0 };
  for (const { photoIds: _photoIds, source: _source, adoptExistingByImage, ...data } of products) {
    let existing = await tx.product.findUnique({ where: { catalogCode: data.catalogCode } });
    if (!existing && adoptExistingByImage) {
      const matches = await tx.product.findMany({ where: { catalogCode: null, imageUrl: { in: data.imageUrls } } });
      if (matches.length > 1) throw new Error(`Mais de um cadastro usa a foto de ${data.catalogCode}. Resolva a associação antes de importar.`);
      if (matches.length === 1) { existing = matches[0]; counts.adopted++; }
    }
    if (!existing) { await tx.product.create({ data }); counts.created++; }
    else if (existing.catalogCode === data.catalogCode && existing.name === data.name && existing.description === data.description && existing.category === data.category && existing.price.toFixed(2) === data.price && existing.imageUrl === data.imageUrl && JSON.stringify(existing.imageUrls) === JSON.stringify(data.imageUrls)) counts.unchanged++;
    else { await tx.product.update({ where: { id: existing.id }, data }); counts.updated++; }
  }
  return counts;
}

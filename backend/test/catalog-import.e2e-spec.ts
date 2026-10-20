import { syncCatalog } from '../src/products/catalog-import.js';
import { Prisma } from '../src/generated/prisma/client.js';
import type { CatalogItem } from '../src/products/catalog-plan.js';

const item: CatalogItem = { catalogCode: 'NIKE-TESTE', name: 'Nike teste', price: '200.00', category: 'TENIS', description: 'Descrição', imageUrl: '/products/foto-022.jpeg', imageUrls: ['/products/foto-022.jpeg'], photoIds: ['022'], source: 'Confirmação', adoptExistingByImage: true };
const record = { id: 4, catalogCode: null, name: 'Nike anterior', price: new Prisma.Decimal('189.99'), description: null, category: 'SEM_CATEGORIA', imageUrl: item.imageUrl, imageUrls: [] };
function store(existing: unknown = null, matches: unknown[] = []) {
  const product = { findUnique: vi.fn().mockResolvedValue(existing), findMany: vi.fn().mockResolvedValue(matches), create: vi.fn(), update: vi.fn() };
  return { product, tx: { product } as unknown as Prisma.TransactionClient };
}

describe('Atualização do catálogo sem duplicar cadastros anteriores', () => {
  it('associa uma foto exata preservando o ID e corrige o preço sem criar produto', async () => {
    const { tx, product } = store(null, [record]);
    expect(await syncCatalog(tx, [item])).toEqual({ created: 0, updated: 1, unchanged: 0, adopted: 1 });
    expect(product.create).not.toHaveBeenCalled();
    expect(product.update).toHaveBeenCalledWith({ where: { id: 4 }, data: expect.objectContaining({ catalogCode: 'NIKE-TESTE', price: '200.00' }) });
  });
  it('exige opção explícita antes de procurar um produto manual por foto', async () => {
    const { tx, product } = store(null, [record]);
    await syncCatalog(tx, [{ ...item, adoptExistingByImage: false }]);
    expect(product.findMany).not.toHaveBeenCalled(); expect(product.create).toHaveBeenCalledOnce();
  });
  it('recusa correspondências ambíguas para a transação ser revertida pelo chamador', async () => {
    const { tx, product } = store(null, [record, { ...record, id: 7 }]);
    await expect(syncCatalog(tx, [item])).rejects.toThrow('Mais de um cadastro');
    expect(product.create).not.toHaveBeenCalled(); expect(product.update).not.toHaveBeenCalled();
  });
  it('não altera data ou dados quando o registro já está igual ao catálogo', async () => {
    const { photoIds: _ids, source: _source, adoptExistingByImage: _adopt, ...data } = item;
    const { tx, product } = store({ ...record, ...data, price: new Prisma.Decimal(item.price) });
    expect(await syncCatalog(tx, [item])).toEqual({ created: 0, updated: 0, unchanged: 1, adopted: 0 });
    expect(product.update).not.toHaveBeenCalled(); expect(product.create).not.toHaveBeenCalled();
  });
});

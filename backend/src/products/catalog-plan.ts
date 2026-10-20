type Photo = { id: string; url: string };
export type CatalogItem = { catalogCode: string; name: string; description: string; category: 'TENIS'; price: string; imageUrl: string; imageUrls: string[]; photoIds: string[]; source: string };
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Valida o plano inteiro antes de qualquer gravação. Não adivinha preços ou vínculos. */
export function buildCatalogPlan(input: unknown, photoInput: unknown) {
  if (!object(input) || input.version !== 1 || input.currency !== 'BRL' || input.pricesAreRetail !== true || !object(input.priceSources) || !Array.isArray(input.products) || !input.products.length || !Array.isArray(photoInput)) throw new Error('Plano de catálogo inválido ou preços finais não confirmados.');
  const photos: Photo[] = photoInput.map((photo) => {
    if (!object(photo) || typeof photo.id !== 'string' || typeof photo.url !== 'string' || !/^\/products\/foto-\d+\.(jpeg|jpg|png|webp)$/.test(photo.url)) throw new Error('Foto fora do acervo importado.');
    return { id: photo.id, url: photo.url };
  });
  if (new Set(photos.map((p) => p.id)).size !== photos.length) throw new Error('ID de foto duplicado no acervo.');
  const codes = new Set<string>();
  const used = new Set<string>();
  const sources = input.priceSources;
  const products: CatalogItem[] = input.products.map((item) => {
    if (!object(item) || typeof item.code !== 'string' || !/^[A-Z0-9-]{1,64}$/.test(item.code) || codes.has(item.code)) throw new Error('Código de catálogo inválido ou duplicado.');
    codes.add(item.code);
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 150 || typeof item.price !== 'string' || !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(item.price)) throw new Error(`Nome ou preço inválido: ${item.code}`);
    if (typeof item.source !== 'string' || typeof sources[item.source] !== 'string' || !sources[item.source]) throw new Error(`Preço sem fonte: ${item.code}`);
    if (!Array.isArray(item.photos) || !item.photos.length || item.photos.length > 20) throw new Error(`Galeria inválida: ${item.code}`);
    const photoIds: string[] = [];
    const imageUrls = item.photos.map((id) => {
      if (typeof id !== 'string' || used.has(id)) throw new Error(`Foto repetida em produtos: ${String(id)}`);
      const photo = photos.find((p) => p.id === id);
      if (!photo) throw new Error(`Foto não importada: ${id}`);
      used.add(id); photoIds.push(id);
      return photo.url;
    });
    return { catalogCode: item.code, name: item.name.trim(), description: 'Consulte a disponibilidade de numeração com a MaiaShoes.', category: 'TENIS', price: item.price, imageUrl: imageUrls[0], imageUrls, photoIds, source: sources[item.source] as string };
  });
  return { products, pendingPhotos: photos.filter((p) => !used.has(p.id)) };
}

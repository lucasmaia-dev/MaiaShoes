'use client';

import { useCallback, useEffect, useState } from 'react';
import { listProducts, type Product } from '@/lib/products-api';
import Image from 'next/image';
import { PRODUCT_CATEGORIES, categoryLabel, type ProductCategory } from '@/lib/product-categories';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<ProductCategory | 'TODOS'>('TODOS');

  // Reutiliza a mesma consulta que alimenta o painel administrativo.
  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const result = await listProducts(signal);
      if (!signal?.aborted) setProducts(result);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  if (loading) return <p className="catalog-message" role="status">Carregando a coleção…</p>;

  if (error) return (
    <div className="catalog-message catalog-error">
      <p role="alert">Não foi possível carregar a coleção. Tente novamente em instantes.</p>
      <button type="button" onClick={() => void loadProducts()}>Tentar novamente</button>
    </div>
  );

  if (products.length === 0) return (
    <div className="catalog-message"><h3>Novidades a caminho.</h3><p>Nossa coleção está sendo preparada. Volte em breve para conhecer as peças.</p></div>
  );

  const visibleProducts = products.filter((product) => category === 'TODOS' || product.category === category);

  return (
    <>
      <div className="catalog-filters" role="group" aria-label="Filtrar produtos por categoria">
        <button type="button" aria-pressed={category === 'TODOS'} onClick={() => setCategory('TODOS')}>Todos</button>
        {PRODUCT_CATEGORIES.map((item) => <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)}>{item.label}</button>)}
      </div>
      <p className="catalog-count" role="status">{visibleProducts.length} {visibleProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
      {visibleProducts.length === 0 && <div className="catalog-message"><h3>Novidades a caminho.</h3><p>Ainda não há produtos nesta categoria. Escolha outra opção para continuar.</p></div>}
      <div className="product-grid">
        {visibleProducts.map((product) => <article className="product-card" key={product.id}>
          {product.imageUrl ? <div className="product-art product-photo"><Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 600px) 100vw, 33vw" /></div> : <div className="product-art product-placeholder">
            <span className="product-tag">MAIA SELECTION</span>
            <svg viewBox="0 0 160 160" aria-hidden="true" focusable="false"><path d="M45 52h70l8 80H37zM61 52V39a19 19 0 0 1 38 0v13" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M65 84l15 23 15-23" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            <span className="placeholder-label">Foto em breve</span>
          </div>}
          <p className="product-category">{categoryLabel(product.category)}</p>
          <div className="product-info"><h3>{product.name}</h3><strong>{currency.format(Number(product.price))}</strong></div>
          {product.description && <p className="product-description">{product.description}</p>}
        </article>)}
      </div>
    </>
  );
}

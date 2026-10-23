'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createProduct, listProducts, type Product } from '@/lib/products-api';
import styles from './admin.module.css';
import PhotoPicker from './photo-picker';
import ProductPhotoEditor from './product-photo-editor';
import ProductCategoryEditor from './product-category-editor';
import { PRODUCT_CATEGORIES, categoryLabel, isProductCategory } from '@/lib/product-categories';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  // A referência impede dois envios simultâneos, mesmo antes de a tela atualizar.
  const submitting = useRef(false);

  const refreshProducts = useCallback((signal?: AbortSignal) =>
    listProducts(signal).then((result) => {
      if (!signal?.aborted) {
        setProducts(result);
        setListError('');
      }
    }).catch((error: unknown) => {
      if (!signal?.aborted) setListError(error instanceof Error ? error.message : 'Não foi possível carregar os produtos.');
    }).finally(() => {
      if (!signal?.aborted) setLoading(false);
    }), []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshProducts(controller.signal);
    return () => controller.abort();
  }, [refreshProducts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const category = String(data.get('category') ?? '');
    if (!name) {
      setSuccess('');
      setFormError('Preencha o nome do produto.');
      return;
    }
    if (!isProductCategory(category)) {
      setSuccess('');
      setFormError('Escolha a categoria do produto.');
      return;
    }
    submitting.current = true;
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const product = await createProduct({
        name,
        category,
        imageUrl,
        description: String(data.get('description') ?? '').trim() || undefined,
        // O formulário aceita vírgula; a API recebe ponto decimal.
        price: String(data.get('price') ?? '').trim().replace(',', '.'),
      });
      setProducts((previous) => [product, ...previous]);
      setSuccess(`${product.name} foi salvo com sucesso.`);
      form.reset();
      setImageUrl(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível salvar o produto.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <div className={styles.grid}>
      <section className={styles.card} aria-labelledby="new-product-title">
        <p className={styles.eyebrow}>UM NOVO FAVORITO</p>
        <h2 id="new-product-title">Cadastrar produto</h2>
        <p className={styles.subtitle}>Comece com o essencial. Os detalhes fazem a diferença.</p>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} className={styles.fields}>
            <label htmlFor="product-name">Nome do produto <span aria-hidden="true">*</span></label>
            <input id="product-name" name="name" required maxLength={150} placeholder="Ex.: Tênis Essencial" autoComplete="off" />
            <label htmlFor="product-category">Categoria <span aria-hidden="true">*</span></label>
            <select id="product-category" name="category" defaultValue="" required>
              <option value="" disabled>Escolha uma categoria</option>
              {PRODUCT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
            <label htmlFor="product-price">Preço (R$) <span aria-hidden="true">*</span></label>
            <input id="product-price" name="price" type="text" inputMode="decimal" required maxLength={11} pattern="(0|[1-9][0-9]{0,7})([,.][0-9]{1,2})?" title="Use um valor positivo ou zero, com até duas casas decimais. Ex.: 189,90" placeholder="189,90" aria-describedby="price-help" />
            <small id="price-help">Use vírgula ou ponto e até duas casas decimais.</small>
            <label htmlFor="product-description">Descrição <span className={styles.optional}>(opcional)</span></label>
            <textarea id="product-description" name="description" maxLength={2000} rows={4} placeholder="Conte um pouco sobre o produto…" />
          </fieldset>
          <PhotoPicker value={imageUrl} onChange={setImageUrl} disabled={saving} />
          <p className={styles.requiredNote}>* Campos obrigatórios</p>
          {formError && <p role="alert" className={styles.error}>{formError}</p>}
          <p role="status" className={success ? styles.success : styles.silent}>{success}</p>
          <button className={styles.saveButton} type="submit" disabled={saving || loading}>{saving ? 'Salvando…' : 'Salvar produto'} <span aria-hidden="true">↗</span></button>
        </form>
      </section>

      <section className={styles.card} aria-labelledby="saved-products-title" aria-busy={loading}>
        <div className={styles.listHeading}>
          <div><p className={styles.eyebrow}>SEU CATÁLOGO</p><h2 id="saved-products-title">Produtos cadastrados</h2></div>
          <button className={styles.refreshButton} type="button" disabled={loading || saving} onClick={() => {
            setLoading(true);
            setListError('');
            void refreshProducts();
          }}>{loading ? 'Carregando…' : 'Atualizar'}</button>
        </div>
        <p className={styles.subtitle}>{loading ? 'Buscando os produtos salvos…' : `${products.length} ${products.length === 1 ? 'produto na lista' : 'produtos na lista'}`}</p>
        {listError && <p role="alert" className={styles.error}>{listError}</p>}
        {!loading && !listError && products.length === 0 && <div className={styles.empty}><span aria-hidden="true">＋</span><h3>Seu catálogo começa aqui.</h3><p>Cadastre o primeiro produto usando o formulário.</p></div>}
        <ul className={styles.productList}>
          {products.map((product) => <li key={product.id} className={styles.product}>
            <div className={styles.productId}>#{product.id}</div>
            <div className={styles.productText}><h3>{product.name}</h3><p>{product.description || 'Sem descrição.'}</p>
              <p className={styles.categoryBadge}>{categoryLabel(product.category)}</p>
              <ProductCategoryEditor product={product} onSaved={(saved) => setProducts((previous) => previous.map((item) => item.id === saved.id ? saved : item))} />
              <ProductPhotoEditor product={product} onSaved={(saved) => setProducts((previous) => previous.map((item) => item.id === saved.id ? saved : item))} />
            </div>
            <strong>{currency.format(Number(product.price))}</strong>
          </li>)}
        </ul>
        <p className={styles.listNote}>A vitrine mostra produtos com foto e categoria definida. Cadastros sem foto ou sem categoria continuam disponíveis aqui para você completar.</p>
      </section>
    </div>
  );
}

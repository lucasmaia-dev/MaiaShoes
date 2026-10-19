'use client';

import { useRef, useState, type FormEvent } from 'react';
import { updateProductCategory, type Product } from '@/lib/products-api';
import { PRODUCT_CATEGORIES, isProductCategory } from '@/lib/product-categories';
import styles from './admin.module.css';

export default function ProductCategoryEditor({ product, onSaved }: { product: Product; onSaved: (product: Product) => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submitting = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const value = String(new FormData(event.currentTarget).get('category'));
    if (!isProductCategory(value)) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      onSaved(await updateProductCategory(product.id, value));
      setMessage('Categoria salva. Atualize a vitrine para conferir.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar a categoria.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <details className={styles.categoryEditor}>
    <summary>Alterar categoria de {product.name}</summary>
    <form onSubmit={save} className={styles.categoryForm}>
      <label htmlFor={`category-${product.id}`}>Categoria de {product.name}</label>
      <select key={product.category} id={`category-${product.id}`} name="category" defaultValue={product.category} disabled={saving} required>
        {PRODUCT_CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
      </select>
      <button className={styles.refreshButton} type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar categoria'}</button>
    </form>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p role="status" className={message ? styles.success : styles.silent}>{message}</p>
  </details>;
}

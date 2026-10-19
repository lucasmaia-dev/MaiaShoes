'use client';

import { useRef, useState } from 'react';
import { updateProductImage, type Product } from '@/lib/products-api';
import PhotoPicker from './photo-picker';
import styles from './admin.module.css';

export default function ProductPhotoEditor({ product, onSaved }: { product: Product; onSaved: (product: Product) => void }) {
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const submitting = useRef(false);

  async function savePhoto() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await updateProductImage(product.id, imageUrl);
      onSaved(saved);
      setSuccess('Foto atualizada. Recarregue a vitrine para conferir.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar a foto.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <details className={styles.photoEditor}>
    <summary>Alterar foto de {product.name}</summary>
    <PhotoPicker value={imageUrl} onChange={(url) => { setImageUrl(url); setSuccess(''); }} disabled={saving} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <p role="status" className={success ? styles.success : styles.silent}>{success}</p>
    <button type="button" className={styles.refreshButton} disabled={saving || imageUrl === product.imageUrl} onClick={() => void savePhoto()}>{saving ? 'Salvando…' : 'Salvar foto'}</button>
  </details>;
}

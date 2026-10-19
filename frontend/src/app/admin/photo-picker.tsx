'use client';

import Image from 'next/image';
import photos from '@/data/product-images.json';
import styles from './admin.module.css';

type Props = { value: string | null; onChange: (url: string | null) => void; disabled?: boolean };

export default function PhotoPicker({ value, onChange, disabled = false }: Props) {
  const selected = photos.find((photo) => photo.url === value);
  return (
    <fieldset className={styles.photoPicker} disabled={disabled}>
      <legend>Foto do produto <span className={styles.optional}>(opcional)</span></legend>
      {selected ? <div className={styles.selectedPhoto}>
        <Image src={selected.url} width={120} height={140} alt={`Prévia: ${selected.label}`} sizes="120px" />
        <div><p>{selected.label}</p><button type="button" onClick={() => onChange(null)}>Remover seleção</button></div>
      </div> : <p className={styles.photoHint}>Escolha uma imagem do ZIP para este produto.</p>}
      <details className={styles.photoGallery}>
        <summary>Ver as {photos.length} fotos disponíveis</summary>
        <div className={styles.photoChoices}>
          {photos.map((photo) => <button type="button" key={photo.url} aria-pressed={value === photo.url} aria-label={`Selecionar ${photo.label}`} onClick={() => onChange(photo.url)}>
            <Image src={photo.url} width={90} height={110} alt="" sizes="90px" loading="lazy" />
            <span>{photo.label}</span>
          </button>)}
        </div>
      </details>
    </fieldset>
  );
}

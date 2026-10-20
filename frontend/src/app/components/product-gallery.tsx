'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(images[0]);
  const current = images.includes(selected) ? selected : images[0];
  return <div className="product-gallery">
    <div className="product-art product-photo"><Image src={current} alt={name} fill sizes="(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw" /></div>
    {images.length > 1 && <div className="product-thumbnails" role="group" aria-label={`Fotos de ${name}`}>
      {images.map((url, index) => <button type="button" key={url} onClick={() => setSelected(url)} aria-pressed={current === url} aria-label={`Ver foto ${index + 1} de ${name}`}>
        <Image src={url} alt="" width={48} height={60} sizes="48px" />
      </button>)}
    </div>}
  </div>;
}

"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const [selected, setSelected] = useState(images[0]);
  const current = images.includes(selected) ? selected : images[0];
  return (
    <div className="product-gallery">
      <div className="detail-photo">
        <Image
          src={current}
          alt={name}
          fill
          sizes="(max-width: 700px) 90vw, 45vw"
        />
      </div>
      {images.length > 1 && (
        <div
          className="product-thumbnails"
          role="group"
          aria-label={`Fotos de ${name}`}
        >
          {images.map((url, index) => (
            <button
              type="button"
              key={url}
              onClick={() => setSelected(url)}
              aria-pressed={current === url}
              aria-label={`Ver foto ${index + 1} de ${name}`}
            >
              <Image src={url} alt="" width={56} height={68} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

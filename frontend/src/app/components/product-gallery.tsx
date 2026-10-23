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
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const current = images[index] ?? images[0];
  const move = (direction: number) => {
    setIndex((value) => (value + direction + images.length) % images.length);
    setZoomed(false);
  };
  return (
    <div
      className="product-gallery"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div className="detail-photo-wrap">
        <button
          type="button"
          className={`detail-photo ${zoomed ? "is-zoomed" : ""}`}
          onClick={() => setZoomed(!zoomed)}
          aria-label={`${zoomed ? "Reduzir" : "Ampliar"} foto de ${name}`}
          aria-pressed={zoomed}
        >
          <Image
            key={current}
            src={current}
            alt={name}
            fill
            sizes="(max-width: 700px) 90vw, 50vw"
          />
          <span className="zoom-hint">
            {zoomed ? "− Reduzir" : "+ Ampliar"}
          </span>
        </button>
        {images.length > 1 && (
          <div className="gallery-controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Foto anterior"
              onClick={() => move(-1)}
            >
              ←
            </button>
            <span aria-live="polite">
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Próxima foto"
              onClick={() => move(1)}
            >
              →
            </button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div
          className="product-thumbnails"
          role="group"
          aria-label={`Fotos de ${name}`}
        >
          {images.map((url, photoIndex) => (
            <button
              key={url}
              type="button"
              aria-pressed={current === url}
              aria-label={`Ver foto ${photoIndex + 1} de ${name}`}
              onClick={() => {
                setIndex(photoIndex);
                setZoomed(false);
              }}
            >
              <Image src={url} alt="" width={58} height={68} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

const GENERIC_IMAGE = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

// Orden de respaldo si una imagen no carga: fondo → miniatura de YouTube → póster → genérica
function getImageSources(movie) {
  return [
    movie.backdropUrl,
    movie.youtubeId ? `https://img.youtube.com/vi/${movie.youtubeId}/hqdefault.jpg` : null,
    movie.posterUrl,
    GENERIC_IMAGE,
  ].filter(Boolean);
}

export default function TrailerImage({ movie, className = '', ...imgProps }) {
  const sources = getImageSources(movie);
  const [index, setIndex] = useState(0);

  // Con otro tráiler (o al cambiarle la imagen) se vuelve a probar desde la primera fuente
  const imageKey = `${movie.id}|${movie.backdropUrl}`;
  const [shownKey, setShownKey] = useState(imageKey);
  if (shownKey !== imageKey) {
    setShownKey(imageKey);
    setIndex(0);
  }

  return (
    <img
      src={sources[Math.min(index, sources.length - 1)]}
      alt={movie.title}
      onError={() => setIndex(i => Math.min(i + 1, sources.length - 1))}
      className={className}
      {...imgProps}
    />
  );
}

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    setIndex(0);
  }, [movie.id, movie.backdropUrl]);

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

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { useI18n } from '../i18n';

export default function MovieRow({ 
  title, 
  movies = [], 
  onPlayTrailer, 
  onOpenDetails, 
  myListIds = new Set(),
  onToggleMyList,
  likedIds = new Set(),
  onLikeMovie,
  onExplore,
  // Nombre de la categoría tal como está guardada; `title` es el que se muestra, ya traducido
  categoryKey
}) {
  const { t } = useI18n();
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Las flechas solo aparecen si la fila se puede desplazar en ese sentido
  const updateArrows = () => {
    const row = rowRef.current;
    if (!row) return;
    setShowLeftArrow(row.scrollLeft > 20);
    setShowRightArrow(row.scrollLeft < row.scrollWidth - row.clientWidth - 20);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [movies.length]);

  if (!movies || movies.length === 0) {
    return null;
  }

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const newScrollLeft = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;

      rowRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      setTimeout(updateArrows, 350);
    }
  };

  return (
    <div className="space-y-2 md:space-y-3 my-6 md:my-8 px-4 md:px-12 group/row relative">
      <h2 className="text-lg md:text-2xl font-bold text-gray-100 group-hover/row:text-white transition-colors flex items-center space-x-2">
        <span>{title}</span>
        {onExplore && (
          <button
            onClick={() => onExplore(categoryKey ?? title)}
            className="text-xs text-[#E50914] font-semibold opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity flex items-center hover:underline"
            aria-label={t('row.exploreLabel', { title })}
          >
            {t('row.exploreAll')}
          </button>
        )}
      </h2>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 md:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-sm rounded-r"
            aria-label={t('row.scrollLeft')}
          >
            <ChevronLeft size={30} />
          </button>
        )}

        <div
          ref={rowRef}
          onScroll={updateArrows}
          className="flex items-center space-x-3 md:space-x-4 overflow-x-auto no-scrollbar py-4 px-1 scroll-smooth"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPlayTrailer={onPlayTrailer}
              onOpenDetails={onOpenDetails}
              isSaved={myListIds.has(movie.id)}
              onToggleMyList={onToggleMyList}
              isLiked={likedIds.has(movie.id)}
              onLikeMovie={onLikeMovie}
            />
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-10 md:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-sm rounded-l"
            aria-label={t('row.scrollRight')}
          >
            <ChevronRight size={30} />
          </button>
        )}
      </div>
    </div>
  );
}

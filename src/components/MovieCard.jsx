import React, { useState } from 'react';
import { Play, Plus, Check, ThumbsUp, ChevronDown } from 'lucide-react';
import TrailerImage from './TrailerImage';

export default function MovieCard({ 
  movie, 
  onPlayTrailer, 
  onOpenDetails, 
  isSaved = false,
  onToggleMyList,
  isLiked = false,
  onLikeMovie,
  // En carrusel la tarjeta tiene ancho fijo; en cuadrícula (fluid) ocupa su columna
  fluid = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative ${fluid ? 'w-full' : 'flex-none w-[200px] sm:w-[240px] md:w-[280px]'} cursor-pointer group rounded-md overflow-hidden bg-[#181818] transition-all duration-300 transform hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-black`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenDetails(movie)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        <TrailerImage
          movie={movie}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

        <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-sm text-red-500 px-1.5 py-0.5 rounded">
          Tráiler
        </span>

        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white font-bold text-xs sm:text-sm truncate drop-shadow">
            {movie.title}
          </p>
        </div>
      </div>

      <div className="p-3 bg-[#181818] space-y-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayTrailer(movie);
              }}
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition transform active:scale-90"
              title="Reproducir Tráiler"
              aria-label="Reproducir Tráiler"
            >
              <Play size={15} className="fill-black ml-0.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleMyList) onToggleMyList(movie);
              }}
              className="w-8 h-8 rounded-full border border-gray-400 hover:border-white bg-[#2a2a2a]/60 text-white flex items-center justify-center transition"
              title={isSaved ? "Quitar de Mi Lista" : "Agregar a Mi Lista"}
              aria-label="Agregar a Mi Lista"
            >
              {isSaved ? <Check size={16} className="text-green-400" /> : <Plus size={16} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onLikeMovie) onLikeMovie(movie);
              }}
              className={`w-8 h-8 rounded-full border bg-[#2a2a2a]/60 flex items-center justify-center transition ${
                isLiked ? 'border-blue-400 text-blue-300' : 'border-gray-400 hover:border-white text-white'
              }`}
              title={isLiked ? "Te gusta este tráiler" : "Me gusta"}
              aria-label="Me gusta"
              aria-pressed={isLiked}
            >
              <ThumbsUp size={14} className={isLiked ? 'fill-current' : ''} />
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(movie);
            }}
            className="w-8 h-8 rounded-full border border-gray-400 hover:border-white text-white flex items-center justify-center transition ml-auto"
            title="Ver detalles"
            aria-label="Ver detalles"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-gray-300">
          <span className="text-green-400 font-bold whitespace-nowrap">{movie.matchScore || '96% coincidencia'}</span>
          <span className="border border-gray-500 text-gray-400 px-1 py-0.2 rounded text-[10px]">
            {movie.ageRating || '+16'}
          </span>
          <span className="text-gray-400">{movie.releaseYear || '2024'}</span>
          <span className="border border-gray-600 text-[9px] px-1 text-gray-300 rounded font-bold">HD</span>
        </div>

        <div className="text-[11px] text-gray-400 truncate">
          {movie.genres ? movie.genres.split(',').slice(0, 3).join(' • ') : 'Acción • Aventura'}
        </div>
      </div>
    </div>
  );
}

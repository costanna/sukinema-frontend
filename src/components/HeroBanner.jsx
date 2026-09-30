import React, { useState, useEffect } from 'react';
import { Play, Info, Volume2, VolumeX, Flame } from 'lucide-react';
import TrailerImage from './TrailerImage';

export default function HeroBanner({ movie, onPlayTrailer, onOpenDetails }) {
  const [isMuted, setIsMuted] = useState(true);
  const [playPreview, setPlayPreview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlayPreview(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [movie]);

  if (!movie) {
    return (
      <div className="relative h-[70vh] bg-[#141414] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const youtubeId = movie.youtubeId;

  return (
    <div className="relative h-[80vh] md:h-[90vh] w-full overflow-hidden select-none bg-black">
      {playPreview && youtubeId ? (
        <div className="absolute inset-0 w-full h-full pointer-events-none scale-125 md:scale-110">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${youtubeId}&modestbranding=1&enablejsapi=1`}
            title={movie.title}
            className="w-full h-full object-cover border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <TrailerImage
          movie={movie}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/50 to-transparent w-full md:w-3/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />

      <div className="absolute bottom-16 md:bottom-24 left-4 right-4 md:left-12 md:right-auto max-w-xl md:max-w-2xl z-20 space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="flex items-center space-x-1 bg-[#E50914] text-white text-xs font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
            <Flame size={14} className="fill-current" />
            <span>Nº 1 EN TRÁILERS HOY</span>
          </span>
          <span className="text-green-400 font-semibold text-xs md:text-sm drop-shadow whitespace-nowrap">
            {movie.matchScore || '98% de coincidencia'}
          </span>
          <span className="border border-gray-400 text-gray-300 text-[11px] px-1 py-0.2 rounded">
            {movie.ageRating || '+16'}
          </span>
          <span className="text-xs text-gray-300 whitespace-nowrap">
            {movie.duration || 'Tráiler 2m 45s'}
          </span>
        </div>

        <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
          {movie.title}
        </h1>

        <p className="text-gray-200 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4 drop-shadow">
          {movie.overview}
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => onPlayTrailer(movie)}
            className="flex items-center space-x-2 bg-white hover:bg-white/85 text-black font-bold px-5 md:px-7 py-2.5 md:py-3 rounded transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl"
          >
            <Play size={20} className="fill-black" />
            <span className="text-sm md:text-base">Ver Tráiler</span>
          </button>

          <button
            onClick={() => onOpenDetails(movie)}
            className="flex items-center space-x-2 bg-gray-500/60 hover:bg-gray-500/80 text-white font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded transition-all duration-200 backdrop-blur-sm"
          >
            <Info size={20} />
            <span className="text-sm md:text-base">Más información</span>
          </button>
        </div>
      </div>

      {/* En móvil va arriba para no tapar los botones del banner */}
      <div className="absolute top-20 md:top-auto md:bottom-28 right-4 md:right-12 z-20 flex items-center space-x-3">
        {playPreview && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full border border-white/40 bg-black/40 text-white hover:bg-white/20 transition backdrop-blur-sm"
            aria-label={isMuted ? "Activar sonido del tráiler" : "Silenciar"}
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}
        <div className="border-l-4 border-gray-400 bg-black/60 backdrop-blur-sm text-gray-200 font-bold text-xs md:text-sm px-3 py-1">
          {movie.ageRating || '+16'}
        </div>
      </div>
    </div>
  );
}

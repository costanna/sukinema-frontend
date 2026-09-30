import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Volume2, Share2, Sparkles, Pencil, Trash2 } from 'lucide-react';
import TrailerImage from './TrailerImage';
import { useI18n } from '../i18n';

export default function TrailerModal({
  movie,
  isOpen,
  onClose,
  allMovies = [],
  onSelectMovie,
  isSaved = false,
  onToggleMyList,
  isLiked = false,
  onLikeMovie,
  onEditMovie,
  onDeleteMovie
}) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);
  // 'idle' | 'copied' | 'failed'
  const [shareState, setShareState] = useState('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    // Al pasar a otro tráiler (p. ej. uno relacionado) el reproductor vuelve a quedar a la vista
    scrollRef.current?.scrollTo({ top: 0 });
  }, [movie?.id, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && movie) {
      if (!dialog.open) {
        dialog.showModal();
      }
      const handleClickOutside = (event) => {
        if (!('closedBy' in HTMLDialogElement.prototype)) {
          if (event.target !== dialog) return;
          const rect = dialog.getBoundingClientRect();
          const isContent = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          );
          if (!isContent) {
            onClose();
          }
        }
      };

      const handleCancel = (e) => {
        e.preventDefault();
        onClose();
      };

      // Si el navegador cierra la ventana por su cuenta, el estado de React debe enterarse
      const handleNativeClose = () => onClose();

      dialog.addEventListener('click', handleClickOutside);
      dialog.addEventListener('cancel', handleCancel);
      dialog.addEventListener('close', handleNativeClose);

      return () => {
        dialog.removeEventListener('click', handleClickOutside);
        dialog.removeEventListener('cancel', handleCancel);
        dialog.removeEventListener('close', handleNativeClose);
      };
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, movie, onClose]);

  if (!isOpen || !movie) return null;

  const youtubeId = movie.youtubeId;

  const relatedMovies = allMovies
    .filter(m => m.id !== movie.id && (m.category === movie.category || (m.genres && movie.genres && m.genres.split(',')[0] === movie.genres.split(',')[0])))
    .slice(0, 6);

  const handleShare = async () => {
    const url = movie.trailerUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
    } catch {
      setShareState('failed');
    }
    setTimeout(() => setShareState('idle'), 2000);
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="trailerModalTitle"
      className="m-auto p-0 max-w-4xl w-[94vw] md:w-[850px] bg-[#181818] text-white rounded-xl shadow-2xl overflow-hidden backdrop:bg-black/85 backdrop:backdrop-blur-md outline-none border border-white/10"
    >
      <div ref={scrollRef} className="relative flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-40 w-10 h-10 rounded-full bg-[#181818]/80 hover:bg-[#282828] text-white flex items-center justify-center border border-white/20 transition backdrop-blur-sm"
          aria-label={t('trailer.close')}
        >
          <X size={20} />
        </button>

        <div className="relative aspect-video w-full shrink-0 bg-black overflow-hidden shadow-inner">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={t('trailer.iframeTitle', { title: movie.title })}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-gray-400">
              <p>{t('trailer.noPlayer')}</p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-6 bg-[#181818]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onToggleMyList && onToggleMyList(movie)}
                className="flex items-center space-x-2 border border-gray-400 hover:border-white px-4 py-2 rounded-md font-semibold text-sm transition bg-white/5 hover:bg-white/10"
              >
                {isSaved ? <Check size={18} className="text-green-400" /> : <Plus size={18} />}
                <span>{t(isSaved ? 'trailer.inList' : 'trailer.addToList')}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 border border-gray-500 hover:border-white px-3.5 py-2 rounded-md text-sm text-gray-300 hover:text-white transition bg-white/5"
                title={t('trailer.shareTitle')}
              >
                <Share2 size={16} />
                <span>{t(shareState === 'copied' ? 'common.copied' : shareState === 'failed' ? 'common.copyFailed' : 'trailer.share')}</span>
              </button>

              <button
                onClick={() => onLikeMovie && onLikeMovie(movie)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-full border transition bg-white/5 text-sm ${
                  isLiked ? 'border-blue-400 text-blue-300' : 'border-gray-500 hover:border-white text-gray-300 hover:text-white'
                }`}
                title={t(isLiked ? 'card.liked' : 'card.like')}
                aria-label={t('card.like')}
                aria-pressed={isLiked}
              >
                <ThumbsUp size={16} className={isLiked ? 'fill-current' : ''} />
                {(movie.likes || 0) > 0 && <span className="font-semibold">{movie.likes}</span>}
              </button>

              {onEditMovie && (
                <button
                  onClick={() => onEditMovie(movie)}
                  className="p-2 rounded-full border border-gray-500 hover:border-white text-gray-300 hover:text-white transition bg-white/5"
                  title={t('trailer.edit')}
                  aria-label={t('trailer.edit')}
                >
                  <Pencil size={16} />
                </button>
              )}

              {onDeleteMovie && (
                confirmDelete ? (
                  <div className="flex items-center space-x-2 text-sm">
                    <button
                      onClick={() => onDeleteMovie(movie)}
                      className="px-3 py-2 rounded-md bg-[#E50914] hover:bg-red-700 text-white font-semibold transition"
                    >
                      {t('trailer.confirmDelete')}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-semibold transition"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 rounded-full border border-gray-500 hover:border-red-500 text-gray-300 hover:text-red-400 transition bg-white/5"
                    title={t('trailer.delete')}
                    aria-label={t('trailer.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                )
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="bg-red-950/80 text-red-400 border border-red-800/60 font-bold px-2 py-0.5 rounded">
                {t('trailer.official')}
              </span>
              <span className="border border-gray-600 px-1.5 py-0.5 rounded text-gray-300 font-bold">
                HD 1080p
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-sm font-semibold">
                <span className="text-green-400 font-bold">
                  {movie.matchScore || t('content.defaultMatch')}
                </span>
                <span className="text-gray-400 font-normal">
                  {movie.releaseYear || '2024'}
                </span>
                <span className="border border-gray-500 text-gray-300 text-xs px-1.5 py-0.5 rounded">
                  {movie.ageRating || '+16'}
                </span>
                <span className="text-gray-300 text-xs">
                  {movie.duration || t('content.defaultDuration')}
                </span>
                <span className="border border-gray-600 text-[10px] text-gray-400 px-1 py-0.2 rounded font-bold">
                  Ultra HD 4K
                </span>
              </div>

              <h2 id="trailerModalTitle" className="text-2xl md:text-3xl font-extrabold text-white">
                {movie.title}
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {movie.overview}
              </p>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-gray-400 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
              {movie.cast && (
                <div>
                  <span className="text-gray-500">{t('trailer.cast')} </span>
                  <span className="text-gray-200">{movie.cast}</span>
                </div>
              )}
              {movie.director && (
                <div>
                  <span className="text-gray-500">{t('trailer.director')} </span>
                  <span className="text-gray-200">{movie.director}</span>
                </div>
              )}
              {movie.genres && (
                <div>
                  <span className="text-gray-500">{t('trailer.genres')} </span>
                  <span className="text-gray-200">{movie.genres}</span>
                </div>
              )}
              {movie.category && (
                <div>
                  <span className="text-gray-500">{t('trailer.category')} </span>
                  <span className="text-gray-200">{movie.category}</span>
                </div>
              )}
            </div>
          </div>

          {relatedMovies.length > 0 && (
            <div className="pt-6 border-t border-zinc-800 space-y-4">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles size={18} className="text-[#E50914]" />
                <span>{t('trailer.related')}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {relatedMovies.map((rel) => (
                  <div
                    key={rel.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMovie(rel)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectMovie(rel);
                      }
                    }}
                    className="group bg-[#242424] rounded overflow-hidden cursor-pointer hover:bg-[#303030] transition border border-white/5 hover:border-white/20"
                    aria-label={t('trailer.watchRelated', { title: rel.title })}
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                      <TrailerImage
                        movie={rel}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-black/60 group-hover:bg-[#E50914] text-white flex items-center justify-center transition">
                          <Play size={16} className="fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 px-1 py-0.2 rounded text-gray-300">
                        {rel.duration || t('content.defaultDuration')}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1">
                      <p className="text-white text-xs font-bold truncate group-hover:text-red-400 transition">
                        {rel.title}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400">
                        <span className="text-green-400 font-semibold">{rel.matchScore || '95%'}</span>
                        <span>{rel.releaseYear}</span>
                        <span className="border border-zinc-700 px-1 rounded">{rel.ageRating || '+16'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

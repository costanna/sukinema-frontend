import React, { useState, useEffect, useRef } from 'react';
import { X, Film, Play, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { CATEGORIES, AGE_RATINGS } from '../constants/catalog';
import { extractYoutubeId } from '../utils/youtube';
import { useI18n } from '../i18n';
import { localizeTerm, localizeList, localizeDuration } from '../i18n/content';

// Formulario vacío, con los valores de ejemplo en el idioma de quien lo rellena
const emptyForm = (lang) => ({
  title: '',
  overview: '',
  trailerUrl: '',
  backdropUrl: '',
  posterUrl: '',
  category: 'Tendencias Ahora',
  genres: localizeList('Acción, Suspenso', lang),
  cast: '',
  director: '',
  releaseYear: new Date().getFullYear(),
  ageRating: '+16',
  duration: localizeDuration('Tráiler 2m 30s', lang),
  matchScore: '98% de coincidencia',
  featured: false,
  trending: true
});

export default function AddMovieModal({ isOpen, onClose, onMovieAdded, categories = CATEGORIES }) {
  const { t, lang } = useI18n();
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState(() => emptyForm(lang));

  // Si aún no se ha escrito nada, los valores de ejemplo siguen al idioma elegido
  useEffect(() => {
    if (isOpen) setFormData(prev => (prev.title || prev.trailerUrl ? prev : emptyForm(lang)));
  }, [isOpen, lang]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const previewId = extractYoutubeId(formData.trailerUrl);

  // El aviso de error está arriba del formulario: se sube para que se vea
  const showError = (message) => {
    setError(message);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
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
      // Si el navegador cierra la ventana por su cuenta (Escape), el estado de React debe enterarse;
      // si no, el botón "Nuevo Tráiler" deja de abrirla
      const handleNativeClose = () => onClose();
      dialog.addEventListener('click', handleClickOutside);
      dialog.addEventListener('close', handleNativeClose);
      return () => {
        dialog.removeEventListener('click', handleClickOutside);
        dialog.removeEventListener('close', handleNativeClose);
      };
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      showError(t('add.error.title'));
      return;
    }
    if (!formData.trailerUrl.trim()) {
      showError(t('add.error.url'));
      return;
    }
    if (!previewId) {
      showError(t('add.error.notYoutube'));
      return;
    }

    const payload = {
      ...formData,
      title: formData.title.trim(),
      trailerUrl: formData.trailerUrl.trim(),
      // Sin imagen propia se deja vacío: la app muestra entonces la miniatura del vídeo de YouTube
      backdropUrl: formData.backdropUrl.trim(),
      posterUrl: formData.posterUrl.trim() || formData.backdropUrl.trim(),
      releaseYear: parseInt(formData.releaseYear, 10) || 2024
    };

    try {
      setLoading(true);
      await onMovieAdded(payload);
      onClose();
      setFormData(emptyForm(lang));
    } catch (err) {
      showError(err.message || t('add.error.save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="addModalTitle"
      className="m-auto p-0 max-w-2xl w-[94vw] md:w-[650px] bg-[#181818] text-white rounded-xl shadow-2xl overflow-hidden backdrop:bg-black/85 backdrop:backdrop-blur-md outline-none border border-white/10"
    >
      <div ref={scrollRef} className="relative p-6 md:p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
          aria-label={t('add.close')}
        >
          <X size={18} />
        </button>

        <div className="space-y-1 mb-6">
          <div className="flex items-center space-x-2 text-[#E50914]">
            <Film size={22} />
            <span className="text-xs uppercase tracking-widest font-black">{t('add.studio')}</span>
          </div>
          <h2 id="addModalTitle" className="text-2xl font-black text-white">
            {t('add.title')}
          </h2>
          <p className="text-xs md:text-sm text-gray-400">
            {t('add.intro')}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-950/70 border border-red-700 rounded text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* noValidate: los avisos los da la app en el idioma elegido, no el navegador en el suyo */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {t('add.field.title')}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              maxLength={255}
              placeholder={t('add.field.titlePlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {t('add.field.url')}
            </label>
            <input
              type="text"
              name="trailerUrl"
              value={formData.trailerUrl}
              onChange={handleChange}
              maxLength={255}
              placeholder={t('add.field.urlPlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              required
            />
            {previewId && (
              <div className="mt-2 p-2 bg-zinc-900/90 rounded border border-zinc-700">
                <span className="text-[11px] text-green-400 font-semibold block mb-1 flex items-center space-x-1">
                  <CheckCircle2 size={13} />
                  <span>{t('add.detected', { id: previewId })}</span>
                </span>
                <div className="aspect-video w-full max-w-sm rounded overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${previewId}?controls=1`}
                    title={t('add.previewTitle')}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.category')}
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{localizeTerm(category, lang)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.year')}
              </label>
              <input
                type="number"
                name="releaseYear"
                value={formData.releaseYear}
                onChange={handleChange}
                min="1950"
                max="2030"
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {t('add.field.backdrop')}
            </label>
            <input
              type="text"
              name="backdropUrl"
              value={formData.backdropUrl}
              onChange={handleChange}
              maxLength={1000}
              placeholder={t('add.field.backdropPlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.genres')}
              </label>
              <input
                type="text"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                maxLength={255}
                placeholder={t('add.field.genresPlaceholder')}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.rating')}
              </label>
              <select
                name="ageRating"
                value={formData.ageRating}
                onChange={handleChange}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              >
                {AGE_RATINGS.map(rating => (
                  <option key={rating} value={rating}>{rating === 'TP' ? t('content.ratingAllLong') : rating}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {t('add.field.overview')}
            </label>
            <textarea
              name="overview"
              value={formData.overview}
              onChange={handleChange}
              rows={3}
              maxLength={2000}
              placeholder={t('add.field.overviewPlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.cast')}
              </label>
              <input
                type="text"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                maxLength={255}
                placeholder={t('add.field.castPlaceholder')}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {t('add.field.director')}
              </label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                maxLength={255}
                placeholder={t('add.field.directorPlaceholder')}
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-1 text-xs text-gray-300">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="rounded accent-[#E50914]"
              />
              <span>{t('add.featured')}</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="trending"
                checked={formData.trending}
                onChange={handleChange}
                className="rounded accent-[#E50914]"
              />
              <span>{t('add.trending')}</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-400 hover:text-white transition font-medium"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-[#E50914] hover:bg-[#b80710] text-white font-bold px-6 py-2 rounded transition transform active:scale-95 disabled:opacity-50 shadow-lg shadow-red-950/40"
            >
              <Sparkles size={16} />
              <span>{t(loading ? 'add.submitting' : 'add.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

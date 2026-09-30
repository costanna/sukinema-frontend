import React, { useState, useEffect } from "react";
import { X, Save, Film, Link, AlertCircle } from "lucide-react";
import { CATEGORIES, AGE_RATINGS, withCurrent } from "../constants/catalog";
import { extractYoutubeId } from "../utils/youtube";
import { useI18n } from "../i18n";
import { localizeTerm } from "../i18n/content";

export default function EditMovieModal({ movie, isOpen, onClose, onMovieUpdated, categories = CATEGORIES }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState({});
  const [previewId, setPreviewId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (movie && isOpen) {
      setForm({
        title: movie.title || "",
        overview: movie.overview || "",
        trailerUrl: movie.trailerUrl || movie.youtubeId || "",
        backdropUrl: movie.backdropUrl || "",
        posterUrl: movie.posterUrl || "",
        releaseYear: movie.releaseYear || new Date().getFullYear(),
        ageRating: movie.ageRating || "+16",
        duration: movie.duration || "Tráiler 2m 30s",
        category: movie.category || categories[0],
        genres: movie.genres || "",
        cast: movie.cast || "",
        director: movie.director || "",
        featured: movie.featured || false,
        trending: movie.trending || false,
        matchScore: movie.matchScore || "95% de coincidencia",
      });
      setPreviewId(movie.youtubeId || extractYoutubeId(movie.trailerUrl));
      setError("");
    }
  }, [movie, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !movie) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setForm(prev => ({ ...prev, [name]: newVal }));
    if (name === "trailerUrl") setPreviewId(extractYoutubeId(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.trailerUrl.trim()) {
      setError(t("edit.error.required"));
      return;
    }
    if (!extractYoutubeId(form.trailerUrl)) {
      setError(t("add.error.notYoutube"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onMovieUpdated(movie.id, { ...form, title: form.title.trim(), trailerUrl: form.trailerUrl.trim(), releaseYear: Number(form.releaseYear) || null });
      onClose();
    } catch (err) {
      setError(err.message || t("edit.error.save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="editModalTitle">
      <div className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 no-scrollbar">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 sticky top-0 bg-[#181818] z-10">
          <div className="flex items-center space-x-2">
            <Film size={20} className="text-[#E50914]" />
            <h2 id="editModalTitle" className="text-lg font-bold text-white">{t("edit.title")}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-gray-300 hover:text-white transition" aria-label={t("common.close")}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {previewId && (
            <div className="rounded-lg overflow-hidden aspect-video w-full bg-black border border-white/10">
              <iframe src={`https://www.youtube.com/embed/${previewId}?rel=0&modestbranding=1`} title={t("edit.preview")} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          {error && (
            <div role="alert" className="flex items-center space-x-2 bg-red-950/60 border border-red-700/50 text-red-300 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.url")}</label>
            <div className="relative">
              <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" name="trailerUrl" value={form.trailerUrl || ""} onChange={handleChange} maxLength={255} placeholder="https://youtube.com/watch?v=..." className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 pl-9 pr-3 text-sm outline-none transition" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.title")}</label>
            <input type="text" name="title" value={form.title || ""} onChange={handleChange} maxLength={255} placeholder={t("edit.field.titlePlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.overview")}</label>
            <textarea name="overview" value={form.overview || ""} onChange={handleChange} rows={3} maxLength={2000} placeholder={t("edit.field.overviewPlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.category")}</label>
              <select name="category" value={form.category || categories[0]} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white rounded-lg py-2.5 px-3 text-sm outline-none transition">
                {withCurrent(categories, movie.category).map(c => <option key={c} value={c}>{localizeTerm(c, lang)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.rating")}</label>
              <select name="ageRating" value={form.ageRating || "+16"} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white rounded-lg py-2.5 px-3 text-sm outline-none transition">
                {withCurrent(AGE_RATINGS, movie.ageRating).map(r => <option key={r} value={r}>{r === "TP" ? t("content.ratingAllLong") : r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.year")}</label>
              <input type="number" name="releaseYear" value={form.releaseYear || ""} onChange={handleChange} min="1970" max="2030" className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white rounded-lg py-2.5 px-3 text-sm outline-none transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.duration")}</label>
              <input type="text" name="duration" value={form.duration || ""} onChange={handleChange} maxLength={255} placeholder={t("edit.field.durationPlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.genres")}</label>
            <input type="text" name="genres" value={form.genres || ""} onChange={handleChange} maxLength={255} placeholder={t("edit.field.genresPlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.cast")}</label>
              <input type="text" name="cast" value={form.cast || ""} onChange={handleChange} maxLength={255} placeholder={t("edit.field.castPlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{t("edit.field.director")}</label>
              <input type="text" name="director" value={form.director || ""} onChange={handleChange} maxLength={255} placeholder={t("edit.field.directorPlaceholder")} className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm outline-none transition" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="featured" checked={form.featured || false} onChange={handleChange} className="w-4 h-4 accent-[#E50914] cursor-pointer" />
              <span className="text-sm text-gray-300">{t("edit.featured")}</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" name="trending" checked={form.trending || false} onChange={handleChange} className="w-4 h-4 accent-[#E50914] cursor-pointer" />
              <span className="text-sm text-gray-300">{t("edit.trending")}</span>
            </label>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-300 bg-zinc-800 hover:bg-zinc-700 transition">{t("common.cancel")}</button>
            <button type="submit" disabled={saving} className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#E50914] hover:bg-red-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed">
              <Save size={16} />
              <span>{t(saving ? "common.saving" : "common.saveChanges")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

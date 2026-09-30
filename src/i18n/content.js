import { SEED_SOURCE } from './catalogSource';
import { SEED_TRANSLATIONS, TERMS } from './catalog';
import { translate } from './index';

const COLUMN = { es: 0, ca: 1, en: 2 };

// Índice de cada término, escrito en cualquier idioma, a su fila de TERMS
const normalize = (text) => String(text).trim().toLowerCase();
const TERM_INDEX = new Map();
TERMS.forEach((row) => row.forEach((term) => {
  if (!TERM_INDEX.has(normalize(term))) TERM_INDEX.set(normalize(term), row);
}));

/** Traduce una categoría o un género conocido; si no lo conoce, lo devuelve tal cual. */
export function localizeTerm(term, lang) {
  if (!term) return term;
  const row = TERM_INDEX.get(normalize(term));
  return row ? row[COLUMN[lang]] : term;
}

/** Traduce una lista separada por comas ("Acción, Aventura"). */
export function localizeList(list, lang) {
  if (!list) return list;
  return list.split(',').map(item => localizeTerm(item.trim(), lang)).join(', ');
}

// "99% de coincidencia" / "99% match" → el porcentaje con el texto del idioma
const MATCH_WORD = { es: 'de coincidencia', ca: 'de coincidència', en: 'match' };
export function localizeMatch(matchScore, lang) {
  if (!matchScore) return matchScore;
  const percent = String(matchScore).match(/^\s*(\d{1,3})\s*%/);
  return percent ? `${percent[1]}% ${MATCH_WORD[lang]}` : matchScore;
}

// "Tráiler 2m 30s" / "Trailer 2m 30s" → la palabra "tráiler" en el idioma
const TRAILER_WORD = { es: 'Tráiler', ca: 'Tràiler', en: 'Trailer' };
export function localizeDuration(duration, lang) {
  if (!duration) return duration;
  return String(duration).replace(/^\s*tr[aáà]iler\b/i, TRAILER_WORD[lang]);
}

/**
 * Copia del tráiler con sus textos en el idioma indicado. El original queda en _raw:
 * es el que hay que usar para editar o para guardar, nunca la copia traducida.
 */
export function localizeMovie(movie, lang) {
  if (!movie) return movie;
  const source = SEED_SOURCE[movie.youtubeId];
  const translation = SEED_TRANSLATIONS[lang]?.[movie.youtubeId];
  // La traducción de título y sinopsis solo vale mientras el tráiler conserve su texto original
  const translated = (field) =>
    (source && translation && movie[field] === source[field] ? translation[field] : movie[field]);

  return {
    ...movie,
    title: translated('title'),
    overview: translated('overview'),
    category: localizeTerm(movie.category, lang),
    genres: localizeList(movie.genres, lang),
    director: localizeTerm(movie.director, lang),
    matchScore: localizeMatch(movie.matchScore, lang),
    duration: localizeDuration(movie.duration, lang),
    ageRating: movie.ageRating === 'TP' ? translate('content.ratingAll', null, lang) : movie.ageRating,
    _raw: movie,
  };
}

/** El tráiler tal como está guardado, venga o no de localizeMovie. */
export const rawMovie = (movie) => movie?._raw ?? movie;

/** Categoría y géneros en castellano, para filtrar igual se hayan escrito en el idioma que sea. */
export function canonicalTerms(movie) {
  return {
    category: localizeTerm(movie.category, 'es') || '',
    genres: localizeList(movie.genres, 'es') || '',
  };
}

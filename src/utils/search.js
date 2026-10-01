export const MIN_SEARCH_LENGTH = 3;

const SEARCHED_FIELDS = ['title', 'genres', 'cast', 'director', 'category', 'overview'];

// Sin mayúsculas ni acentos: "Timothée" y "timothee" son la misma palabra
const normalize = (text) => String(text).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export const toWords = (text) => normalize(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Palabras de un texto de búsqueda; vacío si no llega al mínimo de letras. */
export function searchWords(query) {
  const words = toWords(query);
  return words.join('').length >= MIN_SEARCH_LENGTH ? words : [];
}

/** Palabras por las que se puede encontrar un tráiler, en cada versión de sus textos (traducida y original). */
export function movieWords(...versions) {
  const words = new Set();
  for (const movie of versions) {
    for (const field of SEARCHED_FIELDS) {
      if (movie?.[field]) toWords(movie[field]).forEach(word => words.add(word));
    }
  }
  return [...words];
}

/**
 * Cada palabra buscada debe ser el principio de alguna palabra del tráiler: "nol" encuentra a
 * Christopher Nolan y "chris nolan" también, en cualquier orden.
 */
export const matchesWords = (words, query) => query.every(part => words.some(word => word.startsWith(part)));

// Misma regla que el backend (Movie.extractYoutubeId): acepta un ID suelto o un enlace de YouTube
const YOUTUBE_URL = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Devuelve el ID del vídeo, o una cadena vacía si el texto no es de YouTube. */
export function extractYoutubeId(url) {
  if (!url) return '';
  const value = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;
  const match = value.match(YOUTUBE_URL);
  return match ? match[1] : '';
}

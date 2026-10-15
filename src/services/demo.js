import { FALLBACK_MOVIES } from '../data/fallbackData';
import { FALLBACK_PROFILES } from './api';

// Modo demo: la app funciona sin servidor y todo lo que se hace (perfiles,
// tráilers añadidos, editados o borrados, likes y "Mi Lista") se guarda solo en
// este navegador. Se recuerda al recargar y al cambiar de perfil; "Empezar de
// cero" vuelve a los datos iniciales. En la demo no se llama nunca al servidor,
// así que tampoco lo despierta.

const DEMO_FLAG_KEY = 'sukinema_demo';
const DEMO_DB_KEY = 'sukinema_demo_db';
// La lista y los likes de cada perfil de la demo (ver App.jsx)
const DEMO_PROFILE_KEY_PREFIXES = ['sukinema_demo_my_list_', 'sukinema_demo_likes_'];
// Si cambia la forma de los datos guardados, una copia antigua se sustituye por la inicial
const DEMO_DB_VERSION = 1;

const safely = (fn, fallback) => {
  try {
    return fn();
  } catch (e) {
    console.error(e);
    return fallback;
  }
};

export const isDemoChosen = () => safely(() => localStorage.getItem(DEMO_FLAG_KEY) === '1', false);

export const chooseDemo = () => safely(() => localStorage.setItem(DEMO_FLAG_KEY, '1'));

// Al salir se conservan los datos: quien vuelve a la demo encuentra lo que dejó
export const leaveDemo = () => safely(() => localStorage.removeItem(DEMO_FLAG_KEY));

export const hasSavedDemo = () => safely(() => localStorage.getItem(DEMO_DB_KEY) !== null, false);

export const loadDemoDb = () => {
  const saved = safely(() => JSON.parse(localStorage.getItem(DEMO_DB_KEY) ?? 'null'), null);
  if (saved?.version === DEMO_DB_VERSION && Array.isArray(saved.movies) && Array.isArray(saved.profiles)) {
    return { movies: saved.movies, profiles: saved.profiles };
  }
  return { movies: FALLBACK_MOVIES, profiles: FALLBACK_PROFILES };
};

export const saveDemoDb = ({ movies, profiles }) =>
  safely(() => localStorage.setItem(DEMO_DB_KEY, JSON.stringify({ version: DEMO_DB_VERSION, movies, profiles })));

// Borra todo lo guardado por la demo: catálogo, perfiles y la lista y los likes de cada perfil
export const resetDemoData = () =>
  safely(() => {
    localStorage.removeItem(DEMO_DB_KEY);
    Object.keys(localStorage)
      .filter((key) => DEMO_PROFILE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => localStorage.removeItem(key));
  });

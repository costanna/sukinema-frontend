import { useSyncExternalStore, useCallback } from 'react';
import es from './es';
import ca from './ca';
import en from './en';

const DICTIONARIES = { ca, en, es };
const STORAGE_KEY = 'sukinema_lang';
// Si el navegador no pide ninguno de los idiomas disponibles, la web se abre en inglés
const FALLBACK_LANGUAGE = 'en';

export const LANGUAGES = [
  { code: 'ca', short: 'CA', name: 'Català' },
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'es', short: 'ES', name: 'Castellano' },
];

const isSupported = (code) => Object.prototype.hasOwnProperty.call(DICTIONARIES, code);

function detectLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch (e) {
    console.error(e);
  }
  const preferred = typeof navigator !== 'undefined' ? (navigator.languages || [navigator.language]) : [];
  for (const tag of preferred) {
    const code = String(tag || '').toLowerCase().split('-')[0];
    if (isSupported(code)) return code;
  }
  return FALLBACK_LANGUAGE;
}

/**
 * Texto de la clave en el idioma indicado. Los huecos {nombre} se rellenan con params.
 * Con params.count se elige entre las variantes clave_one y clave_other.
 */
export function translate(key, params, lang = currentLanguage) {
  const lookup = (dictionary) => {
    if (params && params.count !== undefined) {
      const plural = dictionary[`${key}_${params.count === 1 ? 'one' : 'other'}`];
      if (plural !== undefined) return plural;
    }
    return dictionary[key];
  };
  // Si falta una traducción se usa el castellano, que es el idioma en el que se escribió la app
  const template = lookup(DICTIONARIES[lang]) ?? lookup(es) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

let currentLanguage = detectLanguage();
const listeners = new Set();

function applyToDocument() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = currentLanguage;
  document.title = translate('app.documentTitle');
}
applyToDocument();

export const getLanguage = () => currentLanguage;

export function setLanguage(code) {
  if (!isSupported(code) || code === currentLanguage) return;
  currentLanguage = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch (e) {
    console.error(e);
  }
  applyToDocument();
  listeners.forEach(listener => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Idioma actual y función de traducción; el componente se vuelve a pintar al cambiar de idioma. */
export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getLanguage);
  const t = useCallback((key, params) => translate(key, params, lang), [lang]);
  return { lang, setLang: setLanguage, t };
}

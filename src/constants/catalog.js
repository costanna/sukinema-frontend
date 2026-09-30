// Opciones compartidas por los formularios de alta y edición de tráilers.
// Son los valores que se guardan; su nombre en cada idioma sale de i18n/catalog.js

export const CATEGORIES = [
  'Tendencias Ahora',
  'Acción y Adrenalina',
  'Ciencia Ficción y Fantasía',
  'Anime y Animación',
  'Aclamadas por la Crítica',
];

// El perfil infantil solo ve TP, +7 y +12
export const AGE_RATINGS = ['TP', '+7', '+12', '+16', '+18'];

// Mantiene seleccionable el valor actual de un tráiler aunque no esté en la lista
export const withCurrent = (options, current) =>
  current && !options.includes(current) ? [current, ...options] : options;

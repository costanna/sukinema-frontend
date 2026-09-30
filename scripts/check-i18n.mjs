// Comprueba las traducciones: `npm run check:i18n`.
//  1. Los tres idiomas tienen exactamente las mismas claves.
//  2. Cada clave tiene los mismos huecos {nombre} en los tres.
//  3. Toda clave usada en el código existe.
//  4. No quedan textos fijos en los componentes (deben salir de los diccionarios).
//  5. Cada tráiler inicial tiene título y sinopsis en catalán e inglés.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const load = async (path) => (await import(pathToFileURL(join(SRC, path)).href));

const dictionaries = {
  es: (await load('i18n/es.js')).default,
  ca: (await load('i18n/ca.js')).default,
  en: (await load('i18n/en.js')).default,
};
const { SEED_SOURCE } = await load('i18n/catalogSource.js');
const { SEED_TRANSLATIONS, TERMS } = await load('i18n/catalog.js');

const problems = [];
const report = (message) => problems.push(message);

// 1 y 2: mismas claves y mismos huecos
const keys = Object.keys(dictionaries.es);
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
for (const lang of ['ca', 'en']) {
  for (const key of keys) {
    if (!(key in dictionaries[lang])) report(`[${lang}] falta la clave "${key}"`);
    else if (placeholders(dictionaries[lang][key]) !== placeholders(dictionaries.es[key])) {
      report(`[${lang}] "${key}" no tiene los mismos huecos que en castellano`);
    } else if (!String(dictionaries[lang][key]).trim()) report(`[${lang}] "${key}" está vacía`);
  }
  for (const key of Object.keys(dictionaries[lang])) {
    if (!(key in dictionaries.es)) report(`[${lang}] sobra la clave "${key}" (no existe en castellano)`);
  }
}

// Archivos de código, sin los propios diccionarios ni los textos del catálogo
const DATA_FILES = new Set(['es.js', 'ca.js', 'en.js', 'catalog.js', 'catalogSource.js']);
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(jsx?|mjs)$/.test(name) && !(dir.endsWith('i18n') && DATA_FILES.has(name))) files.push(path);
  }
};
walk(SRC);

// 3: claves usadas. Se reconoce cualquier literal con forma de clave de un espacio de nombres conocido.
const namespaces = [...new Set(keys.map(key => key.split('.')[0]))];
const keyLiteral = new RegExp(`['"\`]((?:${namespaces.join('|')})\\.[A-Za-z0-9_.]+)['"\`]`, 'g');
const exists = (key) => key in dictionaries.es || `${key}_one` in dictionaries.es;
const used = new Set();
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(keyLiteral)) {
    used.add(match[1]);
    if (!exists(match[1])) report(`${relative(SRC, file)}: usa la clave "${match[1]}", que no existe`);
  }
  // Claves construidas: t(`auth.${mode}.title`)
  for (const match of source.matchAll(/t\(`([a-z]+)\.\$\{(\w+)\}\.(?:\$\{[^}]+\}|(\w+))`/g)) {
    const prefix = `${match[1]}.`;
    keys.filter(key => key.startsWith(prefix)).forEach(key => used.add(key));
  }
}
const unused = keys.filter(key => !used.has(key) && !used.has(key.replace(/_(one|other)$/, '')));

// 4: textos fijos en el JSX. Se ignoran marcas, nombres de tecnologías y símbolos.
const ALLOWED = /^(SUKINEMA|React 18|Vite \+ Tailwind|Java 21|Spring Boot 3\.3|HD 1080p|Ultra HD 4K|HD|ABCD-EFGH-JKLM|https:\/\/youtube\.com\/watch\?v=\.\.\.|[\W\d_]*)$/;
const letters = /[A-Za-zÀ-ÿ]{3,}/;
for (const file of files.filter(f => f.endsWith('.jsx'))) {
  const source = readFileSync(file, 'utf8');
  const name = relative(SRC, file);
  source.split('\n').forEach((line, index) => {
    if (/^\s*(\/\/|\*|\{\/\*)/.test(line)) return;
    const found = [];
    // Texto entre etiquetas: >Texto<
    for (const m of line.matchAll(/>([^<>{}]+)</g)) found.push(m[1]);
    // Línea que es solo texto dentro de una etiqueta: empieza en mayúscula y no tiene aspecto de código
    const isCall = /^\s*[\w$]+(\.[\w$]+)+\(/.test(line);
    if (!isCall && /^\s+[A-ZÀ-Ý¿¡][^<>{}=;'"`|&[\]]*[^<>{}=;'"`|&[\],\s]\s*$/.test(line)) found.push(line);
    // Atributos visibles o leídos por lectores de pantalla
    for (const m of line.matchAll(/\b(?:aria-label|title|placeholder|alt|label|sub)="([^"]+)"/g)) found.push(m[1]);
    for (const text of found) {
      const clean = text.trim();
      if (clean && letters.test(clean) && !ALLOWED.test(clean)) report(`${name}:${index + 1}: texto fijo sin traducir: "${clean}"`);
    }
  });
}

// 5: contenido del catálogo inicial
for (const lang of ['ca', 'en']) {
  for (const id of Object.keys(SEED_SOURCE)) {
    const entry = SEED_TRANSLATIONS[lang]?.[id];
    if (!entry?.title || !entry?.overview) report(`[${lang}] falta la traducción del tráiler ${id} (${SEED_SOURCE[id].title})`);
  }
  for (const id of Object.keys(SEED_TRANSLATIONS[lang] || {})) {
    if (!SEED_SOURCE[id]) report(`[${lang}] hay una traducción para ${id}, que no es un tráiler inicial`);
  }
}
for (const row of TERMS) {
  if (row.length !== 3 || row.some(term => !String(term || '').trim())) report(`término incompleto: ${JSON.stringify(row)}`);
}

console.log(`${keys.length} claves por idioma · ${files.length} archivos revisados · ${Object.keys(SEED_SOURCE).length} tráilers iniciales · ${TERMS.length} términos`);
if (unused.length) console.log(`Aviso: ${unused.length} claves sin uso detectado: ${unused.join(', ')}`);
if (problems.length) {
  console.log(`\n${problems.length} problemas:`);
  problems.forEach(problem => console.log('  - ' + problem));
  process.exit(1);
}
console.log('Traducciones completas.');

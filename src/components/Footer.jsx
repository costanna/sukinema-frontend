import React from 'react';
import { Heart } from 'lucide-react';

const FOOTER_LINKS = [
  { id: 'home', label: 'Catálogo de Tráilers' },
  { id: 'tendencias', label: 'Tendencias' },
  { id: 'anime', label: 'Anime & Animación' },
  { id: 'scifi', label: 'Ciencia Ficción' },
  { id: 'myList', label: 'Mi Lista' },
  { id: 'stats', label: 'Estadísticas' },
];

export default function Footer({ onNavigate }) {
  return (
    <footer className="mt-20 border-t border-zinc-800/80 bg-[#101010] py-12 px-6 md:px-12 text-zinc-500 text-xs">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="brand-font text-2xl text-[#E50914] font-black tracking-wider">
              SUKINEMA
            </span>
            <span className="text-[11px] text-zinc-400">
              • Plataforma de Tráilers Full Stack
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-zinc-400">
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">React 18</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Vite + Tailwind</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Java 21</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Spring Boot 3.3</span>
          </div>
        </div>

        <nav aria-label="Secciones" className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-zinc-400 pt-2">
          {FOOTER_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate && onNavigate(link.id)}
              className="text-left hover:underline hover:text-white transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between text-zinc-500 gap-2">
          <p>© 2026 SUKINEMA. Inspirado en la interfaz de Netflix para explorar y disfrutar trailers cinematográficos.</p>
          <p className="flex items-center space-x-1">
            <span>Hecho con</span>
            <Heart size={13} className="text-red-600 fill-current" />
            <span>para cineastas y amantes del cine</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

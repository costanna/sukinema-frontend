import React from 'react';
import { Film, Github, Heart } from 'lucide-react';

export default function Footer() {
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

          <div className="flex items-center space-x-3 text-zinc-400">
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">React 18</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Vite + Tailwind</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Java 21</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Spring Boot 3.3</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-zinc-400 pt-2">
          <div className="space-y-2">
            <p className="hover:underline cursor-pointer">Catálogo de Tráilers</p>
            <p className="hover:underline cursor-pointer">Próximos Estrenos</p>
          </div>
          <div className="space-y-2">
            <p className="hover:underline cursor-pointer">Anime & Animación</p>
            <p className="hover:underline cursor-pointer">Ciencia Ficción</p>
          </div>
          <div className="space-y-2">
            <p className="hover:underline cursor-pointer">API REST Spring Boot</p>
            <p className="hover:underline cursor-pointer">Consola H2 Database</p>
          </div>
          <div className="space-y-2">
            <p className="hover:underline cursor-pointer">Términos de Uso</p>
            <p className="hover:underline cursor-pointer">Privacidad</p>
          </div>
        </div>

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

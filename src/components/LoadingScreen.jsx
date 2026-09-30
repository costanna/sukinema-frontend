import React, { useState, useEffect } from 'react';

// Tras unos segundos explica la espera: en el plan gratuito de Render el backend
// se duerme sin uso y la primera petición tarda mientras arranca.
const SLOW_NOTICE_MS = 4000;

export default function LoadingScreen() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsSlow(true), SLOW_NOTICE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#141414] flex flex-col items-center justify-center px-6 text-center" role="status" aria-live="polite">
      <span className="brand-font text-3xl md:text-4xl text-[#E50914] tracking-wider font-extrabold mb-8">
        SUKINEMA
      </span>
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-sm text-gray-400">Cargando…</p>
      {isSlow && (
        <p className="mt-2 text-xs text-gray-500 max-w-xs">
          El servidor se está despertando. La primera visita puede tardar hasta un minuto.
        </p>
      )}
    </div>
  );
}

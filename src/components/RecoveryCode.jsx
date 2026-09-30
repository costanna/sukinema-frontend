import React, { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';

/** Muestra un código de recuperación con un botón para copiarlo. */
export function RecoveryCodeBox({ code }) {
  const [copyLabel, setCopyLabel] = useState('Copiar código');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyLabel('¡Copiado!');
    } catch {
      setCopyLabel('No se pudo copiar');
    }
    setTimeout(() => setCopyLabel('Copiar código'), 2000);
  };

  return (
    <div className="space-y-2">
      <p
        data-testid="recovery-code"
        className="font-mono text-xl md:text-2xl tracking-widest text-center text-white bg-zinc-900 border border-zinc-700 rounded py-3 select-all"
      >
        {code}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded text-sm transition"
      >
        <Copy size={15} />
        <span>{copyLabel}</span>
      </button>
    </div>
  );
}

/** Pantalla que enseña el código recién generado; el servidor no lo vuelve a entregar. */
export default function RecoveryCodeNotice({ code, onDone }) {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 py-12">
      <span className="brand-font text-4xl md:text-5xl text-[#E50914] tracking-wider font-extrabold mb-8">
        SUKINEMA
      </span>

      <div className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <KeyRound size={22} className="text-[#E50914] flex-shrink-0" />
            <span>Guarda tu código</span>
          </h1>
          <p className="text-sm text-gray-400">
            Si olvidas tu contraseña, este código es la única forma de recuperar la cuenta.
            Apúntalo en un lugar seguro: <strong className="text-gray-200">no se volverá a mostrar</strong>.
          </p>
        </div>

        <RecoveryCodeBox code={code} />

        <button
          type="button"
          onClick={onDone}
          className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded text-sm transition transform active:scale-[0.98]"
        >
          Ya lo he guardado
        </button>
      </div>
    </div>
  );
}

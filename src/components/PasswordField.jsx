import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Campo de contraseña con el botón del ojo para verla u ocultarla. */
export default function PasswordField({ id, label, value, onChange, autoComplete, placeholder, autoFocus = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={72}
          autoComplete={autoComplete}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2.5 pr-11 text-white text-sm outline-none placeholder-gray-500"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400 hover:text-white transition"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

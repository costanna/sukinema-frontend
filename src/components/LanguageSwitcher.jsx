import React from 'react';
import { LANGUAGES, useI18n } from '../i18n';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div role="group" aria-label={t('common.language')} className={`inline-flex items-center rounded border border-white/15 overflow-hidden ${className}`}>
      {LANGUAGES.map(language => (
        <button
          key={language.code}
          type="button"
          onClick={() => setLang(language.code)}
          lang={language.code}
          title={language.name}
          aria-label={language.name}
          aria-pressed={lang === language.code}
          className={`px-2 py-1 text-[11px] font-bold tracking-wide transition ${
            lang === language.code ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}

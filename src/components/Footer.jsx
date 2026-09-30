import React from 'react';
import { Heart } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n';

const PORTFOLIO_URL = 'https://anna-dev-teal.vercel.app/';

const FOOTER_LINKS = [
  { id: 'home', labelKey: 'footer.catalog' },
  { id: 'tendencias', labelKey: 'nav.trending' },
  { id: 'anime', labelKey: 'nav.anime' },
  { id: 'scifi', labelKey: 'nav.scifi' },
  { id: 'myList', labelKey: 'nav.myList' },
  { id: 'stats', labelKey: 'nav.stats' },
];

export default function Footer({ onNavigate }) {
  const { t } = useI18n();

  return (
    <footer className="mt-20 border-t border-zinc-800/80 bg-[#101010] py-12 px-6 md:px-12 text-zinc-500 text-xs">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="brand-font text-2xl text-[#E50914] font-black tracking-wider">
              SUKINEMA
            </span>
            <span className="text-[11px] text-zinc-400">
              {t('footer.tagline')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-zinc-400">
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">React 18</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Vite + Tailwind</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Java 21</span>
            <span className="bg-zinc-800/80 px-2 py-1 rounded text-[11px] font-mono">Spring Boot 3.3</span>
          </div>
        </div>

        <nav aria-label={t('footer.sections')} className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-zinc-400 pt-2">
          {FOOTER_LINKS.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate && onNavigate(link.id)}
              className="text-left hover:underline hover:text-white transition-colors"
            >
              {t(link.labelKey)}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between text-zinc-500 gap-3">
          <div className="text-center sm:text-left space-y-1">
            <p>
              {t('footer.copyright', { year: new Date().getFullYear() })}{' '}
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                title={t('footer.portfolio')}
                aria-label={t('footer.portfolio')}
                className="font-semibold text-zinc-300 hover:text-[#E50914] underline-offset-2 hover:underline transition-colors"
              >
                @costanna
              </a>
            </p>
            <p className="text-zinc-600">{t('footer.inspired')}</p>
          </div>
          <p className="flex items-center space-x-1">
            <span>{t('footer.madeWith')}</span>
            <Heart size={13} className="text-red-600 fill-current" />
            <span>{t('footer.forCinephiles')}</span>
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

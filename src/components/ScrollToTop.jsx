import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { useI18n } from '../i18n';

export default function ScrollToTop() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollUp}
      aria-label={t('common.backToTop')}
      className={`fixed bottom-6 left-4 z-50 w-11 h-11 rounded-full bg-[#E50914]/90 hover:bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-950/40 transition-all duration-300 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  );
}

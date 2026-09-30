import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import PasswordField from './PasswordField';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n';

const MIN_PASSWORD_LENGTH = 8;
// Igual que LoadingScreen: tras unos segundos se explica que el servidor gratuito está despertando
const SLOW_NOTICE_MS = 4000;

export default function AuthScreen({ onLogin, onRegister, onRecover, serverDown = false, onEnterDemo }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const [error, setError] = useState('');

  const choosesPassword = mode !== 'login';

  useEffect(() => {
    if (!submitting) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), SLOW_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [submitting]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && !name.trim()) {
      setError(t('auth.error.name'));
      return;
    }
    if (!email.trim()) {
      setError(t('auth.error.email'));
      return;
    }
    if (mode === 'recover' && !recoveryCode.trim()) {
      setError(t('auth.error.recoveryCode'));
      return;
    }
    if (!password) {
      setError(t(mode === 'recover' ? 'auth.error.newPassword' : 'auth.error.password'));
      return;
    }
    if (choosesPassword && password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.error.passwordTooShort', { min: MIN_PASSWORD_LENGTH }));
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await onRegister(name.trim(), email.trim(), password);
      } else if (mode === 'recover') {
        await onRecover(email.trim(), recoveryCode.trim(), password);
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || t('auth.error.generic'));
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2.5 text-white text-sm outline-none placeholder-gray-500';

  return (
    <div className="relative min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 py-12">
      <LanguageSwitcher className="absolute top-5 right-5" />

      <span className="brand-font text-4xl md:text-5xl text-[#E50914] tracking-wider font-extrabold mb-8">
        SUKINEMA
      </span>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl p-6 md:p-8 space-y-5"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white">{t(`auth.${mode}.title`)}</h1>
          <p className="text-sm text-gray-400">{t(`auth.${mode}.intro`)}</p>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-red-950/70 border border-red-700 rounded text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'register' && (
          <div>
            <label htmlFor="authName" className="block text-xs font-semibold text-gray-300 mb-1">
              {t('auth.name')}
            </label>
            <input
              id="authName"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              maxLength={40}
              autoComplete="name"
              placeholder={t('auth.namePlaceholder')}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="authEmail" className="block text-xs font-semibold text-gray-300 mb-1">
            {t('auth.email')}
          </label>
          <input
            id="authEmail"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            maxLength={120}
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            className={inputClass}
            autoFocus
          />
        </div>

        {mode === 'recover' && (
          <div>
            <label htmlFor="authRecoveryCode" className="block text-xs font-semibold text-gray-300 mb-1">
              {t('auth.recoveryCode')}
            </label>
            <input
              id="authRecoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(e) => { setRecoveryCode(e.target.value); setError(''); }}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCD-EFGH-JKLM"
              className={`${inputClass} font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal`}
            />
          </div>
        )}

        {/* La key hace que el campo vuelva a ocultar la contraseña al cambiar de formulario */}
        <PasswordField
          key={mode}
          id="authPassword"
          label={t(mode === 'recover' ? 'auth.newPassword' : 'auth.password')}
          value={password}
          onChange={(value) => { setPassword(value); setError(''); }}
          autoComplete={choosesPassword ? 'new-password' : 'current-password'}
          placeholder={choosesPassword ? t('auth.passwordMin', { min: MIN_PASSWORD_LENGTH }) : t('auth.passwordPlaceholder')}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded text-sm transition transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {t(`auth.${mode}.${submitting ? 'submitting' : 'submit'}`)}
        </button>

        {isSlow && (
          <p role="status" className="text-xs text-gray-500 text-center">
            {t('common.serverWaking')}
          </p>
        )}

        <div className="text-sm text-gray-400 text-center space-y-2">
          {mode === 'login' && (
            <p>
              <button type="button" onClick={() => switchMode('recover')} className="hover:text-white hover:underline">
                {t('auth.forgot')}
              </button>
            </p>
          )}
          <p>
            {t(mode === 'login' ? 'auth.firstTime' : mode === 'register' ? 'auth.haveAccount' : 'auth.remembered')}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-white font-semibold hover:underline"
            >
              {t(mode === 'login' ? 'auth.createAccount' : 'auth.signIn')}
            </button>
          </p>
        </div>
      </form>

      {serverDown && onEnterDemo && (
        <div className="w-full max-w-sm mt-5 p-4 bg-amber-950/40 border border-amber-700/50 rounded-xl text-xs text-amber-100 space-y-3">
          <p className="flex items-start space-x-2">
            <WifiOff size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{t('auth.serverDown')}</span>
          </p>
          <button
            type="button"
            onClick={onEnterDemo}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded transition"
          >
            {t('auth.enterDemo')}
          </button>
        </div>
      )}
    </div>
  );
}

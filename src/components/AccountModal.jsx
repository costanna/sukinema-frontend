import React, { useState, useEffect } from 'react';
import { X, UserRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import PasswordField from './PasswordField';
import { RecoveryCodeBox } from './RecoveryCode';
import { useI18n } from '../i18n';

const MIN_PASSWORD_LENGTH = 8;

function FormMessage({ error, success }) {
  if (error) {
    return (
      <div role="alert" className="p-3 bg-red-950/70 border border-red-700 rounded text-red-200 text-xs flex items-center space-x-2">
        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div role="status" className="p-3 bg-green-950/60 border border-green-700/60 rounded text-green-200 text-xs flex items-center space-x-2">
        <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
        <span>{success}</span>
      </div>
    );
  }
  return null;
}

export default function AccountModal({ account, isOpen, onClose, onChangePassword, onNewRecoveryCode }) {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [codePassword, setCodePassword] = useState('');
  const [codeError, setCodeError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // Al abrir, los formularios empiezan limpios: no queda una contraseña ni un código a la vista
  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setCodePassword('');
    setCodeError('');
    setRecoveryCode('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !account) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    if (!currentPassword) {
      setPasswordError(t('account.error.current'));
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t('account.error.newTooShort', { min: MIN_PASSWORD_LENGTH }));
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError(t('account.error.same'));
      return;
    }
    setPasswordError('');
    setSavingPassword(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSuccess(t('account.passwordChanged'));
    } catch (err) {
      setPasswordError(err.message || t('account.error.change'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!codePassword) {
      setCodeError(t('account.error.password'));
      return;
    }
    setCodeError('');
    setGeneratingCode(true);
    try {
      setRecoveryCode(await onNewRecoveryCode(codePassword));
      setCodePassword('');
    } catch (err) {
      setCodeError(err.message || t('account.error.code'));
    } finally {
      setGeneratingCode(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accountModalTitle"
    >
      <div className="bg-[#181818] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10 no-scrollbar">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 sticky top-0 bg-[#181818] z-10">
          <div className="flex items-center space-x-2">
            <UserRound size={20} className="text-[#E50914]" />
            <h2 id="accountModalTitle" className="text-lg font-bold text-white">{t('account.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-gray-300 hover:text-white transition"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <dl className="text-sm space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">{t('account.name')}</dt>
              <dd className="text-gray-200 truncate">{account.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">{t('account.email')}</dt>
              <dd className="text-gray-200 truncate">{account.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">{t('account.type')}</dt>
              <dd className="text-gray-200">{t(account.role === 'ADMIN' ? 'account.typeAdmin' : 'account.typeStandard')}</dd>
            </div>
          </dl>

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 pt-5 border-t border-white/10">
            <h3 className="text-sm font-bold text-white">{t('account.changePassword')}</h3>
            <FormMessage error={passwordError} success={passwordSuccess} />
            <PasswordField
              id="accountCurrentPassword"
              label={t('account.currentPassword')}
              value={currentPassword}
              onChange={(value) => { setCurrentPassword(value); setPasswordError(''); }}
              autoComplete="current-password"
            />
            <PasswordField
              id="accountNewPassword"
              label={t('account.newPassword')}
              value={newPassword}
              onChange={(value) => { setNewPassword(value); setPasswordError(''); }}
              autoComplete="new-password"
              placeholder={t('auth.passwordMin', { min: MIN_PASSWORD_LENGTH })}
            />
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-[#E50914] hover:bg-[#b80710] text-white font-bold py-2.5 rounded text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t(savingPassword ? 'account.changing' : 'account.changePassword')}
            </button>
          </form>

          <form onSubmit={handleCodeSubmit} noValidate className="space-y-4 pt-5 border-t border-white/10">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">{t('account.recoveryTitle')}</h3>
              <p className="text-xs text-gray-400">
                {t('account.recoveryIntro')}
              </p>
            </div>
            <FormMessage error={codeError} />
            {recoveryCode ? (
              <div className="space-y-2">
                <RecoveryCodeBox code={recoveryCode} />
                <p className="text-xs text-gray-400 text-center">{t('account.saveNow')}</p>
              </div>
            ) : (
              <>
                <PasswordField
                  id="accountCodePassword"
                  label={t('account.yourPassword')}
                  value={codePassword}
                  onChange={(value) => { setCodePassword(value); setCodeError(''); }}
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  disabled={generatingCode}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t(generatingCode ? 'account.generating' : 'account.generate')}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

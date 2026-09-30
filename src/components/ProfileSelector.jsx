import React, { useState } from 'react';
import { Plus, X, Trash2, Check, AlertCircle, Pencil, LogOut } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n';

const MAX_PROFILES = 5;

const AVATARS = ['🍿', '🎬', '⚡', '🦄', '👻', '🚀', '🐉', '🎮', '🦊', '🌙'];

const COLORS = [
  'from-red-600 to-rose-700',
  'from-blue-600 to-indigo-800',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700',
  'from-purple-600 to-fuchsia-800',
  'from-pink-500 to-rose-600',
];

const EMPTY_FORM = { name: '', avatar: AVATARS[0], color: COLORS[0], isKid: false };

export default function ProfileSelector({
  profiles = [],
  activeProfileId = null,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
  onLogout,
  accountLabel
}) {
  const { t } = useI18n();
  const [managing, setManaging] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const showForm = creating || !!editingProfile;

  const openCreateForm = () => {
    // Sugerir un color que aún no esté en uso
    const used = new Set(profiles.map(p => p.color));
    setForm({ ...EMPTY_FORM, color: COLORS.find(c => !used.has(c)) || COLORS[0] });
    setError('');
    setCreating(true);
  };

  const openEditForm = (profile) => {
    setForm({
      name: profile.name || '',
      avatar: profile.avatar || AVATARS[0],
      color: profile.color || COLORS[0],
      isKid: !!profile.isKid,
    });
    setError('');
    setEditingProfile(profile);
  };

  const closeForm = () => {
    setCreating(false);
    setEditingProfile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError(t('profiles.error.name'));
      return;
    }
    if (profiles.some(p => p.id !== editingProfile?.id && p.name.toLowerCase() === name.toLowerCase())) {
      setError(t('profiles.error.duplicate'));
      return;
    }
    try {
      setSaving(true);
      if (editingProfile) {
        await onUpdate(editingProfile.id, { ...form, name });
      } else {
        await onCreate({ ...form, name });
      }
      closeForm();
    } catch (err) {
      setError(err.message || t('profiles.error.save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#141414] overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
          aria-label={t('profiles.closeSelector')}
        >
          <X size={20} />
        </button>
      )}

      <LanguageSwitcher className="absolute top-5 left-5" />

      <span className="brand-font text-3xl md:text-4xl text-[#E50914] tracking-wider font-extrabold mb-8">
        SUKINEMA
      </span>

      {showForm ? (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {t(editingProfile ? 'profiles.edit' : 'profiles.add')}
            </h1>
            <p className="text-sm text-gray-400">
              {editingProfile
                ? t('profiles.editIntro')
                : t('profiles.addIntro')}
            </p>
          </div>

          <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-md bg-gradient-to-br ${form.color} flex items-center justify-center text-5xl shadow-lg`}>
              {form.avatar}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/70 border border-red-700 rounded text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="profileName" className="block text-xs font-semibold text-gray-300 mb-1">
              {t('profiles.name')}
            </label>
            <input
              id="profileName"
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm(prev => ({ ...prev, name: e.target.value }));
                setError('');
              }}
              maxLength={20}
              placeholder={t('profiles.namePlaceholder')}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#E50914] rounded px-3 py-2 text-white text-sm outline-none"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-300 mb-1">{t('profiles.avatar')}</span>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, avatar }))}
                  className={`w-10 h-10 rounded bg-zinc-900 text-xl flex items-center justify-center border transition ${
                    form.avatar === avatar ? 'border-white' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                  aria-label={t('profiles.avatarOption', { avatar })}
                  aria-pressed={form.avatar === avatar}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-300 mb-1">{t('profiles.color')}</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded bg-gradient-to-br ${color} flex items-center justify-center border-2 transition ${
                    form.color === color ? 'border-white' : 'border-transparent hover:border-white/40'
                  }`}
                  aria-label={t('profiles.colorOption')}
                  aria-pressed={form.color === color}
                >
                  {form.color === color && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start space-x-2 cursor-pointer text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.isKid}
              onChange={(e) => setForm(prev => ({ ...prev, isKid: e.target.checked }))}
              className="mt-0.5 w-4 h-4 accent-[#E50914] cursor-pointer"
            />
            <span>
              {t('profiles.kid')}
              <span className="block text-xs text-gray-500">{t('profiles.kidHint')}</span>
            </span>
          </label>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 rounded text-gray-400 hover:text-white transition font-medium text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#E50914] hover:bg-[#b80710] text-white font-bold px-6 py-2 rounded text-sm transition transform active:scale-95 disabled:opacity-50"
            >
              {t(saving ? 'common.saving' : editingProfile ? 'common.saveChanges' : 'profiles.save')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white text-center mb-8">
            {t(managing ? 'profiles.manage' : 'profiles.whoIsWatching')}
          </h1>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-3xl">
            {profiles.map(profile => (
              <div key={profile.id} className="relative group w-24 md:w-32">
                <button
                  onClick={() => !managing && onSelect(profile)}
                  disabled={managing}
                  className="w-full flex flex-col items-center space-y-2 focus:outline-none"
                >
                  <div
                    className={`w-24 h-24 md:w-32 md:h-32 rounded-md bg-gradient-to-br ${profile.color} flex items-center justify-center text-5xl md:text-6xl border-2 transition ${
                      managing
                        ? 'opacity-50 border-transparent'
                        : profile.id === activeProfileId
                          ? 'border-white'
                          : 'border-transparent group-hover:border-white group-focus-within:border-white'
                    }`}
                  >
                    {profile.avatar}
                  </div>
                  <span className={`text-sm truncate max-w-full transition ${managing ? 'text-gray-500' : 'text-gray-400 group-hover:text-white'}`}>
                    {profile.name}
                  </span>
                  {profile.isKid && (
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                      {t('common.kids')}
                    </span>
                  )}
                </button>

                {managing && (
                  <div className="absolute top-8 md:top-12 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                    <button
                      onClick={() => openEditForm(profile)}
                      className="w-9 h-9 rounded-full bg-black/80 hover:bg-white hover:text-black text-white flex items-center justify-center border border-white/40 transition"
                      title={t('profiles.editProfile', { name: profile.name })}
                      aria-label={t('profiles.editProfile', { name: profile.name })}
                    >
                      <Pencil size={16} />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => onDelete(profile)}
                        className="w-9 h-9 rounded-full bg-black/80 hover:bg-[#E50914] text-white flex items-center justify-center border border-white/40 transition"
                        title={t('profiles.deleteProfile', { name: profile.name })}
                        aria-label={t('profiles.deleteProfile', { name: profile.name })}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!managing && profiles.length < MAX_PROFILES && (
              <button
                onClick={openCreateForm}
                className="group w-24 md:w-32 flex flex-col items-center space-y-2 focus:outline-none"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-md bg-zinc-900 border-2 border-zinc-700 group-hover:border-white group-focus:border-white text-gray-500 group-hover:text-white flex items-center justify-center transition">
                  <Plus size={44} />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition">{t('profiles.add')}</span>
              </button>
            )}
          </div>

          {profiles.length > 0 && (
            <button
              onClick={() => setManaging(!managing)}
              className={`mt-10 px-6 py-2 text-sm font-semibold uppercase tracking-widest border transition ${
                managing
                  ? 'bg-white text-black border-white hover:bg-gray-200'
                  : 'text-gray-400 border-gray-500 hover:text-white hover:border-white'
              }`}
            >
              {t(managing ? 'profiles.done' : 'profiles.manage')}
            </button>
          )}

          {onLogout && !managing && (
            <p className="mt-6 text-xs text-gray-500 text-center">
              {accountLabel && <span className="block mb-1">{accountLabel}</span>}
              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 text-gray-400 hover:text-white transition"
              >
                <LogOut size={14} />
                <span>{t('profiles.logout')}</span>
              </button>
            </p>
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, ChevronDown, Settings, Menu, LogOut, UserRound } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Inicio' },
  { id: 'tendencias', label: 'Tendencias' },
  { id: 'anime', label: 'Anime & Animación' },
  { id: 'scifi', label: 'Ciencia Ficción' },
  { id: 'myList', label: 'Mi Lista' },
  { id: 'stats', label: 'Estadísticas' },
];

export default function Navbar({
  onSearch,
  onOpenAddModal,
  activeTab,
  setActiveTab,
  myListCount = 0,
  backendConnected = false,
  profiles = [],
  activeProfile = null,
  onSwitchProfile,
  onManageProfiles,
  accountLabel,
  onOpenAccount,
  onLogout
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) onSearch('');
    setSearchOpen(false);
  };

  const goToTab = (tabId) => {
    setActiveTab(tabId);
    clearSearch();
    setMobileMenuOpen(false);
  };

  const isActiveTab = (tabId) => activeTab === tabId && (tabId !== 'home' || !searchQuery);

  const myListBadge = myListCount > 0 && (
    <span className="bg-[#E50914] text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
      {myListCount}
    </span>
  );

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-500 px-4 md:px-12 py-3 flex items-center justify-between ${
        isScrolled || mobileMenuOpen ? 'bg-[#141414]/95 shadow-xl backdrop-blur-md' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      <div className="flex items-center gap-3 xl:gap-8">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden text-gray-200 hover:text-white focus:outline-none"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobileNav"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* En móvil el logo cede su sitio al buscador mientras está abierto */}
        <button
          onClick={() => goToTab('home')}
          className={`${searchOpen ? 'hidden sm:flex' : 'flex'} items-center space-x-1 group focus:outline-none`}
        >
          <span className="brand-font text-3xl md:text-4xl text-[#E50914] tracking-wider font-extrabold group-hover:scale-105 transition-transform duration-200">
            SUKINEMA
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-[#E50914] text-white px-1.5 py-0.5 rounded ml-2">
            TRAILERS
          </span>
        </button>

        <ul className="hidden xl:flex items-center gap-5 text-sm font-medium text-gray-300">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <button
                onClick={() => goToTab(item.id)}
                className={`hover:text-white transition-colors flex items-center space-x-1 whitespace-nowrap ${isActiveTab(item.id) ? 'text-white font-bold' : ''}`}
              >
                <span>{item.label}</span>
                {item.id === 'myList' && myListBadge}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 md:gap-5 text-white">
        <div
          className="hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-black/40 border border-white/10 whitespace-nowrap"
          title={backendConnected ? "Conectado al backend Spring Boot" : "Usando catálogo inicial"}
        >
          <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-amber-400'}`}></span>
          <span className="hidden 2xl:inline text-gray-300 font-medium">
            {backendConnected ? 'Spring Boot 3 API' : 'Catálogo Local'}
          </span>
        </div>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className={`${searchOpen ? 'hidden sm:flex' : 'flex'} items-center space-x-1.5 bg-[#E50914] hover:bg-[#b80710] text-white text-xs md:text-sm font-semibold px-3 py-1.5 rounded transition-all transform active:scale-95 shadow-md shadow-red-950/40 whitespace-nowrap`}
            title="Agregar un nuevo tráiler con video de YouTube"
            aria-label="Nuevo Tráiler"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="hidden sm:inline">Nuevo Tráiler</span>
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div
            className={`flex items-center transition-all duration-300 ${
              searchOpen ? 'w-48 sm:w-64 bg-black/80 border border-white/40 px-2.5 py-1 rounded' : 'w-8 bg-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-gray-200 hover:text-white focus:outline-none"
              aria-label="Buscar"
            >
              <Search size={19} />
            </button>
            {searchOpen && (
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Títulos, actores, directores..."
                className="bg-transparent text-sm text-white focus:outline-none ml-2 w-full placeholder-gray-400"
                autoFocus
              />
            )}
            {searchOpen && searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-white"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center space-x-1 focus:outline-none group"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            aria-label={`Perfil: ${activeProfile?.name || 'sin seleccionar'}`}
          >
            <div className={`w-8 h-8 rounded bg-gradient-to-br ${activeProfile?.color || 'from-red-600 to-rose-700'} flex items-center justify-center text-white font-bold text-sm shadow`}>
              {activeProfile?.avatar || '🍿'}
            </div>
            <ChevronDown size={14} className={`text-gray-300 group-hover:text-white transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-56 bg-black/95 border border-white/15 rounded shadow-2xl py-2 text-sm"
            >
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (profile.id !== activeProfile?.id && onSwitchProfile) onSwitchProfile(profile);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-1.5 hover:bg-white/10 transition text-left ${
                    profile.id === activeProfile?.id ? 'text-white font-bold' : 'text-gray-300'
                  }`}
                >
                  <span className={`w-7 h-7 rounded bg-gradient-to-br ${profile.color} flex items-center justify-center text-sm flex-shrink-0`}>
                    {profile.avatar}
                  </span>
                  <span className="truncate flex-1">{profile.name}</span>
                  {profile.isKid && (
                    <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-600 text-white px-1 py-0.5 rounded">
                      Infantil
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-white/15 mt-2 pt-2">
                <button
                  role="menuitem"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (onManageProfiles) onManageProfiles();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition text-left"
                >
                  <Settings size={16} className="flex-shrink-0" />
                  <span>Administrar perfiles</span>
                </button>
                {onOpenAccount && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenAccount();
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition text-left"
                  >
                    <UserRound size={16} className="flex-shrink-0" />
                    <span>Mi cuenta</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 transition text-left"
                  >
                    <LogOut size={16} className="flex-shrink-0" />
                    <span>Cerrar sesión</span>
                  </button>
                )}
              </div>
              {accountLabel && (
                <p className="px-3 pt-2 mt-2 border-t border-white/15 text-[11px] text-gray-500 truncate" title={accountLabel}>
                  {accountLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobileNav"
          className="xl:hidden absolute top-full left-0 right-0 bg-[#141414] border-t border-white/10 shadow-2xl"
        >
          <ul className="px-4 py-1 text-sm font-medium text-gray-300 divide-y divide-white/5">
            {NAV_ITEMS.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => goToTab(item.id)}
                  className={`w-full flex items-center justify-between py-3 hover:text-white transition-colors text-left ${isActiveTab(item.id) ? 'text-white font-bold' : ''}`}
                  aria-current={isActiveTab(item.id) ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {item.id === 'myList' && myListBadge}
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-3 border-t border-white/10 flex items-center space-x-1.5 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-amber-400'}`}></span>
            <span>{backendConnected ? 'Spring Boot 3 API' : 'Catálogo Local'}</span>
          </div>
        </div>
      )}
    </nav>
  );
}

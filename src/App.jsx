import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import AuthScreen from './components/AuthScreen';
import RecoveryCodeNotice from './components/RecoveryCode';
import AccountModal from './components/AccountModal';
import ProfileSelector from './components/ProfileSelector';
import LoadingScreen from './components/LoadingScreen';
import HeroBanner from './components/HeroBanner';
import MovieRow from './components/MovieRow';
import MovieCard from './components/MovieCard';
import TrailerModal from './components/TrailerModal';
import AddMovieModal from './components/AddMovieModal';
import EditMovieModal from './components/EditMovieModal';
import StatsPanel from './components/StatsPanel';
import ToastContainer, { showToast } from './components/ToastContainer';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import { AuthAPI, MovieAPI, ProfileAPI, Session, FALLBACK_PROFILES } from './services/api';
import { FALLBACK_MOVIES, getFallbackCategories } from './data/fallbackData';
import { CATEGORIES } from './constants/catalog';
import { extractYoutubeId } from './utils/youtube';
import { MIN_SEARCH_LENGTH, searchWords, movieWords, matchesWords } from './utils/search';
import { useI18n } from './i18n';
import { localizeMovie, localizeTerm, rawMovie, canonicalTerms } from './i18n/content';

const ACTIVE_PROFILE_KEY = 'sukinema_active_profile';
// Modo demo: la lista y los likes viven en el navegador, con claves propias para no mezclarse con los de una cuenta
const myListKey = (profileId) => `sukinema_demo_my_list_${profileId}`;
const likesKey = (profileId) => `sukinema_demo_likes_${profileId}`;
// Claves que usaba el navegador antes de que la lista se guardara en el servidor
const legacyMyListKey = (profileId) => `sukinema_my_list_${profileId}`;
const legacyLikesKey = (profileId) => `sukinema_likes_${profileId}`;

const readIdSet = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
};

const writeIdSet = (key, idSet) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(idSet)));
  } catch (e) {
    console.error(e);
  }
};

const readStored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error(e);
    return null;
  }
};

const removeStored = (...keys) => {
  try {
    keys.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error(e);
  }
};

// Perfil infantil: solo títulos sin restricción de edad o hasta +12
const isKidSafe = (movie) => {
  const age = parseInt(String(movie.ageRating || '').replace(/\D/g, ''), 10);
  return Number.isNaN(age) || age <= 12;
};

export default function App() {
  const { t, lang } = useI18n();

  const [account, setAccount] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(Session.hasToken());
  const [serverDown, setServerDown] = useState(false);
  // Código de recuperación recién emitido: se enseña una sola vez antes de seguir
  const [pendingRecoveryCode, setPendingRecoveryCode] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // El catálogo se guarda tal como llega del servidor; se traduce al pintarlo (ver `display`)
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [categories, setCategories] = useState({});
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [movieToEdit, setMovieToEdit] = useState(null);

  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [profiles, setProfiles] = useState([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isProfileSelectorOpen, setIsProfileSelectorOpen] = useState(false);

  // Mi Lista y likes de cada perfil: con cuenta se guardan en el servidor; en modo demo, en el navegador
  const [myListIds, setMyListIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set());

  // Los manejadores creados en el primer render (p. ej. el de sesión caducada) traducen con el idioma actual
  const tRef = useRef(t);
  tRef.current = t;

  const display = (movie) => localizeMovie(movie, lang);

  useEffect(() => {
    if (!activeProfile) return;
    const profileId = activeProfile.id;

    if (demoMode) {
      setMyListIds(readIdSet(myListKey(profileId)) || new Set());
      setLikedIds(readIdSet(likesKey(profileId)) || new Set());
      return;
    }

    // Vacías mientras llega la respuesta, para no mostrar la lista del perfil anterior
    let cancelled = false;
    setMyListIds(new Set());
    setLikedIds(new Set());
    (async () => {
      try {
        const library = await ProfileAPI.getLibrary(profileId);
        const myList = new Set(library.myList);
        // Traspaso único de la lista que este navegador guardaba antes de que existiera en el servidor
        const legacyList = readIdSet(legacyMyListKey(profileId));
        if (legacyList) {
          for (const movieId of legacyList) {
            if (myList.has(movieId)) continue;
            try {
              await ProfileAPI.addToMyList(profileId, movieId);
              myList.add(movieId);
            } catch {
              // el tráiler ya no existe: no se traspasa
            }
          }
        }
        removeStored(legacyMyListKey(profileId), legacyLikesKey(profileId));
        if (!cancelled) {
          setMyListIds(myList);
          setLikedIds(new Set(library.likes));
        }
      } catch (err) {
        if (!cancelled && err.status !== 401) showToast(tRef.current('toast.listLoadError'), 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [activeProfile?.id, demoMode]);

  const withToggled = (idSet, id, present) => {
    const next = new Set(idSet);
    if (present) next.add(id); else next.delete(id);
    return next;
  };

  const handleToggleMyList = async (movie) => {
    const wasSaved = myListIds.has(movie.id);
    const profileId = activeProfile.id;
    // Se refleja al momento; si el servidor lo rechaza, se deshace
    setMyListIds(prev => {
      const next = withToggled(prev, movie.id, !wasSaved);
      if (demoMode) writeIdSet(myListKey(profileId), next);
      return next;
    });
    if (!demoMode) {
      try {
        if (wasSaved) await ProfileAPI.removeFromMyList(profileId, movie.id);
        else await ProfileAPI.addToMyList(profileId, movie.id);
      } catch (err) {
        setMyListIds(prev => withToggled(prev, movie.id, wasSaved));
        if (err.status !== 401) showToast(err.message || t('toast.listUpdateError'), 'error');
        return;
      }
    }
    showToast(
      t(wasSaved ? 'toast.removedFromList' : 'toast.addedToList', { title: movie.title }),
      wasSaved ? 'info' : 'success'
    );
  };

  const showLocalCatalog = () => {
    setCategories(getFallbackCategories());
    setAllMovies(FALLBACK_MOVIES);
    setFeaturedMovie(FALLBACK_MOVIES[0]);
    setBackendConnected(false);
  };

  // Las lecturas del catálogo no lanzan: si el servidor no responde, se usa el catálogo local
  const loadData = async () => {
    setLoading(true);
    const [feat, cats, all] = await Promise.all([
      MovieAPI.getFeatured(),
      MovieAPI.getCategories(),
      MovieAPI.getAll()
    ]);
    if (cats && Object.keys(cats).length > 0 && all.length > 0) {
      setCategories(cats);
      setAllMovies(all);
      setFeaturedMovie(feat || all[0]);
      setBackendConnected(true);
    } else {
      showLocalCatalog();
    }
    setLoading(false);
  };

  const restoreActiveProfile = (list) => {
    const savedId = readStored(ACTIVE_PROFILE_KEY);
    setActiveProfile(list.find(p => String(p.id) === savedId) || null);
  };

  const loadProfiles = async () => {
    try {
      const list = await ProfileAPI.getAll();
      setProfiles(list);
      restoreActiveProfile(list);
    } catch (err) {
      setProfiles([]);
      if (err.status !== 401) showToast(tRef.current('toast.profilesLoadError'), 'error');
    } finally {
      setProfilesLoaded(true);
    }
  };

  const startSession = (sessionAccount) => {
    setAccount(sessionAccount);
    setDemoMode(false);
    setServerDown(false);
    loadData();
    loadProfiles();
  };

  const clearSessionState = () => {
    Session.clear();
    removeStored(ACTIVE_PROFILE_KEY);
    setAccount(null);
    setDemoMode(false);
    setActiveProfile(null);
    setProfiles([]);
    setProfilesLoaded(false);
    setIsProfileSelectorOpen(false);
    setIsTrailerModalOpen(false);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsAccountModalOpen(false);
    setPendingRecoveryCode(null);
    setSelectedMovie(null);
    setActiveTab('home');
    setSearchQuery('');
  };

  useEffect(() => {
    Session.onExpired(() => {
      clearSessionState();
      showToast(tRef.current('toast.sessionExpired'), 'warning');
    });

    if (Session.hasToken()) {
      AuthAPI.me()
        .then(startSession)
        .catch((err) => {
          // Un 401 ya lo ha gestionado Session.onExpired
          if (err.status === 0) setServerDown(true);
        })
        .finally(() => setCheckingSession(false));
    } else {
      // Sin sesión guardada: se llama al servidor para irlo despertando mientras se escribe
      AuthAPI.ping().catch((err) => {
        if (err.status === 0) setServerDown(true);
      });
    }

    return () => Session.onExpired(null);
  }, []);

  const handleLogin = async (email, password) => {
    const sessionAccount = await AuthAPI.login(email, password);
    startSession(sessionAccount);
    showToast(t('toast.welcomeBack', { name: sessionAccount.name }), 'success');
  };

  const handleRegister = async (name, email, password) => {
    const { account: sessionAccount, recoveryCode } = await AuthAPI.register(name, email, password);
    setPendingRecoveryCode(recoveryCode);
    startSession(sessionAccount);
    showToast(t('toast.accountCreated', { name: sessionAccount.name }), 'success');
  };

  const handleRecover = async (email, recoveryCode, newPassword) => {
    const { account: sessionAccount, recoveryCode: newRecoveryCode } = await AuthAPI.recover(email, recoveryCode, newPassword);
    setPendingRecoveryCode(newRecoveryCode);
    startSession(sessionAccount);
    showToast(t('toast.passwordReset'), 'success');
  };

  // Los errores suben al formulario de "Mi cuenta", que muestra el motivo
  const handleChangePassword = async (currentPassword, newPassword) => {
    setAccount(await AuthAPI.changePassword(currentPassword, newPassword));
    showToast(t('toast.passwordChanged'), 'success');
  };

  const handleEnterDemo = () => {
    setDemoMode(true);
    showLocalCatalog();
    setLoading(false);
    setProfiles(FALLBACK_PROFILES);
    restoreActiveProfile(FALLBACK_PROFILES);
    setProfilesLoaded(true);
    showToast(t('toast.demo'), 'info');
  };

  const handleLogout = () => {
    const wasDemo = demoMode;
    clearSessionState();
    showToast(t(wasDemo ? 'toast.leftDemo' : 'toast.loggedOut'), 'info');
  };

  const handleSelectProfile = (profile) => {
    if (profile.id !== activeProfile?.id) {
      showToast(t('toast.viewingAs', { name: profile.name, avatar: profile.avatar }), 'info');
    }
    setActiveProfile(profile);
    setIsProfileSelectorOpen(false);
    setActiveTab('home');
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, String(profile.id));
    } catch (e) {
      console.error(e);
    }
  };

  // Los errores de crear y editar se dejan subir: el formulario de perfil muestra el motivo
  const handleCreateProfile = async (profileData) => {
    const created = demoMode
      ? { ...profileData, id: Date.now() }
      : await ProfileAPI.create(profileData);
    if (demoMode) {
      // Un perfil nuevo empieza con su lista y sus likes vacíos
      writeIdSet(myListKey(created.id), new Set());
      writeIdSet(likesKey(created.id), new Set());
    }
    setProfiles(prev => [...prev, created]);
    showToast(t('toast.profileCreated', { name: created.name }), 'success');
  };

  const handleUpdateProfile = async (id, profileData) => {
    const updated = demoMode
      ? { ...profiles.find(p => p.id === id), ...profileData }
      : await ProfileAPI.update(id, profileData);
    setProfiles(prev => prev.map(p => p.id === id ? updated : p));
    if (activeProfile?.id === id) {
      setActiveProfile(updated);
    }
    showToast(t('toast.profileUpdated', { name: updated.name }), 'success');
  };

  const handleDeleteProfile = async (profile) => {
    if (!demoMode) {
      try {
        await ProfileAPI.delete(profile.id);
      } catch (err) {
        showToast(err.message || t('toast.profileDeleteError'), 'error');
        return;
      }
    }
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    removeStored(myListKey(profile.id), likesKey(profile.id), legacyMyListKey(profile.id), legacyLikesKey(profile.id));
    if (activeProfile?.id === profile.id) {
      removeStored(ACTIVE_PROFILE_KEY);
      setActiveProfile(null);
    }
    showToast(t('toast.profileDeleted', { name: profile.name }), 'info');
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    window.scrollTo({ top: 0 });
  };

  const handleExploreCategory = (category) => {
    setSelectedCategory(category);
    changeTab('category');
  };

  // Los componentes reciben tráilers traducidos; en el estado se guarda siempre el original
  const handleOpenMovie = (movie) => {
    setSelectedMovie(rawMovie(movie));
    setIsTrailerModalOpen(true);
  };

  const handleCloseTrailerModal = () => {
    setIsTrailerModalOpen(false);
  };

  // Si el guardado falla, el error sube al formulario, que sigue abierto con lo escrito
  const handleMovieAdded = async (newMovieData) => {
    if (backendConnected) {
      const created = await MovieAPI.create(newMovieData);
      await loadData();
      showToast(t('toast.addedToCatalog', { title: created.title }), 'success');
      setSelectedMovie(created);
      setIsTrailerModalOpen(true);
    } else {
      const mockNew = {
        ...newMovieData,
        id: Date.now(),
        likes: 0,
        youtubeId: extractYoutubeId(newMovieData.trailerUrl),
      };
      setAllMovies(prev => [mockNew, ...prev]);
      setCategories(prev => {
        const cat = mockNew.category || 'Tendencias Ahora';
        return { ...prev, [cat]: [mockNew, ...(prev[cat] || [])] };
      });
      showToast(t('toast.addedLocally', { title: mockNew.title }), 'info');
      setSelectedMovie(mockNew);
      setIsTrailerModalOpen(true);
    }
  };

  // Se edita el texto guardado, no su traducción
  const handleOpenEdit = (movie) => {
    setMovieToEdit(rawMovie(movie));
    setIsTrailerModalOpen(false);
    setTimeout(() => setIsEditModalOpen(true), 150);
  };

  const applyMovieUpdate = (updated) => {
    const replace = (list) => list.map(m => m.id === updated.id ? updated : m);
    setAllMovies(replace);
    setCategories(prev => {
      const newCats = {};
      for (const [cat, list] of Object.entries(prev)) {
        newCats[cat] = replace(list);
      }
      return newCats;
    });
    setFeaturedMovie(prev => prev?.id === updated.id ? updated : prev);
    setSelectedMovie(prev => prev?.id === updated.id ? updated : prev);
  };

  const handleMovieUpdated = async (id, updatedData) => {
    if (backendConnected) {
      const updated = await MovieAPI.update(id, updatedData);
      await loadData();
      showToast(t('toast.updated', { title: updated.title }), 'success');
      setSelectedMovie(updated);
    } else {
      const updated = { ...movieToEdit, ...updatedData, youtubeId: extractYoutubeId(updatedData.trailerUrl) };
      applyMovieUpdate(updated);
      showToast(t('toast.updatedLocally', { title: updated.title }), 'info');
      setSelectedMovie(updated);
    }
  };

  const handleLikeMovie = async (movie) => {
    const source = rawMovie(movie);
    const wasLiked = likedIds.has(source.id);
    const profileId = activeProfile.id;
    let updated;
    if (demoMode) {
      updated = { ...source, likes: Math.max(0, (source.likes || 0) + (wasLiked ? -1 : 1)) };
    } else {
      try {
        updated = wasLiked
          ? await ProfileAPI.unlike(profileId, source.id)
          : await ProfileAPI.like(profileId, source.id);
      } catch (err) {
        if (err.status !== 401) showToast(err.message || t('toast.likeError'), 'error');
        return;
      }
    }
    applyMovieUpdate(updated);
    setLikedIds(prev => {
      const next = withToggled(prev, source.id, !wasLiked);
      if (demoMode) writeIdSet(likesKey(profileId), next);
      return next;
    });
    showToast(t(wasLiked ? 'toast.unliked' : 'toast.liked', { title: movie.title }), wasLiked ? 'info' : 'success');
  };

  const handleDeleteMovie = async (movie) => {
    const deletedId = movie.id;
    if (backendConnected) {
      try {
        await MovieAPI.delete(deletedId);
      } catch (err) {
        showToast(err.message || t('toast.deleteError'), 'error');
        return;
      }
    }
    setIsTrailerModalOpen(false);
    setAllMovies(prev => prev.filter(m => m.id !== deletedId));
    setCategories(prev => {
      const newCats = {};
      for (const [cat, list] of Object.entries(prev)) {
        const filtered = list.filter(m => m.id !== deletedId);
        if (filtered.length > 0) newCats[cat] = filtered;
      }
      return newCats;
    });
    setMyListIds(prev => withToggled(prev, deletedId, false));
    setLikedIds(prev => withToggled(prev, deletedId, false));
    if (featuredMovie?.id === deletedId) {
      setFeaturedMovie(allMovies.find(m => m.id !== deletedId) || null);
    }
    showToast(t('toast.deleted', { title: movie.title }), 'info');
  };

  const isKid = !!activeProfile?.isKid;
  // El catálogo lo gestiona la cuenta administradora (en modo demo, los cambios son solo locales)
  const canManage = !isKid && (demoMode || account?.role === 'ADMIN');

  // Tráilers visibles tal como están guardados: sobre ellos se filtra
  const sourceMovies = useMemo(
    () => (isKid ? allMovies.filter(isKidSafe) : allMovies),
    [allMovies, isKid]
  );

  const visibleMovies = useMemo(
    () => sourceMovies.map(movie => localizeMovie(movie, lang)),
    [sourceMovies, lang]
  );

  const visibleCategories = useMemo(() => {
    if (!isKid) return categories;
    const safeCats = {};
    for (const [cat, list] of Object.entries(categories)) {
      const safe = list.filter(isKidSafe);
      if (safe.length > 0) safeCats[cat] = safe;
    }
    return safeCats;
  }, [categories, isKid]);

  // Categorías que ofrecen los formularios: las habituales más las que ya existan en el catálogo
  const categoryOptions = useMemo(
    () => [...new Set([...CATEGORIES, ...allMovies.map(m => m.category).filter(Boolean)])],
    [allMovies]
  );

  const sourceFeatured = isKid && !(featuredMovie && isKidSafe(featuredMovie))
    ? (sourceMovies[0] || null)
    : featuredMovie;
  const visibleFeatured = sourceFeatured ? display(sourceFeatured) : null;

  // La búsqueda mira el texto traducido y también el original
  const searchTerm = searchQuery.trim();
  const queryWords = useMemo(() => searchWords(searchQuery), [searchQuery]);
  const searchIndex = useMemo(
    () => visibleMovies.map(movie => ({ movie, words: movieWords(movie, rawMovie(movie)) })),
    [visibleMovies]
  );
  const visibleSearchResults = useMemo(
    () => (queryWords.length > 0
      ? searchIndex.filter(entry => matchesWords(entry.words, queryWords)).map(entry => entry.movie)
      : []),
    [searchIndex, queryWords]
  );

  const myListCount = visibleMovies.filter(m => myListIds.has(m.id)).length;

  // Los filtros de sección comparan en castellano, se haya escrito el tráiler en el idioma que sea
  const getTabFilteredMovies = () => {
    const bySection = (predicate) => sourceMovies.filter(m => predicate(m, canonicalTerms(m))).map(display);
    if (activeTab === 'tendencias') {
      return bySection((m, { category }) => m.trending || category.includes('Tendencias'));
    }
    if (activeTab === 'anime') {
      return bySection((m, { category, genres }) => category.includes('Anime') || genres.includes('Animación') || genres.includes('Anime'));
    }
    if (activeTab === 'scifi') {
      return bySection((m, { category, genres }) => category.includes('Ciencia Ficción') || genres.includes('Ciencia ficción'));
    }
    if (activeTab === 'myList') {
      return visibleMovies.filter(m => myListIds.has(m.id));
    }
    if (activeTab === 'category') {
      return (visibleCategories[selectedCategory] || []).map(display);
    }
    return [];
  };

  const TAB_LABELS = {
    tendencias: t('app.tab.trending'),
    anime: t('app.tab.anime'),
    scifi: t('app.tab.scifi'),
    myList: t('app.tab.myList'),
    stats: t('app.tab.stats'),
    category: localizeTerm(selectedCategory, lang),
  };

  const accountLabel = demoMode ? t('app.demoMode') : account?.email;

  // Pantallas previas al catálogo. La key mantiene vivo el ToastContainer al pasar de una a otra.
  let gate = null;
  if (checkingSession) {
    gate = <LoadingScreen />;
  } else if (!account && !demoMode) {
    gate = (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
        onRecover={handleRecover}
        serverDown={serverDown}
        onEnterDemo={handleEnterDemo}
      />
    );
  } else if (pendingRecoveryCode) {
    gate = <RecoveryCodeNotice code={pendingRecoveryCode} onDone={() => setPendingRecoveryCode(null)} />;
  } else if (!profilesLoaded) {
    gate = <LoadingScreen />;
  }

  if (gate) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        {gate}
        <ToastContainer key="toasts" />
      </div>
    );
  }

  const profileSelector = (
    <ProfileSelector
      profiles={profiles}
      activeProfileId={activeProfile?.id}
      onSelect={handleSelectProfile}
      onCreate={handleCreateProfile}
      onUpdate={handleUpdateProfile}
      onDelete={handleDeleteProfile}
      onClose={activeProfile ? () => setIsProfileSelectorOpen(false) : undefined}
      onLogout={handleLogout}
      accountLabel={accountLabel}
    />
  );

  // Sin perfil activo no se monta el catálogo (evita que el banner reproduzca el tráiler de fondo).
  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        {profileSelector}
        <ToastContainer key="toasts" />
      </div>
    );
  }

  const tabMovies = getTabFilteredMovies();
  const shownMovie = selectedMovie ? display(selectedMovie) : null;
  const isAnyOverlayOpen = isTrailerModalOpen || isAddModalOpen || isEditModalOpen || isProfileSelectorOpen || isAccountModalOpen;

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white">
      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onOpenAddModal={canManage ? () => setIsAddModalOpen(true) : undefined}
        activeTab={activeTab}
        setActiveTab={changeTab}
        myListCount={myListCount}
        backendConnected={backendConnected}
        profiles={profiles}
        activeProfile={activeProfile}
        onSwitchProfile={handleSelectProfile}
        onManageProfiles={() => setIsProfileSelectorOpen(true)}
        accountLabel={accountLabel}
        onOpenAccount={demoMode ? undefined : () => setIsAccountModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {searchTerm ? (
          <div className="pt-24 px-4 md:px-12 space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-200">
              {t('app.search.resultsFor')} <span className="text-white font-extrabold">"{searchQuery}"</span>
              {queryWords.length > 0 && (
                <span className="text-xs text-gray-400 font-normal ml-3">
                  {t('app.search.found', { count: visibleSearchResults.length })}
                </span>
              )}
            </h1>
            {queryWords.length === 0 ? (
              <p className="py-20 text-center text-gray-400 text-lg">
                {t('app.search.minChars', { min: MIN_SEARCH_LENGTH })}
              </p>
            ) : visibleSearchResults.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <p className="text-gray-400 text-lg">{t('app.search.none')}</p>
                {canManage && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#E50914] text-white px-5 py-2 rounded font-semibold text-sm hover:bg-red-700 transition"
                  >
                    {t('app.search.addThis')}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[384px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleSearchResults.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlayTrailer={handleOpenMovie}
                    onOpenDetails={handleOpenMovie}
                    isSaved={myListIds.has(movie.id)}
                    onToggleMyList={handleToggleMyList}
                    isLiked={likedIds.has(movie.id)}
                    onLikeMovie={handleLikeMovie}
                    fluid
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'stats' ? (
          <div className="pt-24 px-4 md:px-12 pb-12 space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {TAB_LABELS.stats}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {t(backendConnected ? 'app.stats.live' : 'app.stats.local')}
              </p>
            </div>
            <StatsPanel movies={visibleMovies} myListCount={myListCount} loading={loading} />
          </div>
        ) : activeTab !== 'home' ? (
          <div className="pt-24 px-4 md:px-12 space-y-6 min-h-[60vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {TAB_LABELS[activeTab] || activeTab}
              </h1>
              {activeTab === 'myList' && (
                <span className="text-xs text-gray-400">{t('app.savedCount', { count: tabMovies.length })}</span>
              )}
            </div>
            {tabMovies.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-gray-400 text-base">
                  {t(activeTab === 'myList' ? 'app.emptyList' : 'app.emptySection')}
                </p>
                <button
                  onClick={() => changeTab('home')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm font-semibold transition"
                >
                  {t('app.exploreCatalog')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[384px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tabMovies.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlayTrailer={handleOpenMovie}
                    onOpenDetails={handleOpenMovie}
                    isSaved={myListIds.has(movie.id)}
                    onToggleMyList={handleToggleMyList}
                    isLiked={likedIds.has(movie.id)}
                    onLikeMovie={handleLikeMovie}
                    fluid
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <HeroBanner
              movie={visibleFeatured}
              loading={loading}
              paused={isAnyOverlayOpen}
              onPlayTrailer={handleOpenMovie}
              onOpenDetails={handleOpenMovie}
            />
            <div className="relative -mt-16 md:-mt-28 z-20 space-y-4 md:space-y-6">
              {Object.entries(visibleCategories).map(([categoryKey, moviesList]) => (
                <MovieRow
                  key={categoryKey}
                  title={localizeTerm(categoryKey, lang)}
                  categoryKey={categoryKey}
                  movies={moviesList.map(display)}
                  onPlayTrailer={handleOpenMovie}
                  onOpenDetails={handleOpenMovie}
                  myListIds={myListIds}
                  onToggleMyList={handleToggleMyList}
                  likedIds={likedIds}
                  onLikeMovie={handleLikeMovie}
                  onExplore={handleExploreCategory}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <TrailerModal
        movie={shownMovie}
        isOpen={isTrailerModalOpen}
        onClose={handleCloseTrailerModal}
        allMovies={visibleMovies}
        onSelectMovie={(movie) => setSelectedMovie(rawMovie(movie))}
        isSaved={selectedMovie ? myListIds.has(selectedMovie.id) : false}
        onToggleMyList={handleToggleMyList}
        isLiked={selectedMovie ? likedIds.has(selectedMovie.id) : false}
        onLikeMovie={handleLikeMovie}
        onEditMovie={backendConnected && canManage ? handleOpenEdit : undefined}
        onDeleteMovie={backendConnected && canManage ? handleDeleteMovie : undefined}
      />

      <AddMovieModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMovieAdded={handleMovieAdded}
        categories={categoryOptions}
      />

      <EditMovieModal
        movie={movieToEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          // selectedMovie sigue siendo el tráiler editado (ya actualizado si se guardó)
          setIsEditModalOpen(false);
          setTimeout(() => setIsTrailerModalOpen(true), 100);
        }}
        onMovieUpdated={handleMovieUpdated}
        categories={categoryOptions}
      />

      <AccountModal
        account={account}
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onChangePassword={handleChangePassword}
        onNewRecoveryCode={AuthAPI.newRecoveryCode}
      />

      {isProfileSelectorOpen && profileSelector}

      <ToastContainer key="toasts" />
      <ScrollToTop />

      <Footer onNavigate={changeTab} />
    </div>
  );
}

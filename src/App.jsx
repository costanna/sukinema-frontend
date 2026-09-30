import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
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
import { MovieAPI, ProfileAPI } from './services/api';
import { FALLBACK_MOVIES, getFallbackCategories } from './data/fallbackData';

const ACTIVE_PROFILE_KEY = 'sukinema_active_profile';
const LEGACY_MY_LIST_KEY = 'sukinema_my_list';
const myListKey = (profileId) => `sukinema_my_list_${profileId}`;
const likesKey = (profileId) => `sukinema_likes_${profileId}`;

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

// Perfil infantil: solo títulos sin restricción de edad o hasta +12
const isKidSafe = (movie) => {
  const age = parseInt(String(movie.ageRating || '').replace(/\D/g, ''), 10);
  return Number.isNaN(age) || age <= 12;
};

export default function App() {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isProfileSelectorOpen, setIsProfileSelectorOpen] = useState(false);

  // Mi Lista y likes se guardan por perfil
  const [myListIds, setMyListIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    if (!activeProfile) return;
    setMyListIds(
      readIdSet(myListKey(activeProfile.id)) || readIdSet(LEGACY_MY_LIST_KEY) || new Set([1, 4])
    );
    setLikedIds(readIdSet(likesKey(activeProfile.id)) || new Set());
  }, [activeProfile?.id]);

  const saveMyList = (newSet) => {
    setMyListIds(newSet);
    writeIdSet(myListKey(activeProfile.id), newSet);
  };

  const handleToggleMyList = (movie) => {
    const newSet = new Set(myListIds);
    if (newSet.has(movie.id)) {
      newSet.delete(movie.id);
      showToast(`"${movie.title}" eliminado de Mi Lista`, 'info');
    } else {
      newSet.add(movie.id);
      showToast(`"${movie.title}" añadido a Mi Lista ✓`, 'success');
    }
    saveMyList(newSet);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [feat, cats, all] = await Promise.all([
        MovieAPI.getFeatured(),
        MovieAPI.getCategories(),
        MovieAPI.getAll()
      ]);

      if (cats && Object.keys(cats).length > 0 && all && all.length > 0) {
        setCategories(cats);
        setAllMovies(all);
        setFeaturedMovie(feat || all[0]);
        setBackendConnected(true);
      } else {
        setCategories(getFallbackCategories());
        setAllMovies(FALLBACK_MOVIES);
        setFeaturedMovie(FALLBACK_MOVIES[0]);
        setBackendConnected(false);
      }
    } catch (err) {
      console.warn('Usando catálogo inicial por desconexión del backend:', err);
      setCategories(getFallbackCategories());
      setAllMovies(FALLBACK_MOVIES);
      setFeaturedMovie(FALLBACK_MOVIES[0]);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    const list = await ProfileAPI.getAll();
    setProfiles(list);
    let savedId = null;
    try {
      savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    } catch (e) {
      console.error(e);
    }
    setActiveProfile(list.find(p => String(p.id) === savedId) || null);
    setProfilesLoaded(true);
  };

  useEffect(() => {
    loadData();
    loadProfiles();
  }, []);

  // Profile handlers
  const handleSelectProfile = (profile) => {
    if (profile.id !== activeProfile?.id) {
      showToast(`Viendo como ${profile.name} ${profile.avatar}`, 'info');
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

  const handleCreateProfile = async (profileData) => {
    const created = await ProfileAPI.create(profileData);
    // Un perfil nuevo empieza con su lista y sus likes vacíos
    writeIdSet(myListKey(created.id), new Set());
    writeIdSet(likesKey(created.id), new Set());
    setProfiles(prev => [...prev, created]);
    showToast(`Perfil "${created.name}" creado ✓`, 'success');
  };

  const handleUpdateProfile = async (id, profileData) => {
    const updated = await ProfileAPI.update(id, profileData);
    setProfiles(prev => prev.map(p => p.id === id ? updated : p));
    if (activeProfile?.id === id) {
      setActiveProfile(updated);
    }
    showToast(`Perfil "${updated.name}" actualizado ✓`, 'success');
  };

  const handleDeleteProfile = async (profile) => {
    const ok = await ProfileAPI.delete(profile.id);
    if (!ok) {
      showToast('No se pudo eliminar el perfil', 'error');
      return;
    }
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    try {
      localStorage.removeItem(myListKey(profile.id));
      localStorage.removeItem(likesKey(profile.id));
      if (activeProfile?.id === profile.id) {
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }
    } catch (e) {
      console.error(e);
    }
    if (activeProfile?.id === profile.id) {
      setActiveProfile(null);
    }
    showToast(`Perfil "${profile.name}" eliminado`, 'info');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (backendConnected) {
      const results = await MovieAPI.search(query);
      setSearchResults(results);
    } else {
      const lower = query.toLowerCase();
      const filtered = allMovies.filter(m =>
        m.title.toLowerCase().includes(lower) ||
        (m.genres && m.genres.toLowerCase().includes(lower)) ||
        (m.cast && m.cast.toLowerCase().includes(lower)) ||
        (m.category && m.category.toLowerCase().includes(lower))
      );
      setSearchResults(filtered);
    }
  };

  const handlePlayTrailer = (movie) => {
    setSelectedMovie(movie);
    setIsTrailerModalOpen(true);
  };

  const handleOpenDetails = (movie) => {
    setSelectedMovie(movie);
    setIsTrailerModalOpen(true);
  };

  const handleCloseTrailerModal = () => {
    setIsTrailerModalOpen(false);
  };

  const handleMovieAdded = async (newMovieData) => {
    if (backendConnected) {
      try {
        const created = await MovieAPI.create(newMovieData);
        await loadData();
        showToast(`"${created.title}" añadido al catálogo 🎬`, 'success');
        setSelectedMovie(created);
        setIsTrailerModalOpen(true);
      } catch (err) {
        showToast('Error al guardar el tráiler', 'error');
      }
    } else {
      const mockNew = {
        ...newMovieData,
        id: Date.now(),
        likes: 0,
        youtubeId: newMovieData.trailerUrl,
      };
      setAllMovies(prev => [mockNew, ...prev]);
      setCategories(prev => {
        const cat = mockNew.category || 'Tendencias Ahora';
        return { ...prev, [cat]: [mockNew, ...(prev[cat] || [])] };
      });
      showToast(`"${mockNew.title}" añadido localmente`, 'info');
      setSelectedMovie(mockNew);
      setIsTrailerModalOpen(true);
    }
  };

  // Edit handlers
  const handleOpenEdit = (movie) => {
    setMovieToEdit(movie);
    setIsTrailerModalOpen(false);
    setTimeout(() => setIsEditModalOpen(true), 150);
  };

  // Reemplaza un tráiler en todas las vistas que lo muestran
  const applyMovieUpdate = (updated) => {
    setAllMovies(prev => prev.map(m => m.id === updated.id ? updated : m));
    setCategories(prev => {
      const newCats = {};
      for (const [cat, list] of Object.entries(prev)) {
        newCats[cat] = list.map(m => m.id === updated.id ? updated : m);
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
      showToast(`"${updated.title}" actualizado correctamente ✓`, 'success');
      setSelectedMovie(updated);
    } else {
      const updated = { ...movieToEdit, ...updatedData };
      applyMovieUpdate(updated);
      showToast(`"${updated.title}" actualizado localmente`, 'info');
      setSelectedMovie(updated);
    }
  };

  // Like handler
  const handleLikeMovie = async (movie) => {
    if (likedIds.has(movie.id)) {
      showToast(`Ya te gusta "${movie.title}"`, 'info');
      return;
    }
    let updated = { ...movie, likes: (movie.likes || 0) + 1 };
    if (backendConnected) {
      const saved = await MovieAPI.like(movie.id);
      if (!saved) {
        showToast('No se pudo registrar el like', 'error');
        return;
      }
      updated = saved;
    }
    applyMovieUpdate(updated);
    const newSet = new Set(likedIds);
    newSet.add(movie.id);
    setLikedIds(newSet);
    writeIdSet(likesKey(activeProfile.id), newSet);
    showToast(`Te gusta "${movie.title}" 👍`, 'success');
  };

  // Delete handler
  const handleDeleteMovie = async (movie) => {
    const deletedId = movie.id;
    if (backendConnected) {
      try {
        await MovieAPI.delete(deletedId);
      } catch (err) {
        showToast('Error al eliminar el tráiler', 'error');
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
    if (myListIds.has(deletedId)) {
      const newSet = new Set(myListIds);
      newSet.delete(deletedId);
      saveMyList(newSet);
    }
    if (featuredMovie?.id === deletedId) {
      setFeaturedMovie(allMovies.find(m => m.id !== deletedId) || null);
    }
    showToast(`"${movie.title}" eliminado del catálogo`, 'info');
  };

  // Lo que ve el perfil activo: el infantil solo recibe títulos aptos
  const isKid = !!activeProfile?.isKid;
  const canManage = !isKid;

  const visibleMovies = useMemo(
    () => (isKid ? allMovies.filter(isKidSafe) : allMovies),
    [allMovies, isKid]
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

  const visibleFeatured = isKid && !(featuredMovie && isKidSafe(featuredMovie))
    ? (visibleMovies[0] || null)
    : featuredMovie;

  const visibleSearchResults = isKid ? searchResults.filter(isKidSafe) : searchResults;

  const myListCount = visibleMovies.filter(m => myListIds.has(m.id)).length;

  const getTabFilteredMovies = () => {
    if (activeTab === 'tendencias') {
      return visibleMovies.filter(m => m.trending || m.category?.includes('Tendencias'));
    }
    if (activeTab === 'anime') {
      return visibleMovies.filter(m => m.category?.includes('Anime') || m.genres?.includes('Animación') || m.genres?.includes('Anime'));
    }
    if (activeTab === 'scifi') {
      return visibleMovies.filter(m => m.category?.includes('Ciencia Ficción') || m.genres?.includes('Ciencia ficción'));
    }
    if (activeTab === 'myList') {
      return visibleMovies.filter(m => myListIds.has(m.id));
    }
    return [];
  };

  const TAB_LABELS = {
    tendencias: '🔥 Tendencias en Tráilers',
    anime: '⚡ Anime & Animación',
    scifi: '🚀 Ciencia Ficción & Fantasía',
    myList: '📌 Mi Lista de Tráilers',
    stats: '📊 Estadísticas',
  };

  const profileSelector = (
    <ProfileSelector
      profiles={profiles}
      activeProfileId={activeProfile?.id}
      onSelect={handleSelectProfile}
      onCreate={handleCreateProfile}
      onUpdate={handleUpdateProfile}
      onDelete={handleDeleteProfile}
      onClose={activeProfile ? () => setIsProfileSelectorOpen(false) : undefined}
    />
  );

  // Sin perfil activo no se monta el catálogo (evita que el banner reproduzca el tráiler de fondo).
  // La key mantiene vivo el ToastContainer al pasar de esta pantalla al catálogo.
  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        {profilesLoaded ? profileSelector : <LoadingScreen />}
        <ToastContainer key="toasts" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-[#E50914] selection:text-white">
      <Navbar
        onSearch={handleSearch}
        onOpenAddModal={canManage ? () => setIsAddModalOpen(true) : undefined}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myListCount={myListCount}
        backendConnected={backendConnected}
        profiles={profiles}
        activeProfile={activeProfile}
        onSwitchProfile={handleSelectProfile}
        onManageProfiles={() => setIsProfileSelectorOpen(true)}
      />

      <main className="flex-grow">
        {searchQuery.trim() ? (
          <div className="pt-24 px-4 md:px-12 space-y-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-200">
              Resultados para <span className="text-white font-extrabold">"{searchQuery}"</span>
              <span className="text-xs text-gray-400 font-normal ml-3">
                ({visibleSearchResults.length} tráilers encontrados)
              </span>
            </h1>
            {visibleSearchResults.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <p className="text-gray-400 text-lg">No se encontraron tráilers para tu búsqueda.</p>
                {canManage && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-[#E50914] text-white px-5 py-2 rounded font-semibold text-sm hover:bg-red-700 transition"
                  >
                    Agregar este tráiler a Sukinema
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[384px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visibleSearchResults.map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlayTrailer={handlePlayTrailer}
                    onOpenDetails={handleOpenDetails}
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
                {backendConnected ? 'Datos en tiempo real desde Spring Boot API' : 'Datos del catálogo local'}
              </p>
            </div>
            <StatsPanel movies={visibleMovies} myListIds={myListIds} />
          </div>
        ) : activeTab !== 'home' ? (
          <div className="pt-24 px-4 md:px-12 space-y-6 min-h-[60vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {TAB_LABELS[activeTab] || activeTab}
              </h1>
              {activeTab === 'myList' && (
                <span className="text-xs text-gray-400">{getTabFilteredMovies().length} guardados</span>
              )}
            </div>
            {getTabFilteredMovies().length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <p className="text-gray-400 text-base">
                  {activeTab === 'myList'
                    ? 'Aún no has agregado ningún tráiler a tu lista. Haz clic en el botón "+" de cualquier película.'
                    : 'No hay títulos disponibles en esta sección.'}
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-sm font-semibold transition"
                >
                  Explorar catálogo completo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[384px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {getTabFilteredMovies().map(movie => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlayTrailer={handlePlayTrailer}
                    onOpenDetails={handleOpenDetails}
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
              onPlayTrailer={handlePlayTrailer}
              onOpenDetails={handleOpenDetails}
            />
            <div className="relative -mt-16 md:-mt-28 z-20 space-y-4 md:space-y-6">
              {Object.entries(visibleCategories).map(([categoryTitle, moviesList]) => (
                <MovieRow
                  key={categoryTitle}
                  title={categoryTitle}
                  movies={moviesList}
                  onPlayTrailer={handlePlayTrailer}
                  onOpenDetails={handleOpenDetails}
                  myListIds={myListIds}
                  onToggleMyList={handleToggleMyList}
                  likedIds={likedIds}
                  onLikeMovie={handleLikeMovie}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <TrailerModal
        movie={selectedMovie}
        isOpen={isTrailerModalOpen}
        onClose={handleCloseTrailerModal}
        allMovies={visibleMovies}
        onSelectMovie={(movie) => setSelectedMovie(movie)}
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
      />

      {isProfileSelectorOpen && profileSelector}

      {/* Global UI helpers */}
      <ToastContainer key="toasts" />
      <ScrollToTop />

      <Footer />
    </div>
  );
}


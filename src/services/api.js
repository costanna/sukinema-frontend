// URL del backend: en Vercel se define VITE_API_URL; en local se usa el backend de desarrollo
const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8088').replace(/\/+$/, '');

const API_BASE_URL = `${API_ROOT}/api/movies`;

export const MovieAPI = {
  async getFeatured() {
    try {
      const response = await fetch(`${API_BASE_URL}/featured`);
      if (!response.ok) throw new Error('Error al obtener trailer destacado');
      return await response.json();
    } catch (error) {
      console.warn('Backend no disponible o vacio, usando trailer por defecto:', error);
      return null;
    }
  },

  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Error al obtener categorias');
      return await response.json();
    } catch (error) {
      console.warn('Backend no disponible, usando fallback local:', error);
      return null;
    }
  },

  async getAll() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Error al obtener lista de peliculas');
      return await response.json();
    } catch (error) {
      console.error('Error fetching all movies:', error);
      return [];
    }
  },

  async search(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error en busqueda');
      return await response.json();
    } catch (error) {
      console.error('Error buscando trailers:', error);
      return [];
    }
  },

  async create(movieData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Error al guardar la película/tráiler');
    }
    return await response.json();
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Error al eliminar película');
    }
    return true;
  },

  async update(id, movieData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(movieData),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Error al actualizar el tráiler');
    }
    return await response.json();
  },

  async like(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error al dar like');
      return await response.json();
    } catch (error) {
      console.error('Error liking movie:', error);
      return null;
    }
  }
};

const PROFILES_BASE_URL = `${API_ROOT}/api/profiles`;

export const FALLBACK_PROFILES = [
  { id: 1, name: 'Anna', avatar: '🍿', color: 'from-red-600 to-rose-700', isKid: false },
  { id: 2, name: 'Cineasta', avatar: '🎬', color: 'from-blue-600 to-indigo-800', isKid: false },
  { id: 3, name: 'Anime Fan', avatar: '⚡', color: 'from-amber-500 to-orange-700', isKid: false },
  { id: 4, name: 'Kids', avatar: '🦄', color: 'from-emerald-500 to-teal-700', isKid: true },
];

export const ProfileAPI = {
  async getAll() {
    try {
      const response = await fetch(PROFILES_BASE_URL);
      if (!response.ok) throw new Error('Error al obtener perfiles');
      return await response.json();
    } catch (error) {
      console.warn('Backend perfiles no disponible, usando fallback:', error);
      return FALLBACK_PROFILES;
    }
  },

  async create(profileData) {
    try {
      const response = await fetch(PROFILES_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Error al crear perfil');
      }
      return await response.json();
    } catch (error) {
      console.warn('Creando perfil local:', error);
      return {
        ...profileData,
        id: Date.now(),
      };
    }
  },

  async update(id, profileData) {
    try {
      const response = await fetch(`${PROFILES_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Error al actualizar perfil');
      }
      return await response.json();
    } catch (error) {
      console.warn('Actualizando perfil local:', error);
      return {
        ...profileData,
        id,
      };
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${PROFILES_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Error eliminando perfil:', error);
      return true;
    }
  }
};

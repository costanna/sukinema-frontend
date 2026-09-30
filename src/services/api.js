// URL del backend: en Vercel se define VITE_API_URL; en local se usa el backend de desarrollo
const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8088').replace(/\/+$/, '');

const TOKEN_KEY = 'sukinema_token';
const REQUEST_TIMEOUT_MS = 90_000;

/** Error de la API con el mensaje que envía el servidor. status 0 = no se pudo conectar. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let authToken = null;
try {
  authToken = localStorage.getItem(TOKEN_KEY);
} catch (e) {
  console.error(e);
}
let sessionExpiredHandler = null;

export const Session = {
  hasToken: () => !!authToken,

  set(token) {
    authToken = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error(e);
    }
  },

  clear() {
    authToken = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error(e);
    }
  },

  // Se llama cuando el servidor rechaza un token que el navegador tenía guardado
  onExpired(handler) {
    sessionExpiredHandler = handler;
  },
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const sentToken = auth ? authToken : null;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

  // Tope de espera: el servidor gratuito puede tardar cerca de un minuto en despertar,
  // pero una petición que no contesta nunca no debe dejar la pantalla esperando para siempre
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      controller.signal.aborted ? 'El servidor tarda demasiado en responder. Inténtalo de nuevo.' : 'No se pudo conectar con el servidor.',
      0
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = 'Ha ocurrido un error inesperado.';
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // respuesta sin cuerpo JSON: se queda el mensaje genérico
    }
    // Solo la primera respuesta 401 de un mismo token cierra la sesión: si fallan varias
    // peticiones a la vez, el aviso no se repite
    if (response.status === 401 && sentToken && sentToken === authToken) {
      Session.clear();
      if (sessionExpiredHandler) sessionExpiredHandler();
    }
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? null : response.json();
}

export const AuthAPI = {
  async login(email, password) {
    const session = await request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
    Session.set(session.token);
    return session.account;
  },

  // Devuelve también el código de recuperación, que el servidor solo entrega en este momento
  async register(name, email, password) {
    const session = await request('/api/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
    Session.set(session.token);
    return { account: session.account, recoveryCode: session.recoveryCode };
  },

  async recover(email, recoveryCode, newPassword) {
    const session = await request('/api/auth/recover', { method: 'POST', body: { email, recoveryCode, newPassword }, auth: false });
    Session.set(session.token);
    return { account: session.account, recoveryCode: session.recoveryCode };
  },

  // El servidor cierra las demás sesiones y devuelve un token nuevo para seguir en esta
  async changePassword(currentPassword, newPassword) {
    const session = await request('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } });
    Session.set(session.token);
    return session.account;
  },

  async newRecoveryCode(password) {
    const response = await request('/api/auth/recovery-code', { method: 'POST', body: { password } });
    return response.recoveryCode;
  },

  me() {
    return request('/api/auth/me');
  },

  // No requiere sesión: sirve para despertar el servidor y saber si responde
  ping() {
    return request('/api/health', { auth: false });
  },
};

// Las lecturas del catálogo no lanzan: si fallan, la app recurre al catálogo local
export const MovieAPI = {
  async getFeatured() {
    try {
      return await request('/api/movies/featured');
    } catch (error) {
      console.warn('Sin tráiler destacado del backend:', error.message);
      return null;
    }
  },

  async getCategories() {
    try {
      return await request('/api/movies/categories');
    } catch (error) {
      console.warn('Sin categorías del backend:', error.message);
      return null;
    }
  },

  async getAll() {
    try {
      return await request('/api/movies');
    } catch (error) {
      console.warn('Sin catálogo del backend:', error.message);
      return [];
    }
  },

  async search(query) {
    try {
      return await request(`/api/movies/search?query=${encodeURIComponent(query)}`);
    } catch (error) {
      console.warn('Error buscando tráilers:', error.message);
      return [];
    }
  },

  // Las escrituras sí lanzan ApiError, para que el formulario muestre el motivo
  create(movieData) {
    return request('/api/movies', { method: 'POST', body: movieData });
  },

  update(id, movieData) {
    return request(`/api/movies/${id}`, { method: 'PUT', body: movieData });
  },

  delete(id) {
    return request(`/api/movies/${id}`, { method: 'DELETE' });
  },
};

// Perfiles del modo demo (sin servidor)
export const FALLBACK_PROFILES = [
  { id: 1, name: 'Anna', avatar: '🍿', color: 'from-red-600 to-rose-700', isKid: false },
  { id: 2, name: 'Cineasta', avatar: '🎬', color: 'from-blue-600 to-indigo-800', isKid: false },
  { id: 3, name: 'Anime Fan', avatar: '⚡', color: 'from-amber-500 to-orange-700', isKid: false },
  { id: 4, name: 'Kids', avatar: '🦄', color: 'from-emerald-500 to-teal-700', isKid: true },
];

export const ProfileAPI = {
  getAll() {
    return request('/api/profiles');
  },

  create(profileData) {
    return request('/api/profiles', { method: 'POST', body: profileData });
  },

  update(id, profileData) {
    return request(`/api/profiles/${id}`, { method: 'PUT', body: profileData });
  },

  delete(id) {
    return request(`/api/profiles/${id}`, { method: 'DELETE' });
  },

  // "Mi Lista" y likes del perfil: { myList: [ids], likes: [ids] }
  getLibrary(profileId) {
    return request(`/api/profiles/${profileId}/library`);
  },

  addToMyList(profileId, movieId) {
    return request(`/api/profiles/${profileId}/my-list/${movieId}`, { method: 'PUT' });
  },

  removeFromMyList(profileId, movieId) {
    return request(`/api/profiles/${profileId}/my-list/${movieId}`, { method: 'DELETE' });
  },

  // Devuelven el tráiler con el contador de likes actualizado
  like(profileId, movieId) {
    return request(`/api/profiles/${profileId}/likes/${movieId}`, { method: 'PUT' });
  },

  unlike(profileId, movieId) {
    return request(`/api/profiles/${profileId}/likes/${movieId}`, { method: 'DELETE' });
  },
};

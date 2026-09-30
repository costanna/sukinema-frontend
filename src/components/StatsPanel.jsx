import React, { useMemo } from 'react';
import { ThumbsUp, Film, Star, TrendingUp, BarChart3 } from 'lucide-react';
import TrailerImage from './TrailerImage';

function StatCard({ icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-zinc-900/80 border border-white/8 rounded-xl p-5 space-y-1 hover:border-white/20 transition">
      <div className="flex items-center space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function StatsPanel({ movies = [], myListCount = 0 }) {
  const stats = useMemo(() => {
    if (movies.length === 0) return null;

    const totalLikes = movies.reduce((sum, m) => sum + (m.likes || 0), 0);

    const topByLikes = [...movies]
      .filter(m => (m.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5);

    const byCategory = {};
    movies.forEach(m => {
      const cat = m.category || 'Sin categoría';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    });
    // El total cuenta todas las categorías; el gráfico solo muestra las 6 mayores
    const categoryCount = Object.keys(byCategory).length;
    const categoriesSorted = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const newestFirst = [...movies].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt) : 0;
      const db = b.createdAt ? new Date(b.createdAt) : 0;
      return db - da;
    }).slice(0, 3);

    return { totalLikes, topByLikes, categoryCount, categoriesSorted, newestFirst };
  }, [movies]);

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-500">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p>Cargando estadísticas…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Film size={14} />}
          label="Total tráilers"
          value={movies.length}
          sub="en el catálogo"
          color="text-white"
        />
        <StatCard
          icon={<ThumbsUp size={14} />}
          label="Likes totales"
          value={stats.totalLikes}
          sub="de todos los tráilers"
          color="text-blue-400"
        />
        <StatCard
          icon={<Star size={14} />}
          label="Mi Lista"
          value={myListCount}
          sub="tráilers guardados"
          color="text-yellow-400"
        />
        <StatCard
          icon={<TrendingUp size={14} />}
          label="Categorías"
          value={stats.categoryCount}
          sub="categorías disponibles"
          color="text-green-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top liked trailers */}
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ThumbsUp size={16} className="text-blue-400" />
            <span>Top tráilers por likes</span>
          </h3>
          {stats.topByLikes.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay likes. ¡Sé el primero!</p>
          ) : (
            <ol className="space-y-3">
              {stats.topByLikes.map((m, i) => (
                <li key={m.id} className="flex items-center space-x-3">
                  <span className={`text-lg font-black w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{m.title}</p>
                    <p className="text-gray-500 text-xs">{m.category}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-300 font-bold text-sm">
                    <ThumbsUp size={12} />
                    <span>{m.likes}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* By category bar chart */}
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <BarChart3 size={16} className="text-[#E50914]" />
            <span>Tráilers por categoría</span>
          </h3>
          <div className="space-y-3">
            {stats.categoriesSorted.map(([cat, count]) => {
              const maxCount = stats.categoriesSorted[0][1];
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium truncate max-w-[160px]">{cat}</span>
                    <span className="text-gray-500 font-bold ml-2">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E50914] to-red-700 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Newest additions */}
      {stats.newestFirst.length > 0 && (
        <div className="bg-zinc-900/60 border border-white/8 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Film size={16} className="text-green-400" />
            <span>Últimos tráilers añadidos</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.newestFirst.map(m => (
              <div key={m.id} className="flex items-center space-x-3 bg-zinc-800/60 rounded-lg p-3 border border-white/5">
                <TrailerImage
                  movie={m}
                  className="w-14 h-10 rounded object-cover bg-zinc-700 flex-shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{m.title}</p>
                  <p className="text-gray-500 text-[11px] truncate">{m.category} · {m.releaseYear}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

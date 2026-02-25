export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Target, Plus, History, Trophy, Hash, Crosshair, ArrowUpRight } from 'lucide-react';
import { db, games, gamePlayers } from '@/lib/db';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { formatDate } from '@/lib/utils';

async function getRecentGames() {
  try {
    const recent = await db
      .select()
      .from(games)
      .orderBy(desc(games.startedAt))
      .limit(6);

    const withPlayers = await Promise.all(
      recent.map(async (g) => {
        const players = await db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, g.id))
          .orderBy(gamePlayers.order);
        return { ...g, players };
      })
    );
    return withPlayers;
  } catch {
    return [];
  }
}

async function getTopPlayers() {
  try {
    const completedGames = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.status, 'completed'));
    const completedIds = completedGames.map((g) => g.id);
    if (completedIds.length === 0) return [];

    const winners = await db
      .select()
      .from(gamePlayers)
      .where(and(eq(gamePlayers.finishPosition, 1), inArray(gamePlayers.gameId, completedIds)));

    const counts = new Map<string, { name: string; color: string; wins: number }>();
    for (const p of winners) {
      const existing = counts.get(p.playerName);
      if (existing) existing.wins++;
      else counts.set(p.playerName, { name: p.playerName, color: p.color, wins: 1 });
    }
    return Array.from(counts.values())
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);
  } catch {
    return [];
  }
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  X01: <Hash className="h-4 w-4" />,
  CRICKET: <Crosshair className="h-4 w-4" />,
  SHANGHAI: <ArrowUpRight className="h-4 w-4" />,
};

const MODE_COLORS: Record<string, string> = {
  X01: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  CRICKET: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  SHANGHAI: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

export default async function HomePage() {
  const [recentGames, topPlayers] = await Promise.all([getRecentGames(), getTopPlayers()]);

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700">
            <Target className="h-7 w-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white italic">
              Darts OCC
            </h1>
            <p className="text-sm text-zinc-500">Scoreboard professionnel</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href="/history"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <History className="h-4 w-4" /> Historique
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <Trophy className="h-4 w-4" /> Classement
          </Link>
        </div>
      </header>

      {/* Quick Start CTA */}
      <Link
        href="/game/new"
        className="group mb-10 flex items-center justify-between rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-6 hover:border-yellow-500/60 transition-all duration-300"
      >
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Nouvelle partie</h2>
          <p className="text-zinc-400">X01 · Cricket · Shanghai — jusqu&apos;à 8 joueurs</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-500 text-black group-hover:scale-110 transition-transform">
          <Plus className="h-7 w-7" strokeWidth={3} />
        </div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent games */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wide">Parties récentes</h2>
            <Link href="/history" className="text-sm text-zinc-500 hover:text-white transition-colors">
              Voir tout →
            </Link>
          </div>

          {recentGames.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-600">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">Aucune partie jouée</p>
              <p className="text-sm mt-1">Lance ta première partie !</p>
            </div>
          ) : (
            recentGames.map((g) => {
              const config = g.config as { startScore?: number };
              return (
                <div
                  key={g.id}
                  className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-all"
                >
                  {/* Mode badge */}
                  <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold flex-shrink-0 ${MODE_COLORS[g.mode]}`}>
                    {MODE_ICONS[g.mode]}
                    {g.mode}
                    {g.mode === 'X01' && config.startScore && (
                      <span className="opacity-70">· {config.startScore}</span>
                    )}
                  </div>

                  {/* Players */}
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {g.players.map((p) => (
                      <div
                        key={p.playerName}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${p.color}20`, color: p.color }}
                      >
                        {p.finishPosition === 1 && '🥇 '}
                        {p.playerName}
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end flex-shrink-0 text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${g.status === 'completed' ? 'text-emerald-400 bg-emerald-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
                      {g.status === 'completed' ? 'Terminée' : 'En cours'}
                    </span>
                    <span className="text-xs text-zinc-600 mt-1">{formatDate(g.startedAt)}</span>
                    {g.status === 'in_progress' && (
                      <Link
                        href={`/game/${g.id}`}
                        className="mt-1 text-xs font-bold text-yellow-400 hover:underline"
                      >
                        Reprendre →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Top players */}
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white uppercase tracking-wide">Top joueurs</h2>

          {topPlayers.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-600">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">Pas encore de données</p>
            </div>
          ) : (
            topPlayers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <span className="text-2xl">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-black"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-black text-white">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.wins} victoire{p.wins > 1 ? 's' : ''}</p>
                </div>
                <Trophy className="h-4 w-4 text-yellow-400" />
              </div>
            ))
          )}

          {topPlayers.length > 0 && (
            <Link
              href="/leaderboard"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 p-3 text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Classement complet <Trophy className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

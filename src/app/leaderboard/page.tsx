import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Hash, Crosshair, ArrowUpRight } from 'lucide-react';
import { db, games, gamePlayers } from '@/lib/db';
import { eq } from 'drizzle-orm';

async function buildLeaderboard() {
  try {
    const completedGames = await db
      .select()
      .from(games)
      .where(eq(games.status, 'completed'));

    if (completedGames.length === 0) return [];

    const allGamePlayers = await db.select().from(gamePlayers);

    type Stats = {
      playerName: string;
      color: string;
      totalGames: number;
      wins: number;
      podiums: number;
      winRate: number;
      byMode: Record<string, { games: number; wins: number }>;
    };

    const statsMap = new Map<string, Stats>();

    for (const game of completedGames) {
      const gp = allGamePlayers.filter((p) => p.gameId === game.id);
      for (const player of gp) {
        const key = player.playerName;
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            playerName: key,
            color: player.color,
            totalGames: 0,
            wins: 0,
            podiums: 0,
            winRate: 0,
            byMode: {},
          });
        }
        const s = statsMap.get(key)!;
        s.totalGames++;

        if (!s.byMode[game.mode]) s.byMode[game.mode] = { games: 0, wins: 0 };
        s.byMode[game.mode].games++;

        if (player.finishPosition === 1) {
          s.wins++;
          s.byMode[game.mode].wins++;
        }
        if (player.finishPosition !== null && player.finishPosition <= 3) {
          s.podiums++;
        }
        // Update color to most recent
        s.color = player.color;
      }
    }

    return Array.from(statsMap.values())
      .map((s) => ({
        ...s,
        winRate: s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0,
      }))
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.totalGames - a.totalGames);
  } catch {
    return [];
  }
}

const RANK_STYLE = [
  'border-yellow-500/50 bg-yellow-500/10',
  'border-zinc-500/50 bg-zinc-500/10',
  'border-amber-700/50 bg-amber-700/10',
];
const MEDALS_EMOJI = ['🥇', '🥈', '🥉'];

const MODE_META = {
  X01: { label: 'X01', icon: <Hash className="h-4 w-4" />, color: 'text-yellow-400' },
  CRICKET: { label: 'Cricket', icon: <Crosshair className="h-4 w-4" />, color: 'text-blue-400' },
  SHANGHAI: { label: 'Shanghai', icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-purple-400' },
};

export default async function LeaderboardPage() {
  const leaderboard = await buildLeaderboard();

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>
          <div className="h-5 w-px bg-zinc-700" />
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Classement
          </h1>
        </div>
        <Link
          href="/history"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
        >
          Historique
        </Link>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Target className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-bold">Aucune partie terminée</p>
          <p className="text-sm mt-1">Le classement se construira au fil des parties</p>
          <Link
            href="/game/new"
            className="mt-6 flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-base font-black text-black hover:bg-yellow-400 transition-colors"
          >
            Lancer une partie
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 podium cards */}
          {leaderboard.length >= 1 && (
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-end">
              {/* 2nd */}
              {leaderboard[1] && (
                <div className={`flex-1 max-w-xs rounded-2xl border p-5 text-center ${RANK_STYLE[1]}`}>
                  <div className="text-4xl mb-3">🥈</div>
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-black"
                    style={{ backgroundColor: leaderboard[1].color }}
                  >
                    {leaderboard[1].playerName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-black text-lg text-white">{leaderboard[1].playerName}</p>
                  <p className="text-3xl font-black text-white mt-1">{leaderboard[1].wins} <span className="text-lg text-zinc-400">vic.</span></p>
                  <p className="text-xs text-zinc-500 mt-1">{leaderboard[1].winRate}% win rate · {leaderboard[1].totalGames} parties</p>
                </div>
              )}

              {/* 1st - taller */}
              <div className={`flex-1 max-w-xs rounded-2xl border p-6 text-center sm:-mt-4 ${RANK_STYLE[0]}`}>
                <div className="text-5xl mb-3">🥇</div>
                <div
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-black shadow-lg"
                  style={{
                    backgroundColor: leaderboard[0].color,
                    boxShadow: `0 0 30px ${leaderboard[0].color}60`,
                  }}
                >
                  {leaderboard[0].playerName.charAt(0).toUpperCase()}
                </div>
                <p className="font-black text-xl text-white">{leaderboard[0].playerName}</p>
                <p className="text-4xl font-black text-white mt-1">{leaderboard[0].wins} <span className="text-lg text-zinc-400">vic.</span></p>
                <p className="text-xs text-zinc-500 mt-1">{leaderboard[0].winRate}% win rate · {leaderboard[0].totalGames} parties</p>
              </div>

              {/* 3rd */}
              {leaderboard[2] && (
                <div className={`flex-1 max-w-xs rounded-2xl border p-5 text-center ${RANK_STYLE[2]}`}>
                  <div className="text-4xl mb-3">🥉</div>
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-black"
                    style={{ backgroundColor: leaderboard[2].color }}
                  >
                    {leaderboard[2].playerName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-black text-lg text-white">{leaderboard[2].playerName}</p>
                  <p className="text-3xl font-black text-white mt-1">{leaderboard[2].wins} <span className="text-lg text-zinc-400">vic.</span></p>
                  <p className="text-xs text-zinc-500 mt-1">{leaderboard[2].winRate}% win rate · {leaderboard[2].totalGames} parties</p>
                </div>
              )}
            </div>
          )}

          {/* Full table */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-zinc-500 text-xs w-12">#</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-widest text-zinc-500 text-xs">Joueur</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-zinc-500 text-xs">Parties</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-zinc-500 text-xs">Victoires</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-zinc-500 text-xs">Podiums</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-zinc-500 text-xs">Win rate</th>
                  <th className="px-4 py-3 text-center font-bold uppercase tracking-widest text-zinc-500 text-xs">Modes</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, i) => (
                  <tr
                    key={player.playerName}
                    className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30 ${i < 3 ? 'bg-zinc-900' : 'bg-black/20'}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <span className={`text-lg ${i < 3 ? '' : 'text-zinc-600 font-bold'}`}>
                        {i < 3 ? MEDALS_EMOJI[i] : i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-black"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.playerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-black text-white">{player.playerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-zinc-300">{player.totalGames}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono text-xl font-black ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
                        {player.wins}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-mono font-bold text-zinc-300">{player.podiums}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${player.winRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-400">{player.winRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {Object.entries(player.byMode).map(([mode, stats]) => {
                          const meta = MODE_META[mode as keyof typeof MODE_META];
                          return (
                            <div key={mode} className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${meta?.color ?? 'text-zinc-400'}`}>
                              {meta?.icon}
                              {stats.wins}W/{stats.games}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

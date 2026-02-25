import Link from 'next/link';
import { ArrowLeft, Trophy, Hash, Crosshair, ArrowUpRight, Target } from 'lucide-react';
import { db, games, gamePlayers } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { formatDate, formatDuration } from '@/lib/utils';
import { PrintButton } from '@/components/ui/print-button';

async function getAllGames() {
  try {
    const all = await db.select().from(games).orderBy(desc(games.startedAt));
    const withPlayers = await Promise.all(
      all.map(async (g) => {
        const players = await db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, g.id))
          .orderBy(gamePlayers.finishPosition);
        return { ...g, players };
      })
    );
    return withPlayers;
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

export default async function HistoryPage() {
  const allGames = await getAllGames();
  const completed = allGames.filter((g) => g.status === 'completed');
  const inProgress = allGames.filter((g) => g.status === 'in_progress');

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
          <h1 className="text-2xl font-black text-white tracking-tight">Historique</h1>
        </div>
        <PrintButton />
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Parties totales', value: allGames.length },
          { label: 'Terminées', value: completed.length },
          { label: 'En cours', value: inProgress.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <div className="text-3xl font-black text-white">{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1 font-semibold uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* In progress */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3">
            En cours ({inProgress.length})
          </h2>
          <div className="space-y-2">
            {inProgress.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">
          Parties terminées ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center text-zinc-600">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold">Aucune partie terminée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completed.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GameRow({ game }: {
  game: {
    id: string;
    mode: string;
    config: unknown;
    status: string;
    startedAt: Date;
    endedAt: Date | null;
    players: Array<{
      playerName: string;
      color: string;
      finishPosition: number | null;
      finalScore: number | null;
    }>;
  };
}) {
  const config = game.config as { startScore?: number };
  const winner = game.players.find((p) => p.finishPosition === 1);
  const duration = formatDuration(game.startedAt, game.endedAt);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-all">
      <div className="flex items-start gap-4">
        {/* Mode */}
        <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold flex-shrink-0 ${MODE_COLORS[game.mode]}`}>
          {MODE_ICONS[game.mode]}
          {game.mode}
          {game.mode === 'X01' && config.startScore && <span className="opacity-70">· {config.startScore}</span>}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Winner highlight */}
          {winner && (
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="font-black text-white">{winner.playerName}</span>
              <span className="text-xs text-zinc-500">remporte la victoire</span>
              {winner.finalScore !== null && (
                <span className="font-mono text-xs text-zinc-400">({winner.finalScore})</span>
              )}
            </div>
          )}

          {/* All players */}
          <div className="flex flex-wrap gap-2">
            {game.players
              .sort((a, b) => (a.finishPosition ?? 99) - (b.finishPosition ?? 99))
              .map((p) => (
                <div
                  key={p.playerName}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${p.color}20`, color: p.color }}
                >
                  {p.finishPosition === 1 && '🥇 '}
                  {p.finishPosition === 2 && '🥈 '}
                  {p.finishPosition === 3 && '🥉 '}
                  {p.playerName}
                  {p.finalScore !== null && (
                    <span className="font-mono opacity-70">· {p.finalScore}</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${game.status === 'completed' ? 'text-emerald-400 bg-emerald-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
            {game.status === 'completed' ? 'Terminée' : 'En cours'}
          </span>
          <span className="text-xs text-zinc-600">{formatDate(game.startedAt)}</span>
          {game.status === 'completed' && duration !== '—' && (
            <span className="text-xs text-zinc-700">{duration}</span>
          )}
          {game.status === 'in_progress' && (
            <Link href={`/game/${game.id}`} className="text-xs font-bold text-yellow-400 hover:underline">
              Reprendre →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

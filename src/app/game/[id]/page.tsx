'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, RotateCcw, Home, Hash, Crosshair, ArrowUpRight } from 'lucide-react';
import { X01Board } from '@/components/game/X01Board';
import { CricketBoard } from '@/components/game/CricketBoard';
import { ShanghaiBoard } from '@/components/game/ShanghaiBoard';
import { Button } from '@/components/ui/button';

interface GamePlayer {
  playerName: string;
  color: string;
  order: number;
}

interface GameData {
  id: string;
  mode: string;
  config: Record<string, unknown>;
  status: string;
  players: GamePlayer[];
}

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameKey] = useState(0); // key for potential future board re-mount

  useEffect(() => {
    fetch(`/api/games/${gameId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setGame(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  function handleRestart() {
    router.push('/game/new');
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-4 border-zinc-700 border-t-accent"
        />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-bold">{error || 'Partie introuvable'}</p>
        <Button onClick={() => router.push('/')} variant="outline">
          <Home className="h-4 w-4" /> Accueil
        </Button>
      </div>
    );
  }

  const players = game.players
    .sort((a, b) => a.order - b.order)
    .map((p) => ({ name: p.playerName, color: p.color }));

  const modeIcon = {
    X01: <Hash className="h-5 w-5" />,
    CRICKET: <Crosshair className="h-5 w-5" />,
    SHANGHAI: <ArrowUpRight className="h-5 w-5" />,
  }[game.mode] ?? null;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden p-3 gap-3">
      {/* Header */}
      <header className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 shadow-2xl flex-shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-white font-black text-xl tracking-tighter italic">
          <Target className="h-6 w-6 text-zinc-400" />
          Darts OCC
        </button>

        <div className="h-6 w-px bg-zinc-700" />

        <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-bold text-sm text-white">
          {modeIcon}
          {game.mode}
          {game.mode === 'X01' && (
            <span className="text-zinc-400 font-mono">
              · {(game.config as { startScore?: number }).startScore ?? 501}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-1">
          {players.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-sm font-semibold text-zinc-300">{p.name}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4" /> Nouvelle partie
          </Button>
        </div>
      </header>

      {/* Game board */}
      <div className="flex-1 overflow-hidden min-h-0">
        {game.mode === 'X01' && (
          <X01Board
            key={gameKey}
            players={players}
            startScore={(game.config as { startScore?: number }).startScore ?? 501}
            gameId={gameId}
            onRestart={handleRestart}
          />
        )}
        {game.mode === 'CRICKET' && (
          <CricketBoard key={gameKey} players={players} gameId={gameId} onRestart={handleRestart} />
        )}
        {game.mode === 'SHANGHAI' && (
          <ShanghaiBoard key={gameKey} players={players} gameId={gameId} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}

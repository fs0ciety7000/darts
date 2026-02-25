'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hash, Crosshair, ArrowUpRight, Plus, Minus, Target, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAYER_COLORS } from '@/lib/utils';
import type { GameMode } from '@/lib/utils';

const MODES: { id: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'X01', label: 'X01', desc: 'Décompte vers 0 depuis 301/501/701', icon: <Hash className="h-6 w-6" /> },
  { id: 'CRICKET', label: 'Cricket', desc: 'Fermez les cibles 15–20 et Bull', icon: <Crosshair className="h-6 w-6" /> },
  { id: 'SHANGHAI', label: 'Shanghai', desc: 'Score cumulatif sur 20 tours', icon: <ArrowUpRight className="h-6 w-6" /> },
];

const START_SCORES = [301, 501, 701];

interface PlayerSetup {
  name: string;
  color: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>('X01');
  const [startScore, setStartScore] = useState(501);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: 'Joueur 1', color: PLAYER_COLORS[0].hex },
    { name: 'Joueur 2', color: PLAYER_COLORS[1].hex },
    { name: 'Joueur 3', color: PLAYER_COLORS[2].hex },
    { name: 'Joueur 4', color: PLAYER_COLORS[3].hex },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addPlayer() {
    if (players.length >= 8) return;
    const idx = players.length;
    setPlayers([...players, { name: `Joueur ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length].hex }]);
  }

  function removePlayer() {
    if (players.length <= 1) return;
    setPlayers(players.slice(0, -1));
  }

  function updateName(i: number, name: string) {
    const next = [...players];
    next[i] = { ...next[i], name };
    setPlayers(next);
  }

  function updateColor(i: number, color: string) {
    const next = [...players];
    next[i] = { ...next[i], color };
    setPlayers(next);
  }

  async function startGame() {
    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length === 0) {
      setError('Ajoutez au moins 1 joueur');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          config: mode === 'X01' ? { startScore } : {},
          players: validPlayers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      router.push(`/game/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Back link */}
      <div className="w-full max-w-2xl mb-6">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-semibold">
          <Target className="h-4 w-4" /> Darts OCC
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-6"
      >
        <h1 className="text-4xl font-black tracking-tight text-white">
          Nouvelle partie
        </h1>

        {/* Mode selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Mode de jeu</label>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => (
              <motion.button
                key={m.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  mode === m.id
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <div className={mode === m.id ? 'text-accent' : ''}>{m.icon}</div>
                <div>
                  <div className="font-black text-lg">{m.label}</div>
                  <div className="text-xs text-zinc-500 leading-tight">{m.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* X01 start score */}
        {mode === 'X01' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Score de départ</label>
            <div className="flex gap-3">
              {START_SCORES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStartScore(s)}
                  className={`flex-1 rounded-lg border py-3 font-mono text-2xl font-black transition-all ${
                    startScore === s
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Players */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Users className="h-4 w-4" /> Joueurs ({players.length})
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={removePlayer} disabled={players.length <= 1}>
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={addPlayer} disabled={players.length >= 8}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {players.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
              >
                {/* Color picker */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {PLAYER_COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => updateColor(i, c.hex)}
                      className={`h-6 w-6 rounded-full transition-all ${
                        p.color === c.hex ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>

                {/* Name input */}
                <input
                  type="text"
                  value={p.name}
                  maxLength={20}
                  onChange={(e) => updateName(i, e.target.value)}
                  className="flex-1 bg-transparent text-lg font-bold text-white outline-none placeholder:text-zinc-600 border-b border-zinc-700 focus:border-accent pb-0.5 transition-colors"
                  placeholder={`Joueur ${i + 1}`}
                />

                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-black"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase() || '?'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm font-bold text-red-400">
            {error}
          </p>
        )}

        <Button
          variant="primary"
          size="xl"
          className="w-full"
          onClick={startGame}
          disabled={loading}
        >
          {loading ? 'Création...' : (
            <>
              Lancer la partie <ChevronRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

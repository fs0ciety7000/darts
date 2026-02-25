'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { LeaderBanner } from './LeaderBanner';
import { PodiumReveal } from './PodiumReveal';
import { cn } from '@/lib/utils';

interface Player { name: string; color: string; }

interface CricketBoardProps {
  players: Player[];
  gameId: string;
  onRestart: () => void;
}

const TARGETS = [20, 19, 18, 17, 16, 15, 25];

interface PlayerData {
  marks: Record<number, number>; // 0-3 per target
  score: number;
}

function MarkDisplay({ marks }: { marks: number }) {
  if (marks === 0) return <span className="text-zinc-600 text-3xl font-black">·</span>;
  if (marks === 1) return <span className="text-blue-400 text-3xl font-black">/</span>;
  if (marks === 2) return <span className="text-orange-400 text-3xl font-black">X</span>;
  return <Check className="h-9 w-9 text-emerald-400 stroke-[3]" />;
}

export function CricketBoard({ players, gameId, onRestart }: CricketBoardProps) {
  const n = players.length;
  const [data, setData] = useState<PlayerData[]>(() =>
    Array.from({ length: n }, () => ({
      marks: Object.fromEntries(TARGETS.map((t) => [t, 0])),
      score: 0,
    }))
  );
  const [gameOver, setGameOver] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<{ name: string; color: string; position: number; score: string | number }[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [saved, setSaved] = useState(false);

  function addToast(msg: string) {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  function isTargetClosedByAll(target: number, d: PlayerData[]) {
    return d.every((p) => p.marks[target] >= 3);
  }

  function isPlayerDone(pd: PlayerData) {
    return TARGETS.every((t) => pd.marks[t] >= 3);
  }

  function handleClick(playerIdx: number, target: number) {
    if (gameOver) return;
    setData((prev) => {
      const next = prev.map((p) => ({
        ...p,
        marks: { ...p.marks },
      }));
      const pData = next[playerIdx];

      if (pData.marks[target] < 3) {
        pData.marks[target]++;
      } else {
        // Already closed — score points if others haven't closed
        if (!isTargetClosedByAll(target, next)) {
          pData.score += target;
        }
      }

      return next;
    });
  }

  // Check game over: all players have closed all targets
  useEffect(() => {
    const allDone = data.every(isPlayerDone);
    if (allDone && !gameOver && !saved) {
      // Sort by score desc
      const ranked = data
        .map((pd, i) => ({ idx: i, score: pd.score }))
        .sort((a, b) => b.score - a.score);

      const podium = ranked.map((r, pos) => ({
        name: players[r.idx].name,
        color: players[r.idx].color,
        position: pos + 1,
        score: `${r.score} pts`,
      }));

      setPodiumPlayers(podium);
      setSaved(true);
      setGameOver(true);

      // Save to DB
      saveGame(ranked);
      addToast(`🏆 ${podium[0].name} remporte le Cricket !`);
      setTimeout(() => setGameOver(true), 300);
    }
  }, [data]);

  async function saveGame(ranked: { idx: number; score: number }[]) {
    try {
      const results = ranked.map((r, pos) => ({
        playerName: players[r.idx].name,
        finishPosition: pos + 1,
        finalScore: r.score,
      }));
      await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', results }),
      });
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  // Leader: highest score
  const scores = data.map((d) => d.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const leaderIdx = scores.every((s) => s === 0)
    ? null
    : scores.indexOf(maxScore);
  const secondScore = scores.filter((s) => s !== maxScore).length > 0
    ? Math.max(...scores.filter((_, i) => i !== leaderIdx))
    : null;

  const leaderInfo = leaderIdx !== null
    ? { name: players[leaderIdx].name, color: players[leaderIdx].color, score: maxScore }
    : null;

  return (
    <div className="flex flex-col gap-3 h-full">
      <LeaderBanner leader={leaderInfo} secondScore={secondScore} mode="CRICKET" gameOver={gameOver} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-5 py-3 text-white font-bold shadow-2xl backdrop-blur-md"
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-[#0a0a0c]">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 w-24 border-b-4 border-zinc-800 bg-black p-3 text-sm font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Cible
              </th>
              {players.map((p, i) => (
                <th
                  key={p.name}
                  className={cn(
                    'sticky top-0 z-20 min-w-[140px] border-b-4 border-zinc-800 border-r-4 border-r-black p-3',
                    (i + 1) % 2 === 0 ? 'bg-zinc-900/95' : 'bg-zinc-800/95'
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-xl font-black">{p.name}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
            {/* Points row */}
            <tr>
              <td className="sticky top-[68px] left-0 z-20 border-b border-zinc-800 bg-black py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Points
              </td>
              {data.map((pd, i) => {
                const s = pd.score;
                const isLeader = leaderIdx === i && s > 0;
                const isLast = s === minScore && minScore !== maxScore && maxScore > 0;
                return (
                  <td
                    key={i}
                    className={cn(
                      'sticky top-[68px] z-10 border-b border-zinc-800 border-r-4 border-r-black px-4 py-3 font-mono text-5xl font-black tracking-tighter transition-colors',
                      (i + 1) % 2 === 0 ? 'bg-zinc-800/95' : 'bg-zinc-900/95'
                    )}
                  >
                    <span className={cn(isLeader ? 'score-leader' : isLast ? 'score-last' : 'text-yellow-400')}>
                      {s}
                    </span>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((target) => {
              const closedByAll = isTargetClosedByAll(target, data);
              return (
                <tr
                  key={target}
                  className={cn(
                    'transition-all duration-500',
                    closedByAll && 'opacity-30 grayscale'
                  )}
                >
                  <td
                    className={cn(
                      'sticky left-0 z-10 border-b border-zinc-900 bg-black py-5 text-4xl font-black border-r-4 border-r-black',
                      target === 25 ? 'text-red-400 text-3xl' : 'text-white'
                    )}
                  >
                    {target === 25 ? 'BULL' : target}
                  </td>
                  {data.map((pd, pi) => (
                    <td
                      key={pi}
                      className={cn(
                        'border-b border-zinc-800/50 border-r-4 border-r-black py-4',
                        (pi + 1) % 2 === 0 ? 'bg-[#1c1c1f]' : 'bg-[#141417]'
                      )}
                    >
                      <button
                        onClick={() => handleClick(pi, target)}
                        disabled={gameOver}
                        className={cn(
                          'cricket-btn mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all',
                          pd.marks[target] === 0 && 'border-zinc-700 bg-zinc-900 text-zinc-600 hover:border-zinc-500',
                          pd.marks[target] === 1 && 'border-blue-500 bg-zinc-900',
                          pd.marks[target] === 2 && 'border-orange-500 bg-zinc-900',
                          pd.marks[target] >= 3 && 'border-emerald-500 bg-emerald-900/20'
                        )}
                      >
                        <MarkDisplay marks={pd.marks[target]} />
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {gameOver && podiumPlayers.length > 0 && (
        <PodiumReveal players={podiumPlayers} gameId={gameId} onRestart={onRestart} />
      )}
    </div>
  );
}

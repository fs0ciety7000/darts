'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import { LeaderBanner } from './LeaderBanner';
import { PodiumReveal } from './PodiumReveal';
import { cn } from '@/lib/utils';

interface Player { name: string; color: string; }

interface ShanghaiProps {
  players: Player[];
  gameId: string;
  onRestart: () => void;
}

export function ShanghaiBoard({ players, gameId, onRestart }: ShanghaiProps) {
  const n = players.length;
  const ROUNDS = 20;

  // scores[roundIdx][playerIdx]
  const [scores, setScores] = useState<(number | '')[][]>(
    () => Array.from({ length: ROUNDS }, () => Array(n).fill(''))
  );
  const [gameOver, setGameOver] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<{ name: string; color: string; position: number; score: string | number }[]>([]);
  const [saved, setSaved] = useState(false);

  // Cumulative totals
  const totals = Array.from({ length: n }, (_, pi) =>
    scores.reduce((sum, row) => sum + (row[pi] === '' ? 0 : Number(row[pi])), 0)
  );

  const maxTotal = Math.max(...totals);
  const minTotal = Math.min(...totals);

  function handleInput(roundIdx: number, playerIdx: number, rawVal: string) {
    const maxPoints = (roundIdx + 1) * 9;
    let val: number | '' = rawVal === '' ? '' : parseInt(rawVal, 10);
    if (typeof val === 'number' && (isNaN(val) || val < 0)) val = 0;
    if (typeof val === 'number' && val > maxPoints) val = 0;

    setScores((prev) => {
      const next = prev.map((row) => [...row]);
      next[roundIdx][playerIdx] = val;
      return next;
    });
  }

  // All rounds filled → game over
  const allFilled = scores.every((row) => row.every((v) => v !== ''));

  async function finishGame() {
    if (saved) return;
    setSaved(true);
    const ranked = totals
      .map((t, i) => ({ idx: i, score: t }))
      .sort((a, b) => b.score - a.score);
    const podium = ranked.map((r, pos) => ({
      name: players[r.idx].name,
      color: players[r.idx].color,
      position: pos + 1,
      score: `${r.score} pts`,
    }));
    setPodiumPlayers(podium);
    setGameOver(true);

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
      console.error(e);
    }
  }

  // Leader: highest cumulative score
  const leaderIdx = totals.some((t) => t > 0)
    ? totals.indexOf(maxTotal)
    : null;
  const secondScore =
    leaderIdx !== null && totals.filter((t) => t < maxTotal).length > 0
      ? Math.max(...totals.filter((_, i) => i !== leaderIdx))
      : null;
  const leaderInfo = leaderIdx !== null && maxTotal > 0
    ? { name: players[leaderIdx].name, color: players[leaderIdx].color, score: maxTotal }
    : null;

  return (
    <div className="flex flex-col gap-3 h-full">
      <LeaderBanner leader={leaderInfo} secondScore={secondScore} mode="SHANGHAI" gameOver={gameOver} />

      {allFilled && !gameOver && (
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={finishGame}
          className="mx-auto flex items-center gap-2 rounded-xl bg-yellow-500 px-8 py-3 text-xl font-black text-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 transition-colors"
        >
          🏆 Voir le Podium
        </motion.button>
      )}

      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-[#0a0a0c]">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 w-28 border-b-4 border-zinc-800 bg-black p-3 text-sm font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Tour
              </th>
              {players.map((p, i) => (
                <th
                  key={p.name}
                  className={cn(
                    'sticky top-0 z-20 min-w-[150px] border-b-4 border-zinc-800 border-r-4 border-r-black p-3',
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
            {/* Totals row */}
            <tr>
              <td className="sticky top-[68px] left-0 z-20 border-b border-zinc-800 bg-black py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Total
              </td>
              {totals.map((t, i) => {
                const isLeader = leaderIdx === i && t === maxTotal && maxTotal > 0 && maxTotal !== minTotal;
                const isLast = t === minTotal && maxTotal !== minTotal && maxTotal > 0;
                return (
                  <td
                    key={i}
                    className={cn(
                      'sticky top-[68px] z-10 border-b border-zinc-800 border-r-4 border-r-black px-4 py-3 font-mono text-5xl font-black tracking-tighter transition-colors',
                      (i + 1) % 2 === 0 ? 'bg-zinc-800/95' : 'bg-zinc-900/95'
                    )}
                  >
                    <span className={cn(isLeader ? 'score-leader' : isLast ? 'score-last' : 'text-blue-400')}>
                      {t}
                    </span>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROUNDS }, (_, ri) => {
              const maxPts = (ri + 1) * 9;
              return (
                <tr key={ri}>
                  <td className="sticky left-0 z-10 border-b border-zinc-900 bg-black border-r-4 border-r-black py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-zinc-500 text-sm font-bold">Tour {ri + 1}</span>
                      <div className="flex items-center gap-1">
                        <Crosshair className="h-5 w-5 text-blue-400" />
                        <span className="text-2xl font-black text-white">{ri + 1}</span>
                      </div>
                      <span className="text-xs text-zinc-600">max {maxPts}</span>
                    </div>
                  </td>
                  {players.map((p, pi) => (
                    <td
                      key={p.name}
                      className={cn(
                        'border-b border-zinc-800/50 border-r-4 border-r-black p-4',
                        (pi + 1) % 2 === 0 ? 'bg-[#1c1c1f]' : 'bg-[#141417]'
                      )}
                    >
                      <input
                        type="number"
                        min={0}
                        max={maxPts}
                        value={scores[ri][pi]}
                        placeholder={`Max ${maxPts}`}
                        disabled={gameOver}
                        onChange={(e) => handleInput(ri, pi, e.target.value)}
                        className="h-14 w-full max-w-[130px] rounded-lg border-2 border-zinc-800 bg-zinc-950 text-center font-mono text-2xl font-bold text-white outline-none transition-all focus:border-blue-500 focus:bg-zinc-900"
                      />
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

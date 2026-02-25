'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Flag } from 'lucide-react';
import { LeaderBanner } from './LeaderBanner';
import { PodiumReveal } from './PodiumReveal';
import { cn } from '@/lib/utils';

interface Player {
  name: string;
  color: string;
}

interface X01BoardProps {
  players: Player[];
  startScore: number;
  gameId: string;
  onRestart: () => void;
}

type DartValue = number | '';

interface RoundData {
  darts: [DartValue, DartValue, DartValue];
  isBust: boolean;
  roundScore: number;
}

function getMaxRounds(start: number) {
  if (start === 301) return 20;
  if (start === 501) return 30;
  return 50; // 701
}

function getScoreClass(val: number) {
  if (val === 60 || val === 50) return 'score-perfect';
  if (val >= 20) return 'score-good';
  if (val === 0) return 'score-zero';
  return '';
}

export function X01Board({ players, startScore, gameId, onRestart }: X01BoardProps) {
  const n = players.length;
  const maxRounds = getMaxRounds(startScore);

  // rounds[roundIdx][playerIdx] = { darts, isBust, roundScore }
  const [rounds, setRounds] = useState<RoundData[][]>(
    () =>
      Array.from({ length: maxRounds }, () =>
        Array.from({ length: n }, () => ({ darts: ['', '', ''] as [DartValue, DartValue, DartValue], isBust: false, roundScore: 0 }))
      )
  );

  const [podium, setPodium] = useState<number[]>([]); // player indices in finish order
  const [showPodium, setShowPodium] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Compute current scores
  const scores = Array.from({ length: n }, (_, p) => {
    let remaining = startScore;
    for (const row of rounds) {
      const rd = row[p];
      if (rd.isBust) continue;
      if (rd.roundScore > 0 || rd.darts.some((d) => d !== '')) {
        remaining -= rd.roundScore;
      }
    }
    return remaining;
  });

  function addToast(msg: string) {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  function handleInput(
    roundIdx: number,
    playerIdx: number,
    dartIdx: number,
    rawVal: string
  ) {
    let val: DartValue = rawVal === '' ? '' : parseInt(rawVal, 10);
    if (typeof val === 'number' && isNaN(val)) val = 0;
    if (typeof val === 'number' && val > 60) val = 0;
    if (typeof val === 'number' && val < 0) val = 0;

    setRounds((prev) => {
      const next = prev.map((row) => row.map((rd) => ({ ...rd, darts: [...rd.darts] as [DartValue, DartValue, DartValue] })));
      next[roundIdx][playerIdx].darts[dartIdx] = val;

      // Recalculate round score + bust
      const darts = next[roundIdx][playerIdx].darts;
      const total = darts.reduce<number>((s, d) => s + (d === '' ? 0 : Number(d)), 0);

      // Compute remaining before this round
      let remaining = startScore;
      for (let ri = 0; ri < roundIdx; ri++) {
        const rd = next[ri][playerIdx];
        if (!rd.isBust) remaining -= rd.roundScore;
      }

      const afterRound = remaining - total;
      const isBust = afterRound < 0 || afterRound === 1;

      next[roundIdx][playerIdx].isBust = isBust;
      next[roundIdx][playerIdx].roundScore = isBust ? 0 : total;

      return next;
    });
  }

  // Detect winners from scores
  useEffect(() => {
    scores.forEach((s, idx) => {
      if (s === 0 && !podium.includes(idx)) {
        setPodium((prev) => {
          if (prev.includes(idx)) return prev;
          const newPodium = [...prev, idx];
          addToast(`🏆 ${players[idx].name} a terminé !`);
          return newPodium;
        });
      }
    });
  }, [scores.join(',')]);

  // Show podium when all (or enough) players finish naturally
  useEffect(() => {
    if (saved) return;
    if (podium.length > 0 && podium.length === n) {
      setTimeout(() => setShowPodium(true), 600);
    } else if (podium.length > 0 && n > 1 && podium.length === n - 1) {
      const remaining = Array.from({ length: n }, (_, i) => i).find((i) => !podium.includes(i));
      if (remaining !== undefined) {
        setPodium((prev) => [...prev, remaining]);
        setTimeout(() => setShowPodium(true), 800);
      }
    }
  }, [podium.length]);

  // Save to DB when podium shown
  useEffect(() => {
    if (!showPodium || saved) return;
    setSaved(true);
    saveGame(podium);
  }, [showPodium]);

  async function saveGame(finalPodium: number[]) {
    try {
      const results = finalPodium.map((playerIdx, pos) => ({
        playerName: players[playerIdx].name,
        finishPosition: pos + 1,
        finalScore: scores[playerIdx],
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

  function forceFinish() {
    if (saved) return;
    // Already-finished players keep their order; remaining players ranked by score (lowest first)
    const remaining = Array.from({ length: n }, (_, i) => i)
      .filter((i) => !podium.includes(i))
      .sort((a, b) => scores[a] - scores[b]);
    const fullPodium = [...podium, ...remaining];
    setSaved(true);
    setPodium(fullPodium);
    setTimeout(() => setShowPodium(true), 300);
    // saveGame triggered by showPodium effect — but saved is now true, so call directly
    saveGame(fullPodium);
  }

  // --- Leader banner logic ---
  const activePlayers = Array.from({ length: n }, (_, i) => i).filter((i) => scores[i] > 0);
  const minActiveScore = activePlayers.length > 0 ? Math.min(...activePlayers.map((i) => scores[i])) : null;

  // All equal (start or mid-game tie) → no leader
  const allActiveEqual =
    activePlayers.length > 1 && activePlayers.every((i) => scores[i] === minActiveScore);

  const topActive = allActiveEqual ? [] : activePlayers.filter((i) => scores[i] === minActiveScore);

  const leaderIdx = topActive.length === 1 ? topActive[0] : null;
  const secondIdx =
    leaderIdx !== null && activePlayers.length > 1
      ? activePlayers.filter((i) => i !== leaderIdx).reduce((a, b) => (scores[a] < scores[b] ? a : b))
      : null;

  const leaderInfo =
    topActive.length === 0
      ? null
      : { name: players[topActive[0]].name, color: players[topActive[0]].color, score: scores[topActive[0]] };

  const tiedLeaders =
    topActive.length > 1 ? topActive.map((i) => ({ name: players[i].name, color: players[i].color })) : undefined;

  const secondScore = secondIdx !== null ? scores[secondIdx] : null;

  const podiumPlayers = podium.map((idx, pos) => ({
    name: players[idx].name,
    color: players[idx].color,
    position: pos + 1,
    score: scores[idx] === 0 ? '0 restant' : `${scores[idx]}`,
  }));

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Leader banner + force finish */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <LeaderBanner
            leader={leaderInfo}
            secondScore={secondScore}
            mode="X01"
            gameOver={showPodium}
            tiedLeaders={tiedLeaders}
          />
        </div>

        {!showPodium && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmEnd ? (
              <>
                <span className="text-sm text-zinc-400">Terminer la partie ?</span>
                <button
                  onClick={() => { forceFinish(); setConfirmEnd(false); }}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-500 transition-colors"
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmEnd(true)}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-400 hover:border-red-600 hover:text-red-400 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Terminer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-5 py-3 text-white font-bold shadow-2xl backdrop-blur-md"
            >
              🏆 {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scoreboard */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-[#0a0a0c]">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 w-20 border-b-4 border-zinc-800 bg-black p-3 text-sm font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Tour
              </th>
              {players.map((p, i) => {
                const isLeader = leaderIdx === i && !showPodium;
                const podiumPos = podium.indexOf(i);
                return (
                  <th
                    key={p.name}
                    className={cn(
                      'sticky top-0 z-20 min-w-[160px] border-b-4 border-zinc-800 border-r-4 border-r-black p-3',
                      (i + 1) % 2 === 0 ? 'bg-zinc-900/95' : 'bg-zinc-800/95'
                    )}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className={cn('text-xl font-black', isLeader && 'text-emerald-400')}>
                          {p.name}
                        </span>
                        {isLeader && (
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            👑
                          </motion.span>
                        )}
                      </div>
                      {podiumPos >= 0 && (
                        <span className="text-xs font-bold text-yellow-400">
                          {['🥇 1er', '🥈 2e', '🥉 3e', '4e', '5e'][podiumPos] ?? `${podiumPos + 1}e`}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Score row */}
            <tr>
              <td className="sticky top-[72px] left-0 z-20 border-b border-zinc-800 bg-black py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 border-r-4 border-r-black">
                Reste
              </td>
              {players.map((p, i) => {
                const s = scores[i];
                const isLeader = leaderIdx === i && s > 0;
                const isLast =
                  secondIdx === null
                    ? false
                    : s === Math.max(...activePlayers.map((ai) => scores[ai])) && activePlayers.length > 1;
                return (
                  <td
                    key={p.name}
                    className={cn(
                      'sticky top-[72px] z-10 border-b border-zinc-800 border-r-4 border-r-black px-4 py-3 font-mono text-6xl font-black tracking-tighter transition-colors',
                      (i + 1) % 2 === 0 ? 'bg-zinc-800/95' : 'bg-zinc-900/95'
                    )}
                  >
                    <span
                      className={cn(
                        s === 0 ? 'text-white' : isLeader ? 'score-leader' : isLast ? 'score-last' : 'text-white'
                      )}
                    >
                      {s}
                    </span>
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rounds.map((row, ri) => (
              <tr key={ri}>
                <td className="sticky left-0 z-10 border-b border-zinc-900 bg-black py-4 text-2xl font-bold text-zinc-500 border-r-4 border-r-black">
                  {ri + 1}
                </td>
                {players.map((p, pi) => {
                  const rd = row[pi];
                  const finished = podium.includes(pi);
                  return (
                    <td
                      key={p.name}
                      className={cn(
                        'border-b border-zinc-800/50 border-r-4 border-r-black p-3',
                        (pi + 1) % 2 === 0 ? 'bg-[#1c1c1f]' : 'bg-[#141417]',
                        finished && 'opacity-50 pointer-events-none'
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {rd.darts.map((d, di) => (
                          <input
                            key={di}
                            type="number"
                            min={0}
                            max={60}
                            value={d}
                            placeholder="•"
                            disabled={finished}
                            onChange={(e) => handleInput(ri, pi, di, e.target.value)}
                            className={cn(
                              'h-12 w-12 rounded-lg border-2 border-zinc-800 bg-zinc-950 text-center font-mono text-xl font-bold text-white outline-none transition-all',
                              'focus:border-accent focus:bg-zinc-900',
                              d !== '' && getScoreClass(Number(d))
                            )}
                          />
                        ))}
                        {rd.isBust && (
                          <span className="flex items-center gap-1 rounded bg-red-900/50 px-1.5 py-0.5 text-xs font-bold text-red-400 border border-red-800/50">
                            <AlertTriangle className="h-3 w-3" />
                            BUST
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Podium overlay */}
      {showPodium && (
        <PodiumReveal players={podiumPlayers} gameId={gameId} onRestart={onRestart} />
      )}
    </div>
  );
}

'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';

interface LeaderBannerProps {
  leader: { name: string; color: string; score: number | string } | null;
  secondScore?: number | string | null;
  mode: string;
  gameOver?: boolean;
}

export function LeaderBanner({ leader, secondScore, mode, gameOver }: LeaderBannerProps) {
  if (!leader || gameOver) return null;

  const gap =
    secondScore !== null && secondScore !== undefined && typeof leader.score === 'number' && typeof secondScore === 'number'
      ? leader.score - secondScore
      : null;

  // X01: leader is the one with LEAST remaining (lowest score)
  // Shanghai/Cricket: leader is the one with MOST points
  const gapLabel = mode === 'X01'
    ? gap !== null && gap < 0 ? `${Math.abs(gap)} pts d'avance` : null
    : gap !== null && gap > 0 ? `+${gap} pts d'avance` : null;

  return (
    <AnimatePresence>
      <motion.div
        key={leader.name}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="leader-pulse relative flex items-center gap-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-5 py-3 backdrop-blur-sm"
      >
        {/* Crown icon */}
        <motion.div
          animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex-shrink-0"
        >
          <Crown className="h-7 w-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </motion.div>

        {/* Color dot */}
        <div
          className="h-4 w-4 flex-shrink-0 rounded-full ring-2 ring-white/20"
          style={{ backgroundColor: leader.color }}
        />

        {/* Player info */}
        <div className="flex flex-col leading-none">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            🏆 En tête
          </span>
          <span
            className="text-3xl font-black tracking-tight text-white"
            style={{ textShadow: `0 0 20px ${leader.color}60` }}
          >
            {leader.name}
          </span>
        </div>

        {/* Score */}
        <div className="ml-auto flex flex-col items-end leading-none">
          <span className="text-4xl font-black font-mono text-emerald-400 tabular-nums">
            {leader.score}
          </span>
          {gapLabel && (
            <span className="text-xs text-emerald-600 font-semibold mt-0.5">{gapLabel}</span>
          )}
        </div>

        {/* Animated border glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${leader.color}40 0%, transparent 70%)`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

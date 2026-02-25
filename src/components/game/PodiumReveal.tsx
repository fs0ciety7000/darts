'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Home, BarChart3, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PodiumPlayer {
  name: string;
  color: string;
  position: number; // 1, 2, 3
  score: number | string;
}

interface PodiumRevealProps {
  players: PodiumPlayer[];
  gameId: string;
  onRestart: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['#eab308', '#94a3b8', '#a16207'];

// Confetti particle
function Particle({ delay }: { delay: number }) {
  const colors = ['#eab308', '#4ade80', '#38bdf8', '#f97316', '#a855f7', '#f472b6'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 100;
  const rotate = Math.random() * 360;
  const size = Math.random() * 8 + 4;

  return (
    <motion.div
      className="absolute top-0 rounded-sm"
      style={{ left: `${x}%`, width: size, height: size, backgroundColor: color, rotate }}
      initial={{ y: -20, opacity: 1 }}
      animate={{
        y: '110vh',
        rotate: rotate + 720,
        opacity: [1, 1, 0],
      }}
      transition={{ duration: 3 + Math.random() * 2, delay, ease: 'easeIn' }}
    />
  );
}

export function PodiumReveal({ players, gameId, onRestart }: PodiumRevealProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Sort and pick top 3
  const sorted = [...players].sort((a, b) => a.position - b.position).slice(0, 3);

  // Podium display order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [
    sorted.find((p) => p.position === 2),
    sorted.find((p) => p.position === 1),
    sorted.find((p) => p.position === 3),
  ].filter(Boolean) as PodiumPlayer[];

  const winner = sorted[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md"
    >
      {/* Confetti */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <Particle key={i} delay={i * 0.05} />
          ))}
        </div>
      )}

      {/* Radial glow behind winner */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 60%, ${winner?.color ?? '#eab308'}20 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-10 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Trophy className="h-14 w-14 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
        </motion.div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
          Partie terminée !
        </h1>
        {winner && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-2xl font-bold"
            style={{ color: winner.color }}
          >
            🏆 {winner.name} remporte la victoire !
          </motion.p>
        )}
      </motion.div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 px-8">
        {podiumOrder.map((player, displayIdx) => {
          const realPos = player.position;
          const posIdx = realPos - 1; // 0-based for arrays
          const podiumHeights = [160, 110, 80]; // px
          const height = podiumHeights[posIdx];

          return (
            <div key={player.name} className="flex flex-col items-center gap-3">
              {/* Player card above podium */}
              <motion.div
                initial={{ y: -80, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.5 + posIdx * 0.15,
                  type: 'spring',
                  stiffness: 200,
                  damping: 18,
                }}
                className="flex flex-col items-center gap-2"
              >
                {/* Medal */}
                <span className="text-4xl drop-shadow-lg">{MEDALS[posIdx]}</span>

                {/* Avatar */}
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-black shadow-2xl ring-4 ring-white/20"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: `0 0 30px ${player.color}60`,
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div className="max-w-[120px] text-center">
                  <p className="text-lg font-black text-white leading-tight">{player.name}</p>
                  <p className="font-mono text-sm font-bold text-zinc-400">{player.score}</p>
                </div>
              </motion.div>

              {/* Podium block */}
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: 0.3 + posIdx * 0.15,
                  duration: 0.6,
                  ease: 'easeOut',
                }}
                style={{
                  height,
                  transformOrigin: 'bottom',
                  backgroundColor: PODIUM_COLORS[posIdx],
                  boxShadow: `0 -8px 40px ${PODIUM_COLORS[posIdx]}40`,
                }}
                className="w-32 rounded-t-xl flex items-start justify-center pt-3"
              >
                <span className="text-3xl font-black text-black/70">
                  {realPos}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-3"
      >
        <Button variant="ghost" size="lg" onClick={() => router.push('/')}>
          <Home className="h-5 w-5" />
          Accueil
        </Button>
        <Button variant="ghost" size="lg" onClick={() => router.push('/history')}>
          <BarChart3 className="h-5 w-5" />
          Historique
        </Button>
        <Button variant="primary" size="lg" onClick={onRestart}>
          <RotateCcw className="h-5 w-5" />
          Rejouer
        </Button>
      </motion.div>
    </motion.div>
  );
}

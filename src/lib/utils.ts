import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PLAYER_COLORS = [
  { hex: '#eab308', label: 'Or' },
  { hex: '#3b82f6', label: 'Bleu' },
  { hex: '#22c55e', label: 'Vert' },
  { hex: '#ef4444', label: 'Rouge' },
  { hex: '#a855f7', label: 'Violet' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#ec4899', label: 'Rose' },
];

export const GAME_MODES = {
  X01: { label: 'X01', description: 'Décompte vers 0', icon: 'hash' },
  CRICKET: { label: 'Cricket', description: 'Fermer les cibles', icon: 'crosshair' },
  SHANGHAI: { label: 'Shanghai', description: 'Score cumulatif', icon: 'arrow-up-right' },
} as const;

export type GameMode = keyof typeof GAME_MODES;

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDuration(startedAt: Date | string, endedAt: Date | string | null) {
  if (!endedAt) return '—';
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function getModeLabel(mode: string) {
  return GAME_MODES[mode as GameMode]?.label ?? mode;
}

export const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];
export const PODIUM_COLORS = ['#eab308', '#94a3b8', '#a16207'];

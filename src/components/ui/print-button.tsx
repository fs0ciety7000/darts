'use client';
import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
    >
      <Printer className="h-4 w-4" /> Imprimer
    </button>
  );
}

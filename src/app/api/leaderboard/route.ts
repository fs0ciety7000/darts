import { NextResponse } from 'next/server';
import { db, games, gamePlayers } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all completed games with their players
    const completedGames = await db
      .select()
      .from(games)
      .where(eq(games.status, 'completed'))
      .orderBy(desc(games.startedAt));

    const allPlayers = await db.select().from(gamePlayers);

    // Build stats per player per mode
    type Stats = {
      playerName: string;
      color: string;
      totalGames: number;
      wins: number;
      podiums: number; // top 3
      winRate: number;
      byMode: Record<string, { games: number; wins: number; winRate: number }>;
    };

    const statsMap = new Map<string, Stats>();

    for (const game of completedGames) {
      const gamePlrs = allPlayers.filter((p) => p.gameId === game.id);
      for (const player of gamePlrs) {
        const key = player.playerName;
        if (!statsMap.has(key)) {
          statsMap.set(key, {
            playerName: key,
            color: player.color,
            totalGames: 0,
            wins: 0,
            podiums: 0,
            winRate: 0,
            byMode: {},
          });
        }
        const stats = statsMap.get(key)!;
        stats.totalGames++;

        if (!stats.byMode[game.mode]) {
          stats.byMode[game.mode] = { games: 0, wins: 0, winRate: 0 };
        }
        stats.byMode[game.mode].games++;

        if (player.finishPosition === 1) {
          stats.wins++;
          stats.byMode[game.mode].wins++;
        }
        if (player.finishPosition !== null && player.finishPosition <= 3) {
          stats.podiums++;
        }
      }
    }

    // Calculate win rates
    const leaderboard = Array.from(statsMap.values()).map((s) => {
      s.winRate = s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0;
      for (const mode of Object.keys(s.byMode)) {
        const m = s.byMode[mode];
        m.winRate = m.games > 0 ? Math.round((m.wins / m.games) * 100) : 0;
      }
      return s;
    });

    // Sort by wins desc, then winRate
    leaderboard.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

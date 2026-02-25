import { NextRequest, NextResponse } from 'next/server';
import { db, games, gamePlayers } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createGameSchema = z.object({
  mode: z.enum(['X01', 'CRICKET', 'SHANGHAI']),
  config: z.record(z.string(), z.unknown()).optional().default({}),
  players: z.array(
    z.object({
      name: z.string().min(1).max(30),
      color: z.string(),
    })
  ).min(1).max(8),
});

export async function GET() {
  try {
    const allGames = await db
      .select()
      .from(games)
      .orderBy(desc(games.startedAt))
      .limit(50);

    const gamesWithPlayers = await Promise.all(
      allGames.map(async (game) => {
        const players = await db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, game.id))
          .orderBy(gamePlayers.order);
        return { ...game, players };
      })
    );

    return NextResponse.json(gamesWithPlayers);
  } catch (error) {
    console.error('GET /api/games error:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { mode, config, players } = parsed.data;
    const gameId = nanoid();

    await db.insert(games).values({
      id: gameId,
      mode,
      config,
      status: 'in_progress',
    });

    await db.insert(gamePlayers).values(
      players.map((p, i) => ({
        id: nanoid(),
        gameId,
        playerName: p.name,
        color: p.color,
        order: i,
      }))
    );

    return NextResponse.json({ id: gameId });
  } catch (error) {
    console.error('POST /api/games error:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

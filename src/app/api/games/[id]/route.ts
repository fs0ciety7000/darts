import { NextRequest, NextResponse } from 'next/server';
import { db, games, gamePlayers, gameRounds, cricketTurns } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [game] = await db.select().from(games).where(eq(games.id, id));
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const players = await db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, id))
      .orderBy(asc(gamePlayers.order));

    return NextResponse.json({ ...game, players });
  } catch (error) {
    console.error('GET /api/games/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Complete the game with results
    if (body.action === 'complete') {
      const { results } = body; // [{ playerName, finishPosition, finalScore }]

      await db.update(games)
        .set({ status: 'completed', endedAt: new Date() })
        .where(eq(games.id, id));

      for (const r of results) {
        await db.update(gamePlayers)
          .set({ finishPosition: r.finishPosition, finalScore: r.finalScore })
          .where(and(eq(gamePlayers.gameId, id), eq(gamePlayers.playerName, r.playerName)));
      }

      return NextResponse.json({ success: true });
    }

    // Save X01 rounds
    if (body.action === 'saveRounds' && body.rounds) {
      // Delete existing rounds for this game
      await db.delete(gameRounds).where(eq(gameRounds.gameId, id));
      // Insert new rounds
      if (body.rounds.length > 0) {
        await db.insert(gameRounds).values(
          body.rounds.map((r: { playerName: string; roundNumber: number; dart1: number; dart2: number; dart3: number; score: number; isBust: boolean }) => ({
            ...r,
            id: `${id}-${r.playerName}-${r.roundNumber}`,
            gameId: id,
          }))
        );
      }
      return NextResponse.json({ success: true });
    }

    // Save cricket data
    if (body.action === 'saveCricket' && body.turns) {
      await db.delete(cricketTurns).where(eq(cricketTurns.gameId, id));
      if (body.turns.length > 0) {
        await db.insert(cricketTurns).values(
          body.turns.map((t: { playerName: string; target: number; marks: number; points: number }) => ({
            ...t,
            id: `${id}-${t.playerName}-${t.target}`,
            gameId: id,
          }))
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/games/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(games).where(eq(games.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/games/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}

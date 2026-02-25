import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#eab308'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const games = pgTable('games', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull(), // X01 | CRICKET | SHANGHAI
  config: jsonb('config').notNull().default({}), // { startScore: 501 }
  status: text('status').notNull().default('in_progress'), // in_progress | completed
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const gamePlayers = pgTable('game_players', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  color: text('color').notNull().default('#eab308'),
  finishPosition: integer('finish_position'), // 1=winner, 2=second, etc.
  finalScore: integer('final_score'),
  order: integer('order').notNull().default(0), // player order in game
});

export const gameRounds = pgTable('game_rounds', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  roundNumber: integer('round_number').notNull(),
  dart1: integer('dart1'),
  dart2: integer('dart2'),
  dart3: integer('dart3'),
  score: integer('score').notNull().default(0),
  isBust: boolean('is_bust').notNull().default(false),
});

export const cricketTurns = pgTable('cricket_turns', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(),
  target: integer('target').notNull(), // 15, 16, 17, 18, 19, 20, 25
  marks: integer('marks').notNull().default(0), // 0-3
  points: integer('points').notNull().default(0),
});

// Relations
export const gamesRelations = relations(games, ({ many }) => ({
  gamePlayers: many(gamePlayers),
  gameRounds: many(gameRounds),
  cricketTurns: many(cricketTurns),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  game: one(games, { fields: [gamePlayers.gameId], references: [games.id] }),
}));

export const gameRoundsRelations = relations(gameRounds, ({ one }) => ({
  game: one(games, { fields: [gameRounds.gameId], references: [games.id] }),
}));

export const cricketTurnsRelations = relations(cricketTurns, ({ one }) => ({
  game: one(games, { fields: [cricketTurns.gameId], references: [games.id] }),
}));

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type NewGamePlayer = typeof gamePlayers.$inferInsert;
export type GameRound = typeof gameRounds.$inferSelect;
export type NewGameRound = typeof gameRounds.$inferInsert;
export type CricketTurn = typeof cricketTurns.$inferSelect;
export type NewCricketTurn = typeof cricketTurns.$inferInsert;

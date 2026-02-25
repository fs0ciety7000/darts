CREATE TABLE "cricket_turns" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_name" text NOT NULL,
	"target" integer NOT NULL,
	"marks" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_players" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_name" text NOT NULL,
	"color" text DEFAULT '#eab308' NOT NULL,
	"finish_position" integer,
	"final_score" integer,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_rounds" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"player_name" text NOT NULL,
	"round_number" integer NOT NULL,
	"dart1" integer,
	"dart2" integer,
	"dart3" integer,
	"score" integer DEFAULT 0 NOT NULL,
	"is_bust" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#eab308' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cricket_turns" ADD CONSTRAINT "cricket_turns_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_rounds" ADD CONSTRAINT "game_rounds_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
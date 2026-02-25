# Darts OCC v2 — Setup Guide

## Stack
- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + shadcn/ui-style components
- **Framer Motion** — animations podium & leader
- **Neon (PostgreSQL)** — database serverless
- **Drizzle ORM** — type-safe queries + migrations

## Setup local

### 1. Cloner & installer
```bash
git clone ...
npm install
```

### 2. Base de données (Neon)
1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un nouveau projet
3. Copier la **connection string** (format `postgresql://...`)

```bash
cp .env.local.example .env.local
# Éditer .env.local et renseigner DATABASE_URL
```

### 3. Appliquer le schéma
```bash
npm run db:push        # Pour développement rapide
# OU
npm run db:generate    # Génère le SQL de migration
npm run db:migrate     # Applique la migration
```

### 4. Lancer le dev
```bash
npm run dev
# → http://localhost:3000
```

## Déploiement Vercel

1. Push sur GitHub
2. Importer le projet sur [vercel.com](https://vercel.com)
3. Ajouter la variable d'environnement : `DATABASE_URL` = votre connection string Neon
4. Déployer → automatique

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema avec la DB |
| `npm run db:generate` | Génère les migrations SQL |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Ouvre Drizzle Studio (GUI DB) |

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── game/
│   │   ├── new/page.tsx      # Setup nouvelle partie
│   │   └── [id]/page.tsx     # Partie active
│   ├── history/page.tsx      # Historique des parties
│   ├── leaderboard/page.tsx  # Classement
│   └── api/
│       ├── games/route.ts    # CRUD parties
│       ├── games/[id]/route.ts
│       └── leaderboard/route.ts
├── components/
│   ├── game/
│   │   ├── X01Board.tsx      # Tableau de jeu X01
│   │   ├── CricketBoard.tsx  # Tableau Cricket
│   │   ├── ShanghaiBoard.tsx # Tableau Shanghai
│   │   ├── LeaderBanner.tsx  # Bandeau leader en temps réel
│   │   └── PodiumReveal.tsx  # Animation fin de partie
│   └── ui/                   # Composants UI réutilisables
└── lib/
    ├── db/
    │   ├── schema.ts          # Schéma Drizzle
    │   └── index.ts           # Connection DB
    └── utils.ts               # Utilitaires
```

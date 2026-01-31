# StoryForge

> A collaborative video story platform where users build narrative scenes together, generating AI-powered video segments with strict character continuity.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-green.svg)](https://www.python.org/)

---

## 🎬 What is StoryForge?

StoryForge is a web platform where users collaboratively build story scenes and generate videos in segments. Users can:

- Browse curated **Topics** and **Categories**
- Submit **Ideas** (story prompts)
- Create and continue **Scenes** with AI-generated video segments
- Maintain **strict character continuity** across all segments via the Scene Bible system
- Watch complete story timelines as seamless playlists

The platform handles massive scale for data/videos and ensures characters never "drift" across segments.

---

## ✨ Features

### Core Features
- **User Authentication** - Signup, login, profiles, sessions
- **Topic & Category Browsing** - Curated taxonomy with user submissions (moderated)
- **Idea Submission** - User-generated story prompts
- **Scene Creation** - Start new scenes from ideas
- **Scene Continuation** - Add segments to existing scenes
- **AI Script Expansion** - Fast agent-based script generation
- **Video Generation** - Async pipeline for video creation
- **Segment Playback** - HLS streaming with CDN delivery

### Continuity System
- **Scene Bible** - Canonical JSON with characters, settings, timeline
- **Character Entity IDs** - Stable identifiers prevent name drift
- **Continuity Validator** - Gates generation, detects contradictions
- **Auto-correction** - Fixes minor issues automatically
- **Reference Assets** - Character portraits, style frames, voice anchors

### Scale & Performance
- **Object Storage** - S3-compatible for enormous media volumes
- **CDN Delivery** - Global edge caching for video streaming
- **Database Partitioning** - Time-based partitions for segments/jobs
- **Read Replicas** - Separate read traffic for browse-heavy loads
- **Redis Caching** - Hot data for scene pages, topics, job status
- **Search Index** - OpenSearch for discovery at scale

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, React Query |
| API Server | NestJS, TypeScript, Prisma ORM |
| Worker | Python 3.11, Celery, Redis |
| Database | PostgreSQL 15 (with partitioning) |
| Cache/Queue | Redis 7 (caching + BullMQ) |
| Storage | S3-compatible (AWS S3 / MinIO) |
| Streaming | HLS via CDN (CloudFront / Cloudflare) |
| Search | OpenSearch (optional for MVP) |
| Auth | NextAuth.js + JWT |
| Deployment | Docker, Docker Compose, Kubernetes (V1+) |

---

## 📁 Repository Structure

```
storyforge/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities and API client
│   │   │   └── styles/         # Global styles
│   │   ├── public/             # Static assets
│   │   └── package.json
│   │
│   └── api/                    # NestJS API server
│       ├── src/
│       │   ├── modules/        # Feature modules
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── topics/
│       │   │   ├── ideas/
│       │   │   ├── scenes/
│       │   │   ├── segments/
│       │   │   ├── jobs/
│       │   │   └── moderation/
│       │   ├── common/         # Shared utilities
│       │   ├── database/       # Prisma schema and migrations
│       │   └── main.ts
│       └── package.json
│
├── services/
│   └── generator/              # Python video generation worker
│       ├── src/
│       │   ├── agents/         # AI agents (script expansion)
│       │   ├── continuity/     # Scene Bible & validator
│       │   ├── video/          # Video generation pipeline
│       │   ├── storage/        # S3 upload utilities
│       │   └── worker.py       # Celery worker entry
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── shared/                 # Shared TypeScript types/utilities
│       ├── src/
│       │   ├── types/          # Shared type definitions
│       │   ├── constants/      # Shared constants
│       │   └── validation/     # Zod schemas
│       └── package.json
│
├── docs/                       # Documentation
│   ├── 00-index.md
│   ├── 01-product-spec.md
│   ├── 02-architecture.md
│   ├── 03-database-schema.md
│   ├── 04-api-spec.md
│   ├── 05-continuity-system.md
│   ├── 06-async-pipeline.md
│   ├── 07-video-storage.md
│   ├── 08-scalability.md
│   ├── 09-security.md
│   ├── 10-risk-register.md
│   ├── 11-roadmap.md
│   └── adr/                    # Architecture Decision Records
│       ├── 001-monorepo-structure.md
│       ├── 002-scene-bible-design.md
│       └── 003-video-segment-strategy.md
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/             # K8s manifests (V1+)
│   └── terraform/              # Infrastructure as Code
│
├── scripts/
│   ├── setup.sh
│   ├── seed-db.ts
│   └── migrate.sh
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── CODEOWNERS
│
├── .env.example
├── package.json                # Root package.json (workspaces)
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### 1. Clone and Install

```bash
git clone https://github.com/your-org/storyforge.git
cd storyforge
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker Compose

```bash
# Start all services (database, redis, minio)
docker compose -f infra/docker/docker-compose.dev.yml up -d

# Run database migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

### 4. Run Development Servers

```bash
# Terminal 1: API Server
pnpm --filter api dev

# Terminal 2: Web App
pnpm --filter web dev

# Terminal 3: Generator Worker
cd services/generator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
celery -A src.worker worker --loglevel=info
```

### 5. Access the Application

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Docs**: http://localhost:4000/docs
- **MinIO Console**: http://localhost:9001

---

## ⚙️ Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/storyforge
DATABASE_REPLICA_URL=postgresql://user:password@localhost:5433/storyforge

# Redis
REDIS_URL=redis://localhost:6379

# Storage (S3-compatible)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_VIDEOS=storyforge-videos
S3_BUCKET_ASSETS=storyforge-assets

# CDN
CDN_BASE_URL=https://cdn.storyforge.io

# Auth
JWT_SECRET=your-super-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# AI Services
OPENAI_API_KEY=sk-...
VIDEO_GENERATION_API_URL=https://api.video-gen.io
VIDEO_GENERATION_API_KEY=...

# Observability
SENTRY_DSN=https://...
LOG_LEVEL=debug
```

---

## 📡 API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### Topics & Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/topics` | List topics |
| GET | `/api/v1/topics/:id` | Get topic details |
| POST | `/api/v1/topics` | Create topic (moderated) |
| GET | `/api/v1/categories` | List categories |

### Ideas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ideas` | List ideas |
| POST | `/api/v1/ideas` | Submit new idea |
| GET | `/api/v1/ideas/:id` | Get idea details |

### Scenes & Segments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/scenes` | List scenes |
| POST | `/api/v1/scenes` | Create scene from idea |
| GET | `/api/v1/scenes/:id` | Get scene with segments |
| POST | `/api/v1/scenes/:id/continue` | Continue scene (returns jobId) |
| GET | `/api/v1/scenes/:id/bible` | Get Scene Bible |
| GET | `/api/v1/scenes/:id/playlist` | Get HLS playlist |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs/:id` | Get job status |
| GET | `/api/v1/jobs/:id/progress` | Get detailed progress |
| POST | `/api/v1/jobs/:id/retry` | Retry failed job |

### Moderation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/report` | Report content |
| GET | `/api/v1/moderation/queue` | Moderation queue (admin) |

---

## 📚 Documentation Index

| Doc | Description |
|-----|-------------|
| [00-index.md](docs/00-index.md) | Documentation overview and navigation |
| [01-product-spec.md](docs/01-product-spec.md) | Product requirements and user flows |
| [02-architecture.md](docs/02-architecture.md) | System architecture and service design |
| [03-database-schema.md](docs/03-database-schema.md) | PostgreSQL schema with indexes |
| [04-api-spec.md](docs/04-api-spec.md) | Complete REST API specification |
| [05-continuity-system.md](docs/05-continuity-system.md) | Scene Bible and continuity validation |
| [06-async-pipeline.md](docs/06-async-pipeline.md) | Job queue and processing pipeline |
| [07-video-storage.md](docs/07-video-storage.md) | Video storage and HLS streaming |
| [08-scalability.md](docs/08-scalability.md) | Caching, partitioning, replicas |
| [09-security.md](docs/09-security.md) | Auth, rate limiting, moderation |
| [10-risk-register.md](docs/10-risk-register.md) | Problems and solutions |
| [11-roadmap.md](docs/11-roadmap.md) | MVP → V1 → V2 phases |

---

## 🎯 Acceptance Criteria (MVP)

- [ ] User can sign up, log in, and log out
- [ ] User can browse topics, categories, and scenes
- [ ] User can submit a scene continuation and receive jobId instantly (<500ms)
- [ ] Script expansion completes within 10 seconds
- [ ] Continuity validator blocks contradictions
- [ ] Video job completes and segment appears in scene playback
- [ ] Segments maintain consistent character IDs (Scene Bible enforced)
- [ ] Scene plays as seamless segment playlist

---

## 🗺️ Roadmap

### MVP (Weeks 1-4)
- Core auth and user management
- Topic/category/idea CRUD
- Scene creation and continuation
- Basic job pipeline (script → video)
- Scene Bible initialization
- Basic continuity validation
- Segment storage and playback

### V1 (Weeks 5-8)
- HLS streaming with CDN
- Database partitioning
- Read replicas
- Advanced continuity validation
- Reference asset support
- Moderation system
- Rate limiting and abuse prevention

### V2 (Weeks 9-12)
- Scene forking and rebasing
- Recommendation engine
- Full-text search (OpenSearch)
- Analytics dashboard
- Monetization features
- Mobile-responsive optimization

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with ❤️ for collaborative storytelling.
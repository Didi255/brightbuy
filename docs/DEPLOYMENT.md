# BrightBuy — Azure Hosting, Docker & CI/CD: the complete guide

> **Audience:** Group 13. Anyone who needs to understand, operate, or re-create how BrightBuy is hosted.
> **No secrets in this file.** Passwords, the JWT secret and tokens live only in `/opt/brightbuy/.env` on the VM and in GitHub Secrets.

### How to read the source tags

| Tag | Meaning |
|---|---|
| **[REPO]** | Verified against a file in this repository |
| **[TODO]** | Designed and documented, but **not built yet** |
| **[STANDARD]** | The normal industry procedure. It fits our architecture but has not been run against our VM yet |

---

## Table of contents

1. [The 60-second summary](#1-the-60-second-summary)
2. [Glossary](#2-glossary)
3. [The big picture](#3-the-big-picture)
4. [Repository map](#4-repository-map)
5. [Docker from zero](#5-docker-from-zero)
6. [The two Dockerfiles, explained](#6-the-two-dockerfiles-explained)
7. [Build context](#7-build-context)
8. [Where images are stored](#8-where-images-are-stored)
9. [docker-compose: local vs production](#9-docker-compose-local-vs-production)
10. [Caddy: proxy, static host, HTTPS](#10-caddy-proxy-static-host-https)
11. [The Azure VM](#11-the-azure-vm)
12. [CI/CD in detail](#12-cicd-in-detail)
13. [Secrets and environment flow](#13-secrets-and-environment-flow)
14. [One deploy, end to end](#14-one-deploy-end-to-end)
15. [Setup runbook from scratch](#15-setup-runbook-from-scratch)
16. [Day-to-day operations](#16-day-to-day-operations)
17. [Rollback](#17-rollback)
18. [Database: migrations, seeds, backups](#18-database-migrations-seeds-backups)
19. [Cost](#19-cost)
20. [Security](#20-security)
21. [Troubleshooting](#21-troubleshooting)
22. [BrightBuy-specific gotchas](#22-brightbuy-specific-gotchas)
23. [Status and TODO](#23-status-and-todo)
24. [Command cheat sheet](#24-command-cheat-sheet)

---

## 1. The 60-second summary

- The site runs on **one Azure VM** (Ubuntu) **[TODO]**.
- On it, **Docker** runs **3 containers**: `mysql`, `api` (Express), `web` (Caddy serving the built React app and proxying `/api`) **[REPO]**.
- Only **`web`** is reachable from the internet, on ports 80 and 443. `api` and `mysql` sit on a private Docker network **[REPO]**.
- **Deploys are automatic.** Merging into `main` runs GitHub Actions: CI → build two images on a temporary GitHub machine → push to **GHCR** → SSH into the VM → pull and restart **[REPO]**.
- **The source code is never on the VM.** The VM holds three files (`docker-compose.prod.yml`, `Caddyfile`, `.env`) and Docker images **[REPO]**.
- Every image is tagged with the Git **commit SHA**, so any past version can be put back **[REPO]**.

```
 Merge PR → main
      │
      ▼
 GitHub runner (temporary VM)
   1. CI: build the client, migrate + seed a real MySQL, run the concurrency test
   2. docker build  api + web
   3. docker push   → GHCR
   4. ssh → Azure VM : "set tag, pull, restart, migrate"
      │                                 │
      ▼                                 ▼
    GHCR  ◄──── docker pull ────  Azure VM  ──► https://<your-label>.<region>.cloudapp.azure.com
```

---

## 2. Glossary

| Term | Plain English |
|---|---|
| **VM** | A computer rented from a cloud provider. No screen; you control it over SSH. |
| **Resource group** | An Azure folder holding related resources (VM, disk, IP, network). |
| **SSH / key pair** | Encrypted remote terminal. A private key stays with you, the matching public key sits on the server. |
| **NSG** | Azure's firewall. Decides which ports are open to the internet. |
| **DNS label** | A free Azure hostname pointing at the VM's IP, so no domain purchase is needed. |
| **Image** | A frozen package: app + runtime + dependencies. Built once, runs anywhere. |
| **Container** | A running instance of an image. Disposable. |
| **Layer** | One build step. Images are stacks of layers, and layers are cached and shared. |
| **Dockerfile** | The recipe that builds **one image**. |
| **Build context** | The folder whose files `COPY` is allowed to read during a build. |
| **Multi-stage build** | Several `FROM` blocks. Only the last becomes the image; earlier ones are scratch work. |
| **Registry / GHCR** | Online image storage. GHCR is GitHub's (`ghcr.io`). |
| **Tag** | A label on a version (`:latest`, `:cd25479…`). |
| **Volume** | Docker-managed storage that survives container deletion. Our database lives in one. |
| **Compose** | Runs several containers together from one YAML file. |
| **Reverse proxy** | A public server that forwards requests to private ones behind it. Caddy is ours. |
| **Let's Encrypt** | Free certificate authority. Caddy uses it automatically. |
| **CI / CD** | Automatically checking code / automatically shipping it. |
| **Runner** | The temporary VM GitHub starts to run a workflow. Deleted afterwards. |
| **Healthcheck** | A command Docker runs repeatedly to judge whether a container is OK. |
| **SPA** | Single-page application. The React app: one HTML file, routing done in the browser. |

---

## 3. The big picture

### 3.1 The machines

| Machine | Has Docker? | Role |
|---|:--:|---|
| **Your laptop** | optional | Write code, run MySQL locally, open PRs |
| **GitHub** | n/a | Stores code, runs workflows, hosts GHCR |
| **GitHub runner** | yes, pre-installed | **Builds** the images and runs the deploy |
| **GHCR** | n/a | Stores the built images (master copy) |
| **Azure VM** | yes, we install it | **Runs** the containers |
| **Docker Hub** | n/a | Source of the `mysql` and `caddy` base images |

**The runner builds, the VM runs.** The VM never builds and holds no source.

### 3.2 Runtime architecture

```
                         Internet
                            │  HTTPS 443 / HTTP 80
                            ▼
 ┌────────────────────────────────────────────────────────────────┐
 │ Azure VM  (Ubuntu, Standard_B1s or B2s)                        │
 │                                                                │
 │  private Docker network — service names are hostnames          │
 │                                                                │
 │   ┌─────────┐   /api/*      ┌────────┐    SQL     ┌─────────┐  │
 │   │  web    │ ─────────────►│  api   │───────────►│  mysql  │  │
 │   │ Caddy   │               │ :4000  │            │  :3306  │  │
 │   │ 80/443  │               └────────┘            └────┬────┘  │
 │   │         │                                          │       │
 │   │ /*  →  static files baked into this image     volume mysqldata
 │   └─────────┘                                                  │
 │    volumes caddy_data (certificates), caddy_config             │
 └────────────────────────────────────────────────────────────────┘
```

- The browser sees **one website, one origin**. Caddy decides internally whether a request is API or app.
- Containers reach each other by **service name** (`api:4000`, `mysql:3306`) via Docker's DNS.
- `4000/tcp` and `3306/tcp` appear in `docker ps` but are **not published**. Only Caddy's 80, 443 and 443/udp are.

### 3.3 Why only three containers

Sky Nest needs four because Next.js requires a Node server at runtime. **Vite does not** — `npm run build` emits plain files, and Caddy serves them itself. One fewer container, one fewer thing to break.

---

## 4. Repository map

```
brightbuy/
├── .github/workflows/
│   ├── ci.yml                     build client · syntax-check server · migrate + seed + concurrency test   [REPO]
│   └── deploy.yml                 CI → build 2 images → GHCR → SSH deploy → migrate → smoke tests          [REPO]
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api         recipe: Express image          [REPO]
│   │   └── Dockerfile.web         recipe: Caddy + built SPA      [REPO]
│   └── azure/
│       ├── docker-compose.prod.yml  PRODUCTION stack, copied to the VM every deploy   [REPO]
│       └── Caddyfile                proxy + static + HTTPS config, copied every deploy [REPO]
├── docker-compose.yml             LOCAL dev: MySQL only, on host port 3307            [REPO]
├── server/                        Express API (CommonJS, no build step)
│   ├── src/                       app.js, server.js, modules/
│   └── scripts/                   run-migrations.js, run-seeds.js
├── client/                        React + Vite SPA  →  dist/
├── database/
│   ├── migrations/                14 numbered .sql files, tracked in `schema_migrations`
│   ├── seeds/                     01_cities_users · 02_catalogue · 03_demo_orders
│   └── tools/                     asset scripts (icons, hero, product-image tinting)
└── .dockerignore                  one file; both builds use the repo root as context  [REPO]
```

### Which file is used where

| File | Laptop | Runner | VM |
|---|:--:|:--:|:--:|
| `Dockerfile.api` / `Dockerfile.web` | ✔ (manual builds) | ✔ builds | ✘ |
| `docker-compose.yml` (root) | ✔ | ✘ | ✘ |
| `azure/docker-compose.prod.yml` | ✘ | copied from here | ✔ runs it |
| `azure/Caddyfile` | ✘ | copied from here | ✔ |
| `.github/workflows/*` | ✘ | ✔ | ✘ |
| Source code | ✔ | ✔ | ✘ (only compiled, inside images) |

---

## 5. Docker from zero

### 5.1 Why bother

Without Docker you would install Node, MySQL and Caddy on the VM by hand and keep versions aligned forever. With Docker each piece ships as an image containing exactly what it needs. Deploying becomes "download the new image, restart"; rolling back becomes "start the old one".

### 5.2 Image vs container vs volume

```
  Dockerfile ──build──► IMAGE ──run──► CONTAINER
   (recipe)            (frozen)       (running, disposable)
                                            │
                                            └─ uses a VOLUME for data that must survive
```

A container is the image's read-only layers plus one thin writable layer. Delete the container and that writable layer goes with it. **The database must therefore live in a volume**, never in the container.

### 5.3 Instructions you need

| Instruction | Meaning |
|---|---|
| `FROM image AS name` | Start a stage. |
| `WORKDIR /app` | Create and `cd` into a folder inside the image. |
| `COPY src dest` | Copy from the build context into the image. |
| `COPY --from=stage` | Copy from an earlier stage. |
| `RUN cmd` | Run **during the build**. |
| `ENV K=v` | Variable present at build and runtime. |
| `USER name` | Run as a non-root user from here on. |
| `EXPOSE 4000` | Documentation only. It does **not** publish a port. |
| `HEALTHCHECK` | How Docker decides the container is healthy. |
| `CMD [...]` | What runs when the container **starts**. |

### 5.4 Layer caching, the one trick

Docker caches each step. Both our Dockerfiles copy `package.json` + the lockfile **first** and run `npm ci`, then copy the source **last**. Edit only application code and the dependency install is served from cache.

---

## 6. The two Dockerfiles, explained

### 6.1 `infrastructure/docker/Dockerfile.api` [REPO]

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev              # runtime dependencies only

FROM node:20-alpine AS runner
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=deps /app/server/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY server/scripts ./scripts
COPY database ./../database        # ← read §6.2 before touching this
USER node
EXPOSE 4000
HEALTHCHECK ... CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "src/server.js"]
```

There is **no compile stage**: the API is plain CommonJS, not TypeScript. The two stages exist only so the final image carries production dependencies and nothing else.

Final layout:

```
/app/
├── server/
│   ├── node_modules/   (production only)
│   ├── src/  scripts/  package.json
└── database/
    ├── migrations/     (14 .sql files)
    └── seeds/
```

### 6.2 Why the image mirrors the repo layout

`server/scripts/run-migrations.js` resolves its SQL like this [REPO]:

```js
path.join(__dirname, '..', '..', 'database', 'migrations')
```

If you flatten `server/` to `/app`, then `__dirname` is `/app/scripts` and `../../database` resolves to **`/database`** — outside the image. Migrations break.

By mirroring, `__dirname` is `/app/server/scripts`, so `../../database` is `/app/database`. **Verified inside the built image: `/app/database/migrations EXISTS, 14 migration files`.** This is why `npm run migrate` works in the container with no change to the script.

### 6.3 `infrastructure/docker/Dockerfile.web` [REPO]

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build                  # → /app/dist

FROM caddy:2-alpine AS runner
COPY --from=builder /app/dist /srv
COPY infrastructure/azure/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
```

**No build args.** `client/src/api/client.js` has `const BASE = '/api'` — a *relative* path. The bundle contains no hostname, so the same image runs against any domain and changing the domain is an `.env` edit, never a rebuild.

> This is the single biggest difference from Sky Nest, where `NEXT_PUBLIC_API_URL` is baked into the JavaScript at build time and a domain change forces a rebuild.

### 6.4 What Vite actually emits [REPO, verified in the image]

```
dist/
├── index.html                      names the hashed bundles below
├── assets/
│   ├── index-C6ZDJdTA.js           ← content hash in the filename
│   └── index-FWysIIBD.css
├── product-images/   (44)          ← copied from client/public, NOT hashed
├── category-icons/   (9)
└── hero-cluster.png, Logo.png, …
```

That split drives the whole cache policy in §10. Read it before editing the Caddyfile.

### 6.5 `.dockerignore` [REPO]

One file at the repo root, because **both** builds use the root as context. It excludes `node_modules`, `client/dist`, `.git`, `docs/`, `.github/`, `server/tests/`, and critically:

- **`.env` and `.env.*`** — the only non-negotiable entry. It keeps secrets out of every image.
- **`database/scratch/`** — roughly 10 MB of source artwork that exists only to regenerate assets. The *generated* files in `client/public` are what ship.

---

## 7. Build context

The Dockerfile never names a folder like "server". **Whoever runs `docker build` chooses the context.** Here that is `deploy.yml` [REPO]:

```yaml
# both images
context: .
file: infrastructure/docker/Dockerfile.api   # or .web
```

Both use the **repo root**: the API image needs `database/` (which lives outside `server/`), and the web image needs `client/` plus the `Caddyfile` from `infrastructure/`.

Local development uses neither image. `npm run dev` runs Vite and Node directly, with Vite proxying `/api` to `localhost:4000`. **Production never bind-mounts code.**

---

## 8. Where images are stored

| Location | What | Role |
|---|---|---|
| **GHCR** `ghcr.io/<owner>/brightbuy-{api,web}` | Every version, tagged `:<sha>` and `:latest` | Master copy. Visible under the repo's **Packages**. Private while the repo is private. |
| **Azure VM** `/var/lib/docker/` | Downloaded copies | What actually runs |

`mysql:8.0` and `caddy:2-alpine` come from Docker Hub and never enter GHCR.

### How an image reaches the VM

```
1. Merge to main
2. GitHub starts a runner
3. runner: docker build
4. runner: docker push → ghcr.io/…:<sha> and :latest     (auth: automatic GITHUB_TOKEN)
5. runner: ssh VM → set IMAGE_TAG, docker compose pull
6. VM: downloads the changed layers straight from ghcr.io (auth: read:packages token on the VM)
7. VM: docker compose up -d
8. runner is deleted
```

> **The images do not travel over SSH.** SSH carries only commands and two small text files. The VM pulls from GHCR over HTTPS — far faster, and only changed layers move.

Old SHA-tagged images stay on the VM because `docker image prune -f` removes only **untagged** images. That is what makes the instant rollback in §17 possible, at the cost of disk.

---

## 9. docker-compose: local vs production

A **Dockerfile builds one image**. A **compose file runs several containers**. The production compose **builds nothing**.

### 9.1 Production: `infrastructure/azure/docker-compose.prod.yml` [REPO]

| Service | Key settings |
|---|---|
| `mysql` | `mysql:8.0`; env `MYSQL_ROOT_PASSWORD/DATABASE/USER/PASSWORD`; volume `mysqldata:/var/lib/mysql`; healthcheck `mysqladmin ping`; **`--log-bin-trust-function-creators=1`**; utf8mb4. **No `ports:`** |
| `api` | `${API_IMAGE}:${IMAGE_TAG:-latest}`; `depends_on: mysql: service_healthy`; env `DB_HOST=mysql`, `DB_PORT=3306`, `DB_NAME/USER/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN=https://${APP_DOMAIN}`, `STORE_CITY_ID`; healthcheck from the image |
| `web` | `${WEB_IMAGE}:${IMAGE_TAG:-latest}`; the **only service with `ports:`** (80, 443, 443/udp); env `APP_DOMAIN`; volumes `caddy_data`, `caddy_config` |

Volumes: `mysqldata`, `caddy_data`, `caddy_config`.

All three have **`restart: unless-stopped`**, so they come back by themselves after a reboot or a crash.

**Startup order:** `mysql` (healthy) → `api` → `web`. Only MySQL uses `service_healthy`, so the API never starts against a database that is not ready.

**The `$$` in the healthcheck** escapes the dollar so Compose leaves it alone and the container's shell expands it instead.

### 9.2 Local: `docker-compose.yml` at the repo root [REPO]

| | Local | Production |
|---|---|---|
| What runs in Docker | **MySQL only** | all three |
| MySQL port | `3307` published to the host | **not published** |
| MySQL password | `root` / `brightbuy`, in the file | random, in `.env` on the VM |
| API and client | `npm run dev` on the host | baked into images |
| Proxy / HTTPS | none; Vite proxies `/api` to `:4000` | Caddy |

Local MySQL is on **3307**, not 3306, so it cannot collide with a MySQL someone installed natively.

---

## 10. Caddy: proxy, static host, HTTPS

`infrastructure/azure/Caddyfile` [REPO]. Four rules, in order:

| Order | Matcher | What it does |
|---|---|---|
| 1 | `/api/*` | `reverse_proxy api:4000`. **Checked first**, so an API path never falls through to the SPA rule and gets served `index.html` with a 200. |
| 2 | `/assets/*` | `Cache-Control: public, max-age=31536000, immutable`. Vite hashes these filenames, so a changed file is a changed URL. |
| 3 | `*.png *.jpg *.webp …` | `max-age=604800` (7 days). These come from `client/public` and are **not** hashed — `product-images/acer-aspire-5-laptop.jpg` keeps its name when the picture changes, so a year would strand people on the old one. |
| 4 | everything else | `Cache-Control: no-store`, then `try_files {path} /index.html`. |

**Two details that will bite you if you change them:**

- **`index.html` must never be cached.** It names the hashed bundles. A stale copy points a browser at JavaScript that no longer exists, and the site is broken until a hard refresh.
- **`try_files` is what makes React Router work.** Without it, refreshing on `/products/12` asks Caddy for a file that was never built and gets a 404. `deploy.yml` smoke-tests a deep link for exactly this reason.

**Automatic HTTPS:** because `{$APP_DOMAIN}` is a real hostname, Caddy obtains and renews a Let's Encrypt certificate and redirects HTTP → HTTPS. It needs ports **80 and 443** open. Certificates live in the `caddy_data` volume and survive redeploys.

**Why Caddy over Nginx:** certificates with no certbot, no cron, no renewal scripts.

**Local testing:** set `APP_DOMAIN=:80`. A bare `:80` tells Caddy "HTTP only, no certificate", which is what you want on a laptop with no public DNS.

---

## 11. The Azure VM [TODO — not created yet]

### 11.1 Recommended shape

| Property | Suggested value |
|---|---|
| Resource group | `brightbuy-rg` |
| VM name | `brightbuy-vm` |
| Region | the one nearest you |
| Size | **Standard_B1s** (1 vCPU, 1 GB) is enough for a demo; **B2s** (2 vCPU, 4 GB) if MySQL feels tight |
| OS | Ubuntu 24.04 LTS |
| Login user | `azureuser` |
| Public IP | **Standard SKU, static** — survives stop/start |
| DNS label | `brightbuy-g13` → `brightbuy-g13.<region>.cloudapp.azure.com` (free) |
| App folder | `/opt/brightbuy` |
| Budget alert | set one; Azure for Students credit is finite |

### 11.2 What lives on the VM

```
/opt/brightbuy/
├── docker-compose.prod.yml   overwritten by scp every deploy
├── Caddyfile                 overwritten every deploy
├── .env                      SECRETS + IMAGE_TAG.  chmod 600.  hidden: use `ls -la`
└── backups/                  mysqldump output
```

**There is no source code.** No `git clone`, no `server/`, no `client/`. The code is inside the images. To look:

```bash
cd /opt/brightbuy
docker compose -f docker-compose.prod.yml exec api sh
ls /app/server /app/database
```

**Never edit code in a container.** It vanishes on the next deploy. Change it in Git and let the pipeline build a new image.

### 11.3 Firewall (NSG)

Allow inbound **22, 80, 443**. Nothing else.

**Never open 3306.** MySQL is private by design, reachable only from the `api` container over the Docker network.

---

## 12. CI/CD in detail

### 12.1 `ci.yml` [REPO]

| | |
|---|---|
| Triggers | push to `dev`, `feat/**`, `fix/**`, `redesign/**`; PRs into `main` and `dev`; `workflow_call` |
| Concurrency | cancels superseded runs on the same ref |

**Job `client`** — `npm ci` then `npm run build`. There is no lint or test script in `client/`, so the build *is* the check. It is not nothing: Vite fails on a bad import, a missing dependency or a syntax error, which covers most of what actually breaks.

**Job `server`** — this is the valuable one. It starts a real **MySQL 8 service container**, then:

1. `npm ci`
2. **Syntax-check** every `.js` under `src`, `scripts`, `tests` with `node --check`.
3. `SET GLOBAL log_bin_trust_function_creators = 1` — a service container cannot be given a `command:`, so the flag is set at runtime instead. Without it migration 007 fails.
4. `npm run migrate`
5. `npm run seed`
6. **`npm run test:concurrency`** — twenty concurrent orders against one unit of stock. Exactly one may take it, stock must not go negative, nothing may deadlock. The script exits non-zero otherwise.

> Step 6 is the artifact this project is graded on, and it now runs on every push. If someone weakens the transaction, CI goes red.

**Known limit:** `node --check` only *parses*. It will not catch a typo'd identifier — that is how `NUMBER` instead of `Number` once reached a seed file.

### 12.2 `deploy.yml` [REPO]

| | |
|---|---|
| Triggers | push to `main` (a merged PR counts), plus manual `workflow_dispatch` |
| Concurrency | group `deploy-production`, **`cancel-in-progress: false`** — cancelling a deploy halfway leaves the VM in an unknown state |

```
        ┌──► build-api ──┐
 ci ────┤                ├──► deploy
        └──► build-web ──┘
```

**`ci`** re-runs the whole CI file. Fail here and nothing is built.

**`build-api` / `build-web`** run in parallel on separate runners. Each computes `ghcr.io/${GITHUB_REPOSITORY,,}-api` (the `,,` lowercases it — **GHCR rejects uppercase**), logs in with the automatic `GITHUB_TOKEN`, and pushes `:<sha>` **and** `:latest`, with a GitHub Actions layer cache scoped per image.

**`deploy`**

1. Write `VM_SSH_KEY` to `~/.ssh/id_ed25519` (mode 600), `ssh-keyscan` the host.
2. `scp` **two files** to `/opt/brightbuy/`.
3. Over SSH, with `set -euo pipefail`:
   - rewrite `IMAGE_TAG=<sha>` in `.env` (sed if present, append if not, so a fresh VM works)
   - `docker compose pull api web`
   - `docker compose up -d --remove-orphans`
   - **`docker compose exec -T api npm run migrate`**
   - `docker image prune -f`
4. Smoke-test `/api/health` with retries, then `/`.
5. **Deep-link test:** `GET /orders` must return 200, not 404. This is the only check that catches a broken `try_files`, and it is invisible from the home page.

### 12.3 Why migrations run automatically but seeds do not

`run-migrations.js` records what it has applied in a **`schema_migrations`** table and skips those next time, so re-running it is a no-op. That makes it safe on every deploy and means nobody can forget.

**Seeds are never run automatically.** They insert demo cities, users, catalogue and orders — on a live database that would duplicate or overwrite real data. Seeds are a one-time, deliberate, manual act.

---

## 13. Secrets and environment flow

### 13.1 GitHub → Settings → Secrets and variables → Actions [TODO]

| Name | Kind | Purpose |
|---|---|---|
| `VM_HOST` | secret | VM hostname for ssh/scp |
| `VM_USER` | secret | `azureuser` |
| `VM_SSH_KEY` | secret | **Private key**, full file contents including BEGIN/END lines |
| `APP_DOMAIN` | **variable** | Used by the smoke tests |
| `GITHUB_TOKEN` | automatic | GHCR push |

> `APP_DOMAIN` is a *variable*, not a secret, and unlike Sky Nest it is **not** needed at build time — only for the smoke test. Nothing about the domain is baked into our images.

### 13.2 `/opt/brightbuy/.env` on the VM

```env
# database
MYSQL_ROOT_PASSWORD=<long-random>
DB_NAME=brightbuy
DB_USER=brightbuy
DB_PASSWORD=<long-random>

# api
JWT_SECRET=<long-random>
JWT_EXPIRES_IN=8h
STORE_CITY_ID=1

# public
APP_DOMAIN=brightbuy-g13.<region>.cloudapp.azure.com

# images  (owner lowercase)
API_IMAGE=ghcr.io/<owner>/brightbuy-api
WEB_IMAGE=ghcr.io/<owner>/brightbuy-web
IMAGE_TAG=<written by the pipeline>
```

Generate secrets with `openssl rand -base64 48`. `chmod 600 .env`. Keep a copy in a password manager — the VM is the only other place it exists.

See names without values: `sed 's/=.*/=<hidden>/' /opt/brightbuy/.env`

### 13.3 Variables exist at three different times

| When | How | Example |
|---|---|---|
| **Build time** | — | **none.** BrightBuy bakes nothing in. |
| **Deploy time** | pipeline edits `.env` over SSH | `IMAGE_TAG` |
| **Runtime** | compose `environment:` reading `.env` | `DB_PASSWORD`, `JWT_SECRET`, `APP_DOMAIN` |

### 13.4 GHCR authentication, two directions

| Direction | Credential |
|---|---|
| Runner → GHCR (**push**) | automatic `GITHUB_TOKEN` with `packages: write` |
| VM → GHCR (**pull**) | a **personal access token** with only `read:packages`, saved once with `docker login ghcr.io`. **Expires after 90 days** — when it does, `docker compose pull` fails and the deploy stops there. |

---

## 14. One deploy, end to end

1. You open a PR into `main`. `ci.yml` runs on the PR.
2. The PR is merged → push to `main` → `deploy.yml` starts.
3. `ci` runs again, including migrations and the concurrency test, and must pass.
4. In parallel, two runners build `api` and `web` and push `:<sha>` and `:latest` to GHCR.
5. The deploy runner `scp`s `docker-compose.prod.yml` and `Caddyfile` to `/opt/brightbuy/`.
6. It SSHes in, writes `IMAGE_TAG=<sha>`, and runs `docker compose pull api web`.
7. The VM downloads only the changed layers from GHCR.
8. `up -d` recreates **api and web**. MySQL keeps running and the data is untouched. A few seconds of API downtime.
9. `npm run migrate` runs inside the api container; already-applied migrations are skipped.
10. Dangling images are pruned.
11. Smoke tests: `/api/health`, `/`, and `GET /orders` → 200.
12. Runners are deleted. Images stay in GHCR.

---

## 15. Setup runbook from scratch

> **[STANDARD]**, not yet executed. Expect to adjust.

### Step 1 — Azure resources

1. Portal → create resource group `brightbuy-rg`.
2. Create VM: Ubuntu 24.04, **Standard_B1s** or **B2s**, auth **SSH public key** (download the `.pem`), username `azureuser`.
3. Public IP → **Standard SKU, static**. Set a **DNS name label**.
4. NSG inbound: **22, 80, 443** only. **Not 3306.**
5. Cost Management → budget alert.

### Step 2 — First SSH from Windows (PowerShell)

```powershell
icacls "$env:USERPROFILE\.ssh\brightbuy-vm_key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i "$env:USERPROFILE\.ssh\brightbuy-vm_key.pem" azureuser@<DOMAIN>
```

### Step 3 — Install Docker on the VM

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker azureuser     # then log out and back in
docker run hello-world
```

### Step 4 — App folder

```bash
sudo mkdir -p /opt/brightbuy/backups
sudo chown -R azureuser:azureuser /opt/brightbuy
```

### Step 5 — `.env`

Create `/opt/brightbuy/.env` from the template in §13.2, then `chmod 600 .env`.

### Step 6 — Let the VM pull private images

1. GitHub → Settings → Developer settings → Personal access tokens → new token, **`read:packages` only**.
2. On the VM: `echo <TOKEN> | docker login ghcr.io -u <github-username> --password-stdin`
3. Set a calendar reminder to rotate it in 90 days.

### Step 7 — Give GitHub a way in

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

Append `deploy_key.pub` to `/home/azureuser/.ssh/authorized_keys` on the VM. Add GitHub secrets `VM_HOST`, `VM_USER`, `VM_SSH_KEY` (the **whole private key file**, BEGIN/END lines included) and the variable `APP_DOMAIN`. Delete the local private key afterwards.

> **Copy the key through a file, never through terminal output.** Terminal copying corrupts keys and produces `error in libcrypto`.

### Step 8 — First deploy

Merge to `main`, or **Actions → Deploy to Azure → Run workflow**. Watch until green, then open `https://<DOMAIN>`.

### Step 9 — Seed the database, once

Migrations ran automatically. Seeds did not, deliberately:

```bash
cd /opt/brightbuy
docker compose -f docker-compose.prod.yml exec -T api npm run seed
```

Do this **once**. Running it again on live data is a bad day.

---

## 16. Day-to-day operations

Always start with:

```bash
ssh -i "$env:USERPROFILE\.ssh\brightbuy-vm_key.pem" azureuser@<DOMAIN>
cd /opt/brightbuy
```

| Task | Command |
|---|---|
| Container status | `docker compose -f docker-compose.prod.yml ps` |
| Follow API logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| Last 100 lines of one service | `docker compose -f docker-compose.prod.yml logs --tail 100 web` |
| Shell in the API | `docker compose -f docker-compose.prod.yml exec api sh` |
| Open the MySQL client | `docker compose -f docker-compose.prod.yml exec mysql sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'` |
| Apply new migrations | `docker compose -f docker-compose.prod.yml exec -T api npm run migrate` |
| Restart one service | `docker compose -f docker-compose.prod.yml restart api` |
| Disk usage | `docker system df` and `df -h /` |
| Variable names only | `sed 's/=.*/=<hidden>/' .env` |
| Reclaim disk | `docker image prune -a` (removes rollback images too) |

**Where to run what:** `ssh`/`scp` from your laptop; `docker compose` on the VM.

**PowerShell 5.1 notes:** use a backtick `` ` `` for line continuation, not `\`. Avoid `>` for dumps — PowerShell writes UTF-16 and MySQL will choke. Run dumps on the VM.

**Saving credit:** **deallocate** the VM when you are not demoing. The static IP survives and the containers restart themselves when it boots.

**Never run `docker compose down -v` on the VM.** The `-v` deletes `mysqldata`, which is your database.

---

## 17. Rollback

### Option A — re-run an older workflow

Actions → **Deploy to Azure** → open an older **successful** run → **Re-run all jobs**. It rebuilds that commit and redeploys it.

### Option B — instant, using images already on the VM

```bash
cd /opt/brightbuy
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<older-full-sha>/" .env
docker compose -f docker-compose.prod.yml up -d
```

Useful when GitHub is down. The next automatic deploy moves `IMAGE_TAG` forward again.

> **Neither option rolls back the database.** Images carry code only. If a migration changed the schema, you need a backup — and because migrations only ever go forward, **take a dump before applying a risky one**.

---

## 18. Database: migrations, seeds, backups

### 18.1 Migrations

- `database/migrations/*.sql`, applied in filename order, recorded in **`schema_migrations`**.
- Run automatically on every deploy; re-running is a no-op.
- **Append-only.** Never edit a merged migration — write a new numbered file. (AGENTS.md rule 7.)
- Take a dump before anything that adds a constraint to existing data.

### 18.2 Backups [TODO — nothing in place]

Until this exists, the `mysqldata` volume is the **only** copy of live data.

```cron
0 2 * * * cd /opt/brightbuy && docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' | gzip > backups/brightbuy-$(date +\%F).sql.gz
```

- `%` must be written `\%` in crontab.
- **`--routines --triggers` is essential.** BrightBuy's logic lives in stored procedures and triggers; a dump without them restores a database that cannot place an order.
- Also: delete dumps older than N days, and copy them **off the VM** — a disk failure takes the backups with it.

**Practise a restore into a throwaway database:**

```bash
docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE restore_test"'
gunzip -c backups/brightbuy-YYYY-MM-DD.sql.gz | docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" restore_test'
# compare counts, then
docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE restore_test"'
```

> An untested backup is not a backup.

---

## 19. Cost

| Item | Who pays |
|---|---|
| **Azure VM** (24/7) | You, from Azure for Students credit. The main cost. Deallocate when idle. |
| **GitHub Actions** | Free tier: 2,000 min/month for private repos, unlimited for public. |
| **GHCR storage** | Currently free. |
| **Let's Encrypt** | Free |
| **Azure DNS label** | Free |

---

## 20. Security

**Already in place [REPO]**

- Only `web` is public. MySQL and the API are on the private Docker network, with no published ports.
- The API container runs as the non-root `node` user.
- `.env` is excluded from images by `.dockerignore`.
- HTTPS is automatic; certificates persist in a volume.
- One origin, so no CORS surface in production. `CLIENT_ORIGIN` is set as a second line of defence.
- Card number, CVV and expiry are never stored — only `gateway_ref` (REQ-8.3).
- Login errors stay deliberately vague and never reveal whether the email or the password was wrong.

**Open items [TODO]**

- Rotate the GHCR read token every 90 days.
- Restrict SSH (22) to known IPs if practical.
- Set up backups (§18.2). Right now there are none.
- Never paste passwords, tokens or private keys into chat, Git or terminal output.

---

## 21. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| CI fails at **Apply migrations** with a stored-function error | `log_bin_trust_function_creators` not set. The CI step that sets it must run **before** migrate. |
| CI fails at **concurrency** | A real regression in the transaction. Read the output: more than one line with `out_of_stock_flag = 0` means the `FOR UPDATE` or the transaction boundary is wrong. |
| Deploy fails at **build** | Dockerfile error, or a case-sensitive path. **Linux is case-sensitive and Windows is not** — `Logo.png` vs `logo.png` builds locally and fails in CI. Reproduce with `docker build`. |
| Push to GHCR denied | Job lacks `packages: write`, or the image name is not lowercase. |
| `Permission denied (publickey)` | Wrong `VM_SSH_KEY`, public key missing from `authorized_keys`, or wrong `VM_USER`/`VM_HOST`. |
| `error in libcrypto` | The private key was corrupted by copy-paste. Re-add it from a file. |
| `docker compose pull` → unauthorized | The VM's GHCR token expired. Re-run `docker login ghcr.io`. |
| Site loads, **every API call 404s** | The `/api/*` matcher is not first in the Caddyfile, so requests fall through to `try_files` and get `index.html`. |
| Home page fine, **refresh on `/products/12` → 404** | `try_files {path} /index.html` missing from the last `handle` block. |
| **Stale site after a deploy** | `index.html` is being cached. It must be `no-store`. |
| API cannot reach the database | `DB_HOST` must be `mysql` (the service name), not `localhost`. Inside a container `localhost` is the container itself. |
| MySQL healthy but API restarts | Check `DB_USER`/`DB_PASSWORD` match the `MYSQL_USER`/`MYSQL_PASSWORD` the database was **first created** with. Changing them later does not alter an existing volume. |
| No HTTPS | NSG 80/443 closed, DNS label wrong, or Caddy cannot reach Let's Encrypt. `logs web`. |
| `502 Bad Gateway` | `api` is down or still starting. `docker compose ps`. |
| Disk full | `docker system df`, then `docker image prune -a`. |

---

## 22. BrightBuy-specific gotchas

Collected because each is a real trap in *this* stack.

**`--log-bin-trust-function-creators=1` is mandatory.** Migrations create stored functions and procedures. With binary logging on — the MySQL 8 default — the server refuses without this flag, and migration 007 fails. It is in the production compose and set at runtime in CI.

**The API image must mirror the repo layout.** `run-migrations.js` reads `../../database`. Flatten `server/` to `/app` and that escapes the image.

**`mysqldump` needs `--routines --triggers`.** All the order logic is in procedures and triggers. A plain dump restores a database that cannot place an order.

**`DB_HOST` is `mysql`, never `localhost`.** Inside a container, `localhost` is that container.

**MySQL credentials are fixed at volume creation.** `MYSQL_USER`/`MYSQL_PASSWORD` only take effect on an empty data directory. Changing them in `.env` later does nothing; you must recreate the volume (destroying data) or alter the user in SQL.

**`try_files` or deep links 404.** React Router owns the URL. `deploy.yml` tests `GET /orders` for this.

**`index.html` must be `no-store`.** It names hash-stamped bundles.

**Local MySQL is on 3307, production on 3306 (unpublished).** Don't copy a `DB_PORT=3307` from your laptop `.env` into the VM's.

**Linux is case-sensitive.** `client/public/Logo.png` works on Windows whatever you type; in the image it does not.

**No build args.** If you ever add a `VITE_*` variable that the client reads, it is baked in at build time and the "domain change needs no rebuild" property is lost. Prefer relative paths.

---

## 23. Status and TODO

**Live.** First deploy succeeded in 3m 15s, all jobs green, on commit `480e0f2`.

```
https://brightbuy-g13.indiasouthcentral.cloudapp.azure.com
```

**Done**

- [x] `Dockerfile.api`, `Dockerfile.web`, `.dockerignore`
- [x] `docker-compose.prod.yml`, `Caddyfile`, `.env.example`
- [x] `ci.yml` — client build, server syntax, migrate + seed + concurrency test against a real MySQL 8
- [x] `deploy.yml` — two images to GHCR, SSH deploy, migrations, smoke + deep-link tests
- [x] Verified locally end to end before Azure existed
- [x] Azure: resource group, VM, static IP, DNS label, NSG 22/80/443, 2 GB swap
- [x] Docker on the VM; `/opt/brightbuy` with a `chmod 600` `.env`
- [x] GHCR read token on the VM; SSH deploy key; three secrets + `APP_DOMAIN`
- [x] **First deploy green**, including HTTPS, `/api/health`, and `GET /orders` returning 200
- [x] `backup.sh`, shipped to the VM by the pipeline

**Still to do**

- [ ] **Install the cron entry** for `backup.sh` (one command, §18.2). The script is on the VM but nothing is calling it.
- [ ] **Practise one restore** into a throwaway database. An untested backup is not a backup.
- [ ] **Copy dumps off the VM.** A disk failure currently takes the backups with it.
- [ ] **Reboot test** — restart from the portal, confirm all three containers return by themselves.
- [ ] **Resize.** The VM has 8 GB (~$36/month); 4 GB is ample. Stop → Size → `B2als_v2` → Start.
- [ ] **Rotate the GHCR token** before it expires in 90 days.
- [ ] Restrict SSH (port 22) to known IPs if practical.

**Known gaps in the app, not the hosting**

- [ ] 22 of the 43 product images are generated mockups with the product name rendered into the artwork, so those cards show the name twice. Needs real photography; replace all 22 in one batch.
- [ ] No light theme. The navbar toggle has been removed and `forceColorScheme: 'dark'` pinned, because the `ink` ramp has no light variant — see §22.
- [ ] `GET /products` has no `sort` parameter, so sorting is client-side over the current page only.
- [ ] `sp_report_upcoming_deliveries` returns cancelled orders; needs `AND o.order_status != 'Cancelled'`.

---

## 24. Command cheat sheet

**Laptop (PowerShell)**

```powershell
ssh -i "$env:USERPROFILE\.ssh\brightbuy-vm_key.pem" azureuser@<DOMAIN>
scp -i "$env:USERPROFILE\.ssh\brightbuy-vm_key.pem" .\file.sql azureuser@<DOMAIN>:/opt/brightbuy/
curl.exe https://<DOMAIN>/api/health
curl.exe -I https://<DOMAIN>/assets/index-C6ZDJdTA.js   # expect max-age=31536000, immutable
curl.exe -I https://<DOMAIN>/                            # expect no-store
```

**Build and test the images locally**

```powershell
docker build -f infrastructure/docker/Dockerfile.api -t brightbuy-api:local .
docker build -f infrastructure/docker/Dockerfile.web -t brightbuy-web:local .
```

**On the VM (`cd /opt/brightbuy` first)**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml exec api sh
docker compose -f docker-compose.prod.yml exec -T api npm run migrate
docker compose -f docker-compose.prod.yml pull api web
docker compose -f docker-compose.prod.yml up -d
docker system df
sed 's/=.*/=<hidden>/' .env
ls -la
```

**Dangerous — read twice**

```bash
docker compose -f docker-compose.prod.yml down -v   # NEVER: deletes the database volume
docker volume rm brightbuy_mysqldata                # destroys the database
docker compose -f docker-compose.prod.yml exec -T api npm run seed   # only ONCE, on a fresh DB
```

---

*Sources of truth in the repo: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `infrastructure/docker/Dockerfile.api`, `infrastructure/docker/Dockerfile.web`, `infrastructure/azure/docker-compose.prod.yml`, `infrastructure/azure/Caddyfile`, `.dockerignore`, `server/scripts/run-migrations.js`, `client/src/api/client.js`, `client/vite.config.js`.*

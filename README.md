# ⛵ Sailing Weather Checker

A personal sailing dashboard that monitors your favourite spots and notifies you the moment wind and weather turn perfect for a voyage.

[![CI & Release](https://github.com/LambdaWP-567/sailingweatherchecker/actions/workflows/ci.yml/badge.svg)](https://github.com/LambdaWP-567/sailingweatherchecker/actions/workflows/ci.yml)

## Features

- **Interactive map** — click to drop a pin, or search by name/address; spots shown as green (sailable) / red (no-go) markers
- **Live weather cards** — current Beaufort, wind direction, temperature, wave height, cloud cover, and weather description
- **7-day forecast strip** — compact daily overview with emoji icons and Beaufort numbers; good-wind days highlighted green
- **Sailable / No-go badge** — evaluated against your personal thresholds every page load, every 15 min in the browser, and every 4 h in the backend
- **Smart notifications** — alerts fire only when conditions change from bad to good (no repeat spam); supports SendGrid, SMTP email, WhatsApp (Twilio), and MS Teams webhook
- **Snooze per spot** — silence a spot for 24 h with one tap
- **Settings page** — configure thresholds (wind, temperature, gusts, wave height, precipitation, sunny-sky toggle) and all notification credentials with a live test button per channel
- **Dark / Day mode** — toggle between High-Tech Racer (dark) and Nautical (light) themes; preference saved in browser
- **Data source** — Open-Meteo (free, no API key, uses DWD ICON models for Germany/Europe, includes marine wave data)

---

## Quick start (Docker Compose)

### Prerequisites

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker Compose V2 is available (ships with Docker Engine >= 23)
docker compose version
```

### Deploy

```bash
git clone https://github.com/LambdaWP-567/sailingweatherchecker.git
cd sailingweatherchecker

# Build and start (first run ~3–5 min on Raspberry Pi — compiles TS + installs deps)
docker compose up --build -d

# Watch logs
docker compose logs -f
```

| Service | URL |
|---|---|
| Frontend | `http://<host-ip>:9922` |
| Backend API | `http://<host-ip>:9921` |

Find your Pi's IP with `hostname -I`.

### Common operations

```bash
docker compose down           # stop containers
docker compose up -d          # start without rebuilding
docker compose up --build -d  # rebuild after a code change
git pull && docker compose up --build -d  # update to latest
```

### Backup the database

The SQLite file lives in a Docker named volume `sailing-data` and survives restarts and rebuilds.

```bash
docker run --rm \
  -v sailing-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/sailing-backup.tar.gz /data
```

---

## Running on Kubernetes (k3s on Raspberry Pi 5)

Manifests are in [k8s/sailing.yaml](k8s/sailing.yaml). They create a `sailing` namespace with two deployments, a PersistentVolumeClaim for SQLite, and LoadBalancer services.

> **k3s vs. plain Kubernetes**  
> On k3s, `LoadBalancer` services get a real node IP via Klipper LB automatically.  
> On vanilla Kubernetes (kubeadm etc.) install [MetalLB](https://metallb.universe.tf/) for bare-metal LoadBalancer support, or change the service type to `NodePort` (note: 9921/9922 are outside the default 30000–32767 range — adjust `--service-node-port-range` in kube-apiserver or change the ports in the manifest).

### 1. Install k3s (one-time)

```bash
curl -sfL https://get.k3s.io | sh -

mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

kubectl get nodes   # wait until Ready
```

### 2. Deploy

```bash
git clone https://github.com/LambdaWP-567/sailingweatherchecker.git
cd sailingweatherchecker

kubectl apply -f k8s/sailing.yaml
kubectl get pods -n sailing -w   # watch pods start
```

### 3. Access

```bash
kubectl get svc -n sailing   # shows external IPs
```

| Service | Port | URL |
|---|---|---|
| Frontend | 9922 | `http://<pi-ip>:9922` |
| Backend API | 9921 | `http://<pi-ip>:9921` |

### 4. Useful commands

```bash
# Logs
kubectl logs -n sailing -l app=sailing-api -f
kubectl logs -n sailing -l app=sailing-app -f

# Restart after a config change
kubectl rollout restart deployment/sailing-api -n sailing
kubectl rollout restart deployment/sailing-app -n sailing

# Shell into the backend
kubectl exec -it -n sailing deploy/sailing-api -- sh
```

### 5. Update to a new image

```bash
# Rolling restart picks up the new :latest
kubectl rollout restart deployment/sailing-api -n sailing
kubectl rollout restart deployment/sailing-app -n sailing

# Or pin to a specific commit SHA published by CI
kubectl set image deployment/sailing-api \
  sailing-api=ghcr.io/lambdawp-567/sailingweatherchecker-backend:<sha> -n sailing
kubectl set image deployment/sailing-app \
  sailing-app=ghcr.io/lambdawp-567/sailingweatherchecker-frontend:<sha> -n sailing
```

### 6. Backup the database

```bash
kubectl cp sailing/$(kubectl get pod -n sailing -l app=sailing-api \
  -o jsonpath='{.items[0].metadata.name}'):/app/data/sailing.db ./sailing-backup.db
```

### 7. Tear down

```bash
kubectl delete -f k8s/sailing.yaml
# PVC is deleted with the manifest — omit the PVC line below if you want to keep the data:
kubectl delete pvc sailing-data -n sailing
```

---

## Local development (without Docker)

### Backend

```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies API calls to :3001)
```

---

## Render deployment

A `render.yaml` blueprint is included for one-click deployment on [Render](https://render.com).

### Backend (Web Service)

| Field | Value |
|---|---|
| Environment | Node |
| Build Command | `npm install && npm run build --workspace backend` |
| Start Command | `npm start --workspace backend` |
| Disk | Mount a persistent disk at `/app/data` |
| Env var | `DB_PATH=/app/data/sailing.db` |

### Frontend (Static Site)

| Field | Value |
|---|---|
| Build Command | `npm install && npm run build --workspace frontend` |
| Publish Directory | `frontend/dist` |
| Rewrite rule | `/* → /index.html  200` |

Set `VITE_API_URL` to your Render backend URL if the two services are on separate domains.

---

## CI / CD

GitHub Actions runs on every push and pull request to `main`:

1. **Test** — installs dependencies and runs `vitest` for both backend and frontend (Node 20)
2. **Build & push** — on pushes to `main` or version tags, builds multi-arch Docker images (`linux/amd64` + `linux/arm64`) and pushes to GitHub Container Registry
3. **Release** — on `v*` tags, creates a GitHub Release with auto-generated notes

Images are published to:
- `ghcr.io/lambdawp-567/sailingweatherchecker-backend`
- `ghcr.io/lambdawp-567/sailingweatherchecker-frontend`

Tags: `latest` (main branch), `v<semver>` (tagged releases), `sha-<commit>` (every build).

---

## Testing

```bash
# Run all backend tests
npm run test --workspace backend

# Run in watch mode during development
cd backend && npx vitest
```

The test suite (32 tests across 4 files) covers:

| File | What it tests |
|---|---|
| `tests/notifications.test.ts` | Unit tests for every notification channel — SendGrid, SMTP email, WhatsApp (Twilio), MS Teams; skip-on-missing-config logic; error propagation |
| `tests/settings.test.ts` | Integration tests for `POST /api/settings/test-notification` — all channels return `ok`/`skipped`/error-message correctly; SendGrid bad-key and unverified-sender errors surface in the response |
| `tests/api.test.ts` | Basic smoke tests for `/api/health`, `/api/spots`, `/api/settings` |
| `tests/beaufort.test.ts` | Beaufort scale conversion utility |

All tests use Vitest with full ESM mocking (`vi.hoisted`) — no network calls, no native SQLite required.

---

## Settings reference

### Sailing thresholds

| Setting | Default | Notes |
|---|---|---|
| Min Wind | 2 Bft | Lower bound for "good conditions" |
| Max Wind | 4 Bft | Upper bound for "good conditions" |
| Min Temp | 15 °C | Below this → no notification |
| Max Gusts | 25 km/h | Above this → no notification |
| Max Wave Height | 1.0 m | 0 = ignore waves (lakes / inland water) |
| Max Precipitation | 0 mm | 0 = no rain allowed |
| Sunny Skies Only | on | Requires cloud cover < 30 % and clear/mainly-clear WMO code |

### Notification channels

| Channel | Required fields |
|---|---|
| **SendGrid** | API key · From address (must be a verified sender in your SendGrid account) · To address |
| **SMTP Email** | Host · Port · Username · Password · From address · To address |
| **WhatsApp (Twilio)** | Account SID · Auth Token · From number · To number |
| **MS Teams** | Incoming Webhook URL |

Use the **Test** tab in Settings to send a test message to every configured channel before relying on alerts.

---

## Weather data sources (all free, no API key required)

| Data | Source |
|---|---|
| Current weather + 7-day forecast | [Open-Meteo](https://open-meteo.com/) — DWD ICON model for Germany/Europe |
| Marine wave height | [Open-Meteo Marine API](https://marine-api.open-meteo.com/) |
| Geocoding (place name → coordinates) | [Nominatim / OpenStreetMap](https://nominatim.org/) (proxied through backend) |
| Map tiles | [OpenStreetMap](https://www.openstreetmap.org/) via Leaflet |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Tailwind CSS v4 · Vite · Leaflet / react-leaflet |
| Backend | Node.js · Express 5 · TypeScript · SQLite (better-sqlite3) · node-cron |
| Notifications | `@sendgrid/mail` · nodemailer · twilio · axios (Teams webhook) |
| Testing | Vitest 2 · supertest |
| Container | Docker · Docker Compose · multi-arch (amd64 + arm64) |
| Orchestration | Kubernetes / k3s |
| CI/CD | GitHub Actions → GitHub Container Registry |

---

*Fair winds and following seas!*

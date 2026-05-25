# ⛵ Sailing Weather Checker

A single-user sailing dashboard that monitors your favourite spots and notifies you the moment wind and weather turn perfect for a voyage.

## Features

- **Interactive map** — click to drop a pin, or search by name/address; spots shown as green (sailable) / red (no go) markers
- **Live weather cards** — current Beaufort, wind direction, temperature, wave height, cloud cover, and weather description
- **7-day forecast strip** — compact daily overview with emoji icons and Beaufort numbers; good-wind days highlighted green
- **Sailable / No go badge** — evaluated against your personal thresholds every page load, every 15 min, and every 4 h in the backend
- **Smart notifications** — alerts fire only when conditions change from bad to good (no repeat spam); supports WhatsApp (Twilio), Email (SMTP), and MS Teams webhook
- **Snooze per spot** — silence a spot for 24 h with one tap
- **Settings page** — configure Beaufort range, min temperature, max gusts, max wave height, precipitation, sunny-sky toggle, and all notification credentials with a live test button
- **Dark / Day mode** — toggle between High-Tech Racer (dark) and Nautical (light) themes; preference saved in browser
- **Data source** — Open-Meteo (free, no API key, uses DWD ICON models for Germany/Europe, includes marine wave data)

---

## Running on Raspberry Pi 5

### Prerequisites (one-time setup)

```bash
# Install Docker Engine (not the legacy package)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker Compose V2 is available (ships with Docker Engine >= 23)
docker compose version
```

### Deploy

```bash
# Clone
git clone https://github.com/fishbeef/sailingweatherchecker.git
cd sailingweatherchecker

# Build and start (first run takes ~3–5 min on Pi 5 — it compiles TypeScript + installs npm deps inside the container)
docker compose up --build -d

# Watch logs
docker compose logs -f
```

Access:
- Frontend: **http://\<pi-ip-address\>:9922**
- Backend API: **http://\<pi-ip-address\>:9921**

Find your Pi's IP with `hostname -I`.

### Stop / restart

```bash
docker compose down        # stop
docker compose up -d       # start again (no rebuild)
docker compose up --build -d  # rebuild after a code change
```

### Data persistence

The SQLite database is stored in a Docker named volume `sailing-data`. It survives container restarts and rebuilds. To back it up:

```bash
docker run --rm -v sailing-data:/data -v $(pwd):/backup alpine tar czf /backup/sailing-backup.tar.gz /data
```

### Update to latest code

```bash
git pull
docker compose up --build -d
```

---

## Running on Kubernetes (Raspberry Pi 5 with k3s)

The manifests live in [k8s/sailing.yaml](k8s/sailing.yaml). They create a dedicated `sailing` namespace with two deployments, a PersistentVolumeClaim for the SQLite database, and LoadBalancer services on your chosen ports.

> **k3s vs. plain Kubernetes**
> On k3s, `LoadBalancer` services get a real node IP automatically via Klipper LB — no extra setup needed.
> On vanilla Kubernetes (kubeadm etc.) you need [MetalLB](https://metallb.universe.tf/) for bare-metal LoadBalancer support, or change the service type to `NodePort` (note: 9921/9922 are outside the default 30000–32767 NodePort range — either change the ports in the manifest or set `--service-node-port-range=9900-10000` in kube-apiserver).

### 1. Install k3s (one-time)

```bash
curl -sfL https://get.k3s.io | sh -

# Allow your user to run kubectl without sudo
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

# Verify the node is ready (may take 30 s)
kubectl get nodes
```

### 2. Deploy

```bash
# Pull the repo if you haven't already
git clone https://github.com/fishbeef/sailingweatherchecker.git
cd sailingweatherchecker

# Apply all manifests (namespace, PVC, deployments, services)
kubectl apply -f k8s/sailing.yaml

# Watch pods come up
kubectl get pods -n sailing -w
```

### 3. Access the app

```bash
# Get the external IPs assigned by Klipper LB
kubectl get svc -n sailing
```

| Service | Port | URL |
|---|---|---|
| Frontend | 9922 | `http://<pi-ip>:9922` |
| Backend API | 9921 | `http://<pi-ip>:9921` |

### 4. Useful commands

```bash
# View logs
kubectl logs -n sailing -l app=sailing-api -f
kubectl logs -n sailing -l app=sailing-app -f

# Restart a deployment (e.g. after a config change)
kubectl rollout restart deployment/sailing-api -n sailing
kubectl rollout restart deployment/sailing-app -n sailing

# Check deployment status
kubectl rollout status deployment/sailing-api -n sailing

# Open a shell in the backend pod
kubectl exec -it -n sailing deploy/sailing-api -- sh
```

### 5. Update to a new image

```bash
# Pull latest images and restart (if using :latest tag)
kubectl rollout restart deployment/sailing-api -n sailing
kubectl rollout restart deployment/sailing-app -n sailing

# Or pin to a specific commit SHA from CI
kubectl set image deployment/sailing-api \
  sailing-api=ghcr.io/fishbeef/sailingweatherchecker-backend:<sha> -n sailing
```

### 6. Backup the database

```bash
# Copy the SQLite file out of the running pod
kubectl cp sailing/$(kubectl get pod -n sailing -l app=sailing-api -o jsonpath='{.items[0].metadata.name}'):/app/data/sailing.db ./sailing-backup.db
```

### 7. Tear down

```bash
kubectl delete -f k8s/sailing.yaml
# The PersistentVolumeClaim (and your data) is deleted too — omit if you want to keep it:
kubectl delete -f k8s/sailing.yaml --ignore-not-found
kubectl delete pvc sailing-data -n sailing  # only when you're sure
```

---

## Running locally (Mac / Linux, without Docker)

### Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:3001
```

### Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:5173 with API proxy to :3001
```

---

## Render deployment

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

Set `VITE_API_URL` env var on the frontend to your Render backend URL if the two services are on separate domains.

---

## Configuration (Settings page)

| Setting | Default | Notes |
|---|---|---|
| Min Wind | 2 Bft | Lower bound for "good conditions" |
| Max Wind | 4 Bft | Upper bound for "good conditions" |
| Min Temp | 15 °C | Below this → no notification |
| Max Gusts | 25 km/h | Above this → no notification |
| Max Wave Height | 1.0 m | 0 = ignore waves (e.g. lakes) |
| Max Precipitation | 0 mm | 0 = no rain allowed |
| Sunny Skies Only | on | Requires cloud cover < 30 % and clear/mainly-clear WMO code |

Notification credentials (Twilio, SMTP, Teams) are also set here. Use **Test Notification** to verify before relying on alerts.

---

## Weather data sources (all open-source / free)

| Data | Source | API key? |
|---|---|---|
| Current weather + 7-day forecast | [Open-Meteo](https://open-meteo.com/) — DWD ICON model for Germany | None |
| Marine wave height | [Open-Meteo Marine API](https://marine-api.open-meteo.com/) | None |
| Geocoding (name → coordinates) | [Nominatim / OpenStreetMap](https://nominatim.org/) | None |
| Map tiles | [OpenStreetMap](https://www.openstreetmap.org/) via Leaflet | None |

---

*Fair winds and following seas!*

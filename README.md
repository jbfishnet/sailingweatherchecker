# ⛵ Sailing Weather Checker

A high-tech, single-user dashboard for sailors to monitor their favorite spots and get notified when the wind and weather are perfect for a voyage.

## 🚀 Features
- **Modern "High-Tech Racer" UI**: Dark mode with neon highlights, carbon fiber aesthetics, and mobile-ready design.
- **Smart Spot Monitoring**: Add spots via name search or coordinate paste.
- **Custom Thresholds**: Configure your ideal wind range (Beaufort), minimum temperature, wave height, and cloud cover.
- **Notifications**: Get alerted via WhatsApp (Twilio), Email (SMTP), or MS Teams Webhooks when conditions turn from bad to good.
- **Snooze**: Mute specific spots for 24 hours with a single click.
- **Data Persistence**: Uses SQLite for lightweight, reliable storage (Docker volume mapped).

## 🛠 Tech Stack
- **Frontend**: React, Tailwind CSS, Vite, Lucide Icons, Axios.
- **Backend**: Node.js, Express, SQLite, node-cron.
- **Data Source**: Open-Meteo (Open Source, includes DWD ICON models).

## 📦 Local Deployment (Docker)

1. **Clone the repo**
2. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
3. **Access the app**:
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:3001](http://localhost:3001)

4. **Persistence**:
   The database is stored in a Docker volume named `sailing-data`.

## ☁️ Render Deployment

1. **New Web Service (Backend)**:
   - Environment: Node
   - Build Command: `npm install && npm run build --workspace backend`
   - Start Command: `npm start --workspace backend`
   - Disk: Add a persistent disk at `/app/data`
   - Env Var: `DB_PATH=/app/data/sailing.db`

2. **New Static Site (Frontend)**:
   - Build Command: `npm install && npm run build --workspace frontend`
   - Publish Directory: `frontend/dist`
   - Redirects: `/* /index.html 200`

## ⚙️ Configuration
Go to the **Settings** page in the app to configure:
- **Wind Range**: Default 2-4 Beaufort.
- **Weather**: "Sunny Skies" toggle.
- **Credentials**: Twilio SID/Token, SMTP details, or Teams Webhooks.
- **Verification**: Use the "Test Notification" button to ensure your credentials are correct.

---
*Fair winds and following seas!*

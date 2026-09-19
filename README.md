<div align="center">

# good samaritan

**A documented software project by [Bhuvaneshwaran S](https://github.com/bhuvanesh6566).**

[![GitHub](https://img.shields.io/badge/GitHub-bhuvanesh6566-181717?logo=github)](https://github.com/bhuvanesh6566)
[![Issues](https://img.shields.io/github/issues/bhuvanesh6566/good_samaritan)](https://github.com/bhuvanesh6566/good_samaritan/issues)

[Source Code](https://github.com/bhuvanesh6566/good_samaritan) · [Report a Bug](https://github.com/bhuvanesh6566/good_samaritan/issues)

</div>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## About

This README uses a consistent project-documentation format while preserving the repository's existing technical documentation below.

## Features

- ✅ Project-specific functionality documented below
- ✅ Setup and usage information
- ✅ Extensible project structure

## Tech Stack

See the project documentation below for the technologies used by this repository.

## Getting Started

Clone the repository and follow the project-specific setup instructions below.

```bash
git clone https://github.com/bhuvanesh6566/good_samaritan.git
cd good_samaritan
```

## Usage

Use the project-specific commands documented below.

## Project Structure

Refer to the repository tree and the detailed documentation below.

## Roadmap

- [ ] Add screenshots or demo GIF
- [ ] Expand setup/troubleshooting documentation
- [ ] Add automated testing documentation

## Contributing

Open an issue for bugs or feature requests, then submit focused pull requests with clear descriptions.

## License

See [LICENSE](LICENSE) if present.

---

# Project Documentation

# 🚨 RescueLink AI

> *Every second counts. Be the help.*

A scalable Good Samaritan emergency response platform for road accident victims in India. Built as a hackathon submission addressing India's 1.77 lakh annual road fatalities.

---

## 🏗️ Architecture

```
One-Tap Emergency
      │
 GPS + Photo + User
      │
  Express API (port 5000)
      │
 ┌────┴─────────────────┐
 MongoDB             Socket.IO
 (persist)         (real-time alerts)
      │                  │
      │       Nearby volunteers
      │       within 2km radius
      │
  Groq LLaMA AI
  (streaming voice guidance)
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| AI | Groq API (LLaMA 3.1 70B) — SSE streaming |
| Backend | Node.js + Express |
| Real-time | Socket.IO v4 |
| Database | MongoDB (2dsphere geospatial) |
| Maps | Leaflet.js + OpenStreetMap |
| Auth | JWT |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`)
- Groq API key (get free at https://console.groq.com)

### 1. Clone & Configure

```bash
# Add your Groq API key to server/.env
nano server/.env
# Set: GROQ_API_KEY=gsk_your_actual_key_here
```

### 2. Start Backend

```bash
cd server
npm install        # (already done if you followed setup)
npm run dev
# Server starts on http://localhost:5000
```

### 3. Start Frontend

```bash
cd client
npm install        # (already done if you followed setup)
npm run dev
# App opens at http://localhost:5173
```

---

## 🔑 Environment Variables

### `server/.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rescuelink
JWT_SECRET=rescuelink_jwt_super_secret_2024
GROQ_API_KEY=gsk_YOUR_GROQ_KEY_HERE
CLIENT_URL=http://localhost:5173
```

---

## 📱 Features

### 🚨 One-Tap Emergency Reporting
- Single button press captures GPS automatically
- Quick severity assessment (High/Medium/Low)
- Optional photo capture from camera
- Broadcasts to all volunteers within 2km via Socket.IO

### 🤖 AI Voice Guide (Groq LLaMA 3.1)
- Asks 5 Yes/No questions about victim's condition
- Streams personalized first-aid instructions
- Speaks instructions aloud via Web Speech API
- Works for: breathing issues, bleeding, fractures, unconsciousness

### 📡 Real-Time Volunteer Alerts
- Socket.IO pushes alerts instantly to volunteers within 2km
- Volunteer sees: distance, severity, accident photo, reporter name
- One-tap "I'm Responding" → opens Google Maps navigation
- Citizen sees: volunteer name, ETA, live map

### ⚖️ Good Samaritan Shield
- Full India Good Samaritan Law 2016 summary (simple language)
- Generates downloadable protection certificate with volunteer ID
- FAQ addressing common fears
- Always visible during emergency flow

### 📴 Offline First Aid
- CPR, Bleeding Control, Fracture, Recovery Position guides
- Fully hardcoded — works with zero connectivity
- Service Worker caches key pages

---

## 🗺️ Routes

| Route | Description | Auth |
|---|---|---|
| `/` | Landing page + stats | Public |
| `/emergency` | One-tap emergency flow | Required |
| `/volunteer` | Real-time alert dashboard | Volunteer only |
| `/shield` | Good Samaritan Law guide | Public |
| `/first-aid` | Offline first aid guide | Public |
| `/register` | Register as citizen or volunteer | Public |
| `/login` | Login | Public |

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/emergency` | Report emergency |
| GET | `/api/emergency` | List active emergencies |
| GET | `/api/emergency/:id` | Get emergency details |
| PATCH | `/api/emergency/:id/respond` | Volunteer accepts |
| PATCH | `/api/emergency/:id/resolve` | Mark resolved |
| POST | `/api/ai/guide` | Groq AI first-aid guidance (SSE) |
| GET | `/api/volunteers/nearby` | Find nearby volunteers |
| PATCH | `/api/users/location` | Update volunteer location |

## 🔴 Socket.IO Events

| Event | Direction | Payload |
|---|---|---|
| `emergency:new` | Server → Volunteers | `{ emergencyId, lat, lng, severity, reporterName }` |
| `volunteer:accepted` | Server → Citizen | `{ volunteerName, eta }` |
| `location:update` | Bidirectional | `{ lat, lng }` |
| `emergency:resolved` | Server → Room | `{ emergencyId }` |

---

## 🎯 Impact Metrics

- **Target**: Reduce response time from 30+ minutes to under 5 minutes
- **Mechanism**: Geospatial volunteer matching within 2km radius
- **Legal**: Good Samaritan Law 2016 protection displayed at every step
- **Offline**: First-aid guides cached for zero-connectivity scenarios

---

## 🧪 Demo Flow

1. Register as **Volunteer** on one browser tab
2. Go to **Volunteer Dashboard** — toggle Active
3. Register as **Citizen** on another tab
4. Click **Report Emergency** → allow location → set severity → submit
5. Watch the Volunteer tab receive the real-time alert
6. Volunteer clicks "I'm Responding"
7. Citizen sees "Help is on the way!" + volunteer name

---

## 📄 License

MIT — Built for social good. Save lives.


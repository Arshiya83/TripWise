# TripWise

**TripWise** is an AI-powered personalized travel planner and smart route optimizer web application. It simplifies trip planning by generating customized daily travel itineraries, optimizing travel routes, and helping travelers manage their journeys seamlessly.

---

## 🛠️ Technology Stack

- **Frontend**: React.js with Vite, Vanilla CSS
- **Backend**: Node.js with Express.js (REST API)
- **Database**: MongoDB with Mongoose *(Planned)*
- **AI Engine**: Google Gemini API *(Planned)*
- **Authentication**: JWT (JSON Web Tokens) + bcrypt *(Planned)*
- **Maps & Geolocation**: Leaflet, OpenStreetMap, Browser Geolocation API *(Planned)*
- **Route Optimization**: OSRM (Open Source Routing Machine) API *(Planned)*
- **Export**: PDF Itinerary Export *(Planned)*
- **Version Control**: Git + GitHub

---

## 📌 Project Status

**Current Stage**: Step 1 — Project Foundation
- [x] Initial full-stack directory structure (`frontend/` and `backend/`)
- [x] React + Vite frontend scaffolded and configured
- [x] Express.js backend initialized with health check endpoint (`/api/health`)
- [x] Modular backend directory structure (`config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/`)
- [x] Environment variable configurations (`.env.example`)
- [ ] Database integration (MongoDB)
- [ ] Authentication system (JWT + bcrypt)
- [ ] AI Itinerary Generation (Gemini API)
- [ ] Map visualization & Route optimization (Leaflet & OSRM)

---

## 📁 Project Directory Structure

```text
TripWise/
├── backend/
│   ├── config/          # Database and external service configuration
│   ├── controllers/     # Request handlers and controller logic
│   ├── middleware/      # Express middleware functions
│   ├── models/          # Mongoose data models
│   ├── routes/          # API route definitions
│   ├── services/        # External services (Gemini, routing, etc.)
│   ├── utils/           # Utility functions and helpers
│   ├── .env.example     # Backend environment template
│   ├── package.json     # Backend dependencies and scripts
│   └── server.js        # Express server entry point
├── frontend/
│   ├── public/          # Static assets
│   ├── src/             # React application source code
│   │   ├── assets/      # Frontend media and icons
│   │   ├── App.css      # App-level styling
│   │   ├── App.jsx      # Root React component
│   │   ├── index.css    # Global typography and base styles
│   │   └── main.jsx     # Vite React entry point
│   ├── .env.example     # Frontend environment template
│   ├── index.html       # HTML entry point
│   ├── package.json     # Frontend dependencies and scripts
│   └── vite.config.js   # Vite configuration
├── .env.example         # Root environment variables template
├── .gitignore           # Git ignore rules
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended, tested on Node v24+)
- **npm** (v9 or higher)

### 2. Backend Setup & Run

Open a terminal and navigate to the backend folder:

```bash
cd backend
npm install
npm run dev
```

The backend server will start at:
- **Server**: [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Frontend Setup & Run

Open a second terminal and navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

The frontend application will start at:
- **Application URL**: [http://localhost:5173](http://localhost:5173)

---

## 🔒 Environment Configuration

Copy the sample environment files before running the apps:

```bash
# For backend
cp backend/.env.example backend/.env

# For frontend
cp frontend/.env.example frontend/.env
```

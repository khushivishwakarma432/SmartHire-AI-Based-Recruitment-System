# SmartHire

SmartHire is a full-stack AI-assisted recruitment workspace for managing jobs, evaluating candidates, and making faster hiring decisions.

## Features
- Role management (create, edit, and manage jobs)
- Candidate uploads and AI scoring
- Recruiter review workflow with tags and decisions
- Candidate comparison view
- Interview scheduling and calendar
- Analytics dashboard and activity insights
- Dark/light theme support

## Tech Stack
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB
- AI: Google Gemini API

## Project Structure
- `client/` - frontend application
- `server/` - backend application

## Local Setup

### 1) Backend
```bash
cd server
npm install
```

Create `server/.env`:
```bash
PORT=5002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

### 2) Frontend
```bash
cd client
npm install
```

Create `client/.env`:
```bash
VITE_API_BASE_URL=http://localhost:5002
```

Start frontend:
```bash
npm run dev
```

## Environment Variables

### Backend (`server/.env`)
- `PORT` - Server port (default: 5002)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `GEMINI_API_KEY` - Gemini API key for AI scoring
- `EMAIL_USER` - Email username (used for report delivery)
- `EMAIL_PASS` - Email password (used for report delivery)
- `CLIENT_URL` - Deployed frontend URL for CORS (comma-separated allowed origins supported)

### Frontend (`client/.env`)
- `VITE_API_BASE_URL` - Base URL of the backend API

## Deployment

### Frontend (Vercel)
1. Create a new Vercel project and import the `client/` folder.
2. Set the following build settings:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variable:
   - `VITE_API_BASE_URL` = `https://<your-render-backend>.onrender.com`
4. Deploy.

### Backend (Render)
1. Create a new Web Service in Render and connect the `server/` folder.
2. Set the build and start commands:
   - Build Command: `npm install`
   - Start Command: `npm start` (or `node src/index.js` if you prefer)
3. Add environment variables:
   - `PORT` (Render provides this automatically)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `CLIENT_URL` = `https://<your-vercel-frontend>.vercel.app`
4. Deploy.

## Production Readiness Notes
- The backend uses `CLIENT_URL` for CORS and supports comma-separated origins.
- The frontend uses `VITE_API_BASE_URL` for all API calls.
- Ensure `GEMINI_API_KEY` is set in production to enable AI scoring.

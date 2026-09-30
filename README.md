# Resume Analyser

## Run locally

1. Copy `Backend/.env.example` to `Backend/.env` and set your MongoDB URI, a private JWT secret, and Google Gemini API key.
2. Start the API from `Backend` with `npm install` and `npm run dev`.
3. In another terminal, start the UI from `Frontend` with `npm install` and `npm run dev`.
4. Open the Vite address (usually `http://localhost:5173`). The Vite proxy forwards `/api` requests to the backend on port 3000.

The interview flow supports PDF or DOCX resumes up to 5 MB, or a typed self-description. A job description is required. Interview creation and resume PDF export require a configured Gemini API key; accounts and reports require MongoDB.

For deployment, set `VITE_API_URL` in the frontend build and `FRONTEND_ORIGIN` on the backend. If the frontend and API are on different sites, serve both over HTTPS and configure `COOKIE_SAME_SITE=none`.

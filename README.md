# Resume Analyser

## Run locally

1. Copy `Backend/.env.example` to `Backend/.env` and set your MongoDB URI, a private JWT secret, and Google Gemini API key.
2. Start the API from `Backend` with `npm install` and `npm run dev`.
3. In another terminal, start the UI from `Frontend` with `npm install` and `npm run dev`.
4. Open the Vite address (usually `http://localhost:5173`). The Vite proxy forwards `/api` requests to the backend on port 3000.

The interview flow accepts PDF or DOCX resumes up to 5 MB, or a typed self-description. A job description is required. Interview creation and resume PDF export require a configured Gemini API key; accounts and reports require MongoDB.

## Deploy

This repository is configured for a Vercel frontend and a Render API. The Render API uses Docker so Puppeteer has the system libraries it needs to export PDFs.

### 1. Deploy the API to Render

1. In Render, create a new **Blueprint** and connect this GitHub repository. Render reads the root `render.yaml` and builds `Backend/Dockerfile`.
2. Set the prompted `MONGO_URI` to your MongoDB Atlas connection string and `GOOGLE_GENAI_API_KEY` to your Google AI Studio key. Render generates `JWT_SECRET` automatically.
3. In Atlas, create an application database user and allow network access from Render. Keep the database user limited to the app's database.
4. After the service is live, copy its HTTPS URL, such as `https://resume-analyser-api.onrender.com`.

### 2. Deploy the UI to Vercel

1. Import the same GitHub repository as a new Vercel project and set **Root Directory** to `Frontend`.
2. Replace `replace-with-render-service.onrender.com` in `Frontend/vercel.json` with the hostname from the Render URL (without `https://` or a trailing slash), commit and push that change, then deploy the Vercel project. Leave `VITE_API_URL` unset; Vercel proxies `/api` to Render.
3. Copy the Vercel production URL and set Render's `FRONTEND_ORIGIN` to that exact origin, for example `https://your-project.vercel.app` (no trailing slash). Save and redeploy the API.

The Vercel proxy keeps API calls same-origin in the browser, so the auth cookie can remain `SameSite=Lax; Secure`; React routes fall back to the app entry page, and the full 5 MB resume limit stays available.

Before launch, rotate any database credentials or signing secrets that were previously committed to Git history, then use only the new values in Render's environment settings.

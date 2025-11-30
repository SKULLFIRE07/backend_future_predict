# Deployment Guide

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages when you push to the `main` branch.

### Setup Steps:

1. **Enable GitHub Pages in your repository:**
   - Go to your repository Settings → Pages
   - Source: GitHub Actions
   - Save

2. **Update API Base URL for production:**
   - The frontend is configured to use `/climate/` as base path
   - Update `frontend/src/api/client.ts` to point to your backend API URL in production

3. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Deployment will happen automatically:**
   - Check Actions tab in GitHub to see deployment progress
   - Once complete, your app will be available at: `https://<your-username>.github.io/climate/`

### Backend Deployment

For the backend, you can deploy to:
- Heroku
- Railway
- Render
- Fly.io
- AWS/GCP/Azure

Update the `API_BASE_URL` in `frontend/src/api/client.ts` to point to your deployed backend.

### Local Development

1. **Start backend:**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Access at `http://localhost:5173`


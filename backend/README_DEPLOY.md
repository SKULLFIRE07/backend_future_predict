# 🚀 Backend Deployment Guide

## Quick Deploy to Render (Recommended - Free)

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **Click "New +"** → **"Web Service"**
4. **Connect your repository**: `SKULLFIRE07/backend_future_predict`
5. **Configure**:
   - **Name**: `backend-future-predict` (or any name)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Add Environment Variable** (optional):
     - Key: `GOOGLE_MAPS_API_KEY`
     - Value: Your Google Maps API key (if you have one)

6. **Click "Create Web Service"**
7. **Wait for deployment** (2-3 minutes)
8. **Copy your backend URL** (e.g., `https://backend-future-predict.onrender.com`)

9. **Update Frontend API URL**:
   - Go to GitHub repository Settings → Secrets and variables → Actions
   - Add new secret:
     - Name: `VITE_API_BASE_URL`
     - Value: Your Render backend URL (e.g., `https://backend-future-predict.onrender.com`)
   - Trigger frontend redeployment by pushing a commit or running workflow manually

## Alternative: Deploy to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Python
6. Set root directory to `backend/`
7. Add environment variable if needed
8. Deploy!

## After Backend is Deployed

1. Test backend: Visit `https://your-backend-url.herokuapp.com/health`
2. Should return: `{"status": "ok"}`
3. Update frontend to use your backend URL (see steps above)
4. Frontend will automatically rebuild and redeploy

---

**Your backend will be accessible at**: `https://your-deployed-url.com`


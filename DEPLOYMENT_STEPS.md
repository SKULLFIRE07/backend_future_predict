# 🚀 GitHub Pages Deployment Steps

## ✅ Step 1: Enable GitHub Pages (DONE!)
You've already enabled GitHub Pages in repository settings with source: **GitHub Actions**

## 📋 Step 2: Check Deployment Status

1. **Go to your repository**: https://github.com/SKULLFIRE07/backend_future_predict
2. **Click on "Actions" tab** (top navigation)
3. **You should see**:
   - "Deploy to GitHub Pages" workflow running or completed
   - If it's running, wait for it to complete (usually 2-3 minutes)
   - If it failed, check the error logs

## 🔧 Step 3: Manual Trigger (If Needed)

If the workflow didn't start automatically:

1. Go to **Actions** tab
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** button (top right)
4. Select **"main"** branch
5. Click **"Run workflow"**

## 🌐 Step 4: Access Your Live Site

Once deployment completes successfully:

- **Your live site URL**: `https://skullfire07.github.io/backend_future_predict/`
- The URL will be shown in:
  - Repository Settings → Pages
  - Actions → Latest workflow run → "Deploy to GitHub Pages" job

## ⚙️ Step 5: Backend API Configuration

**Important**: The frontend needs a backend API URL. You have two options:

### Option A: Deploy Backend to Cloud (Recommended)

1. **Deploy backend to**:
   - Heroku: https://www.heroku.com
   - Railway: https://railway.app
   - Render: https://render.com
   - Fly.io: https://fly.io

2. **Set Environment Variable**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add new repository secret:
     - Name: `VITE_API_BASE_URL`
     - Value: `https://your-backend-url.herokuapp.com` (or your deployed URL)
   
3. **Update frontend build**:
   - The build will automatically use `VITE_API_BASE_URL` from environment

### Option B: Use Localhost for Testing

For local testing, the frontend will use `http://localhost:8000` by default.

## 🔄 Step 6: Future Updates

Every time you push to `main` branch:
- GitHub Actions automatically rebuilds and deploys
- No manual steps needed!

## 📝 Troubleshooting

### Workflow Failed?

1. Check Actions tab for error logs
2. Common issues:
   - Build errors: Check frontend dependencies
   - Deployment errors: Verify GitHub Pages settings
   - Missing files: Ensure all files are committed

### Site Not Loading?

1. Check if deployment completed successfully
2. Wait 1-2 minutes after deployment (propagation delay)
3. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
4. Check browser console for errors

### API Errors?

1. Ensure backend is deployed and accessible
2. Check CORS settings in backend
3. Verify `VITE_API_BASE_URL` is set correctly

## 📞 Need Help?

- Check Actions tab for detailed logs
- Review GitHub Pages documentation
- Check repository issues if any

---

**Your repository**: https://github.com/SKULLFIRE07/backend_future_predict


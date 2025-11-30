# Troubleshooting Guide

## "Not Found" Error

If you're seeing a "Not Found" error when entering a location like "Pune", follow these steps:

### 1. Check Backend is Running

Make sure the backend server is running. You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**To start the backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Test Backend Health

Open your browser and go to:
- http://localhost:8000/health - Should return `{"status":"ok"}`
- http://localhost:8000/ - Should show API information

If these don't work, the backend isn't running properly.

### 3. Check Frontend Connection

The frontend tries to connect to `http://localhost:8000`. Make sure:
- The backend is running on port 8000
- No firewall is blocking the connection
- You're not getting CORS errors in the browser console

### 4. Check Browser Console

Open your browser's developer console (F12) and check for:
- Network errors
- CORS errors
- JavaScript errors

### 5. Test Geocoding Directly

You can test if geocoding works by making a direct API call:

```bash
curl "https://geocoding-api.open-meteo.com/v1/search?name=Pune&count=1"
```

This should return location data.

### 6. Common Issues

**Issue: Backend not running**
- Solution: Start the backend server (see step 1)

**Issue: Port already in use**
- Solution: Kill the process using port 8000, or change the port in `backend/main.py` and `frontend/src/api/client.ts`

**Issue: Python dependencies not installed**
- Solution: Run `pip install -r backend/requirements.txt`

**Issue: Node modules not installed**
- Solution: Run `npm install` in the frontend directory

**Issue: Location not found**
- Solution: Try a more specific location like "Pune, India" or "Pune, Maharashtra, India"

### 7. Test API Endpoint Directly

Test the API endpoint with curl:

```bash
curl -X POST http://localhost:8000/api/data \
  -H "Content-Type: application/json" \
  -d '{"location": "Pune", "historical_days": 60, "forecast_days": 7}'
```

This will show you the exact error message from the backend.

### 8. Check Logs

Look at the terminal where you started the backend. It should show:
- Geocoding attempts
- API calls to weather services
- Any error messages

## Still Having Issues?

1. Make sure both backend and frontend are running
2. Check that you're using the correct ports (backend: 8000, frontend: 5173)
3. Try a simple location first (like "Pune" or "Mumbai")
4. Check the browser console and backend logs for specific error messages


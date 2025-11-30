# 🌍 AI Weather & Solar Predictor

A world-class full-stack application that provides historical, real-time, and AI-enhanced weather forecasts for any location. Uses advanced ML ensemble methods and Open-Meteo APIs to deliver accurate predictions.

![Deployment Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### Core Features
- **📍 Smart Location Search**: Enter any free-text location with live autocomplete suggestions
- **🗺️ Current Location**: Get instant weather using browser geolocation
- **📊 Historical Data**: Fetch last 60+ days of hourly weather data
- **🌡️ Current Conditions**: Real-time weather conditions display
- **🤖 Advanced ML Predictions**: Ensemble ML models (RandomForest + GradientBoosting) trained on-the-fly
- **📈 Blended Forecasts**: Optimized blend of ML predictions (60%) + API forecasts (40%)
- **⏰ Multiple Forecast Views**: Hourly (48h), Daily (7-day), and Weekly summary
- **📱 Responsive Design**: Beautiful UI that works on all devices

### Forecast Views
- **Hourly Forecast**: Next 48 hours with detailed hourly breakdown
- **Daily Forecast**: 7-day overview with daily summaries
- **Weekly Summary**: Statistical overview with averages and trends

## 🚀 Tech Stack

### Backend
- **Python 3.12+** with FastAPI
- **scikit-learn**: Ensemble ML models (RandomForest + GradientBoosting)
- **pandas & numpy**: Data processing
- **Open-Meteo APIs**: Weather data (no API keys needed)

### Frontend
- **React 18** + **TypeScript**
- **Vite**: Fast build tool
- **TailwindCSS**: Modern styling
- **Recharts**: Interactive data visualization

## 🏗️ Project Structure

```
climate/
├── backend/
│   ├── services/
│   │   ├── geocode.py          # Multi-API geocoding with fallbacks
│   │   ├── weather.py          # Weather data fetching
│   │   ├── ml.py               # Enhanced ML ensemble models
│   │   ├── geocode_autocomplete.py  # Location autocomplete
│   │   └── reverse_geocode.py  # Coordinate to address
│   ├── schemas.py              # Pydantic models
│   ├── main.py                 # FastAPI application
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── api/                # API client
│   │   └── types.ts            # TypeScript types
│   └── package.json
├── .github/workflows/          # GitHub Actions for deployment
└── README.md
```

## 🎯 ML Model Enhancements

### Advanced Features
- **Ensemble Methods**: Combines RandomForest + GradientBoosting for better accuracy
- **Feature Engineering**:
  - Lag features (up to 48 hours)
  - Rolling statistics (mean, std, min, max)
  - Time-based features (hour, day, month)
  - Cyclical encoding (sin/cos for time patterns)
  - Trend and difference features
- **Adaptive Weighting**: ML predictions get 60% weight (vs 40% API) for better local pattern capture
- **Smart Fallbacks**: Automatically adjusts complexity based on available data

### Model Details
- **Algorithms**: RandomForestRegressor (100 trees) + GradientBoostingRegressor (100 trees)
- **Training**: On-the-fly per location using historical data
- **Features**: Up to 50+ engineered features from time series
- **Target Variables**: Temperature, Solar Radiation, Wind Speed
- **Blending**: 60% ML + 40% API for optimal accuracy

## 📦 Setup Instructions

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Run the server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🌐 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages!

### Quick Deploy Steps:

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: **GitHub Actions**
   - Save

2. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Automatic deployment:**
   - GitHub Actions will build and deploy automatically
   - Check Actions tab for deployment status
   - App will be live at: `https://<username>.github.io/climate/`

### Backend Deployment

For production, deploy backend to:
- **Heroku** / **Railway** / **Render** / **Fly.io**
- Update `VITE_API_BASE_URL` environment variable in GitHub Pages settings

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guide.

## 💻 Usage

1. Start both backend and frontend servers
2. Open `http://localhost:5173` in your browser
3. **Search for a location** or click **"My Location"**
4. View comprehensive weather data:
   - Current conditions
   - Historical trends
   - Hourly/Daily/Weekly forecasts
   - AI-powered predictions
   - Interactive charts

## 📡 API Endpoints

### `GET /health`
Health check endpoint.

### `GET /api/autocomplete?q=<query>`
Get location autocomplete suggestions.

### `GET /api/reverse-geocode?latitude=<lat>&longitude=<lon>`
Convert coordinates to human-readable address.

### `POST /api/data`
Main endpoint for weather data.

**Request:**
```json
{
  "location": "Pune, India",
  "historical_days": 60,
  "forecast_days": 7
}
```

Or use coordinates:
```json
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "historical_days": 60,
  "forecast_days": 7
}
```

## 🔍 Data Sources

### Geocoding (Multiple APIs with Fallbacks)
- **Open-Meteo Geocoding** (Primary)
- **Nominatim (OpenStreetMap)** (Fallback)
- **GeoCode.xyz** (Final Fallback)
- **Google Maps** (Optional, requires API key)

### Weather Data
- **Historical**: `https://archive-api.open-meteo.com/v1/archive`
- **Forecast**: `https://api.open-meteo.com/v1/forecast`

All APIs are free and require no API keys (except optional Google Maps).

## 🎨 UI Features

- **Modern Glassmorphism Design**: Beautiful glassmorphic cards
- **Smooth Animations**: Fade-in, slide transitions, hover effects
- **Interactive Charts**: Zoom, tooltip, legend controls
- **Responsive Layout**: Works perfectly on mobile, tablet, desktop
- **Dark/Light Theme Ready**: Easy to extend with theme switching
- **Loading States**: Beautiful loading animations
- **Error Handling**: User-friendly error messages

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using FastAPI, React, and scikit-learn**

"""
Enhanced ML model training and forecasting service.
Uses advanced features and ensemble methods for better accuracy.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def create_advanced_features(series: pd.Series, lags: int = 24) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Create advanced features from time series including:
    - Lag features
    - Rolling statistics (mean, std, min, max)
    - Time-based features (hour, day of week, etc.)
    - Trend features
    - Difference features
    
    Args:
        series: Time series data with datetime index
        lags: Number of lag features to create
        
    Returns:
        DataFrame with features and target
    """
    df = series.to_frame(name='value')
    df = df.dropna()
    
    if len(df) < lags + 10:
        # Fallback to simple features if not enough data
        return create_simple_features(series, lags)
    
    # Create datetime index if not present
    if not isinstance(df.index, pd.DatetimeIndex):
        if 'time' in df.columns:
            df.index = pd.to_datetime(df['time'])
        else:
            df.index = pd.date_range(start='2020-01-01', periods=len(df), freq='H')
    
    # Lag features
    for i in range(1, min(lags + 1, 48)):  # Up to 48 lags
        df[f'lag_{i}'] = df['value'].shift(i)
    
    # Rolling statistics (short-term patterns)
    for window in [3, 6, 12, 24]:
        if len(df) > window:
            df[f'rolling_mean_{window}'] = df['value'].rolling(window=window, min_periods=1).mean()
            df[f'rolling_std_{window}'] = df['value'].rolling(window=window, min_periods=1).std()
            df[f'rolling_min_{window}'] = df['value'].rolling(window=window, min_periods=1).min()
            df[f'rolling_max_{window}'] = df['value'].rolling(window=window, min_periods=1).max()
    
    # Difference features (rate of change)
    df['diff_1'] = df['value'].diff(1)
    df['diff_24'] = df['value'].diff(24)  # Daily difference
    
    # Time-based features
    df['hour'] = df.index.hour
    df['day_of_week'] = df.index.dayofweek
    df['day_of_month'] = df.index.day
    df['month'] = df.index.month
    
    # Cyclical encoding for time features
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
    
    # Trend features
    df['trend'] = np.arange(len(df))
    df['value_ma'] = df['value'].rolling(window=24, min_periods=1).mean()
    
    # Remove rows with NaN (from lag features)
    df = df.dropna()
    
    # Separate features and target
    feature_cols = [col for col in df.columns if col != 'value']
    X = df[feature_cols].copy()
    y = df['value'].copy()
    
    return X, y


def create_simple_features(series: pd.Series, lags: int = 24) -> Tuple[pd.DataFrame, pd.Series]:
    """Fallback to simple lag features if not enough data."""
    clean_series = series.dropna()
    
    if len(clean_series) < lags + 1:
        lags = max(1, len(clean_series) // 2)
    
    X_list = []
    y_list = []
    
    for i in range(lags, len(clean_series)):
        X_list.append(clean_series.iloc[i-lags:i].values)
        y_list.append(clean_series.iloc[i])
    
    X = pd.DataFrame(X_list, columns=[f"lag_{j+1}" for j in range(lags)])
    y = pd.Series(y_list)
    
    return X, y


def train_ensemble_model(series: pd.Series, lags: int = 24) -> Tuple[dict, int]:
    """
    Train an ensemble of models for better accuracy.
    Uses RandomForest and GradientBoosting, then combines them.
    
    Args:
        series: Time series data with datetime index
        lags: Number of lag features to use
        
    Returns:
        Dictionary with trained models and their weights
    """
    try:
        # Create advanced features
        if len(series.dropna()) > 100 and isinstance(series.index, pd.DatetimeIndex):
            X, y = create_advanced_features(series, lags=lags)
        else:
            X, y = create_simple_features(series, lags=lags)
            lags = X.shape[1]
        
        if len(X) < 10:
            raise ValueError("Not enough data for training")
        
        # Train RandomForest (good for non-linear patterns)
        rf_model = RandomForestRegressor(
            n_estimators=100,  # Increased for better accuracy
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            max_features='sqrt'
        )
        rf_model.fit(X, y)
        
        # Train GradientBoosting (good for sequential patterns)
        gb_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=8,
            learning_rate=0.1,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            max_features='sqrt'
        )
        gb_model.fit(X, y)
        
        # Calculate model weights based on training score (simplified)
        rf_score = rf_model.score(X, y)
        gb_score = gb_model.score(X, y)
        
        total_score = rf_score + gb_score
        if total_score > 0:
            rf_weight = rf_score / total_score
            gb_weight = gb_score / total_score
        else:
            rf_weight = 0.5
            gb_weight = 0.5
        
        models = {
            'rf': rf_model,
            'gb': gb_model,
            'weights': {'rf': rf_weight, 'gb': gb_weight}
        }
        
        logger.info(f"Trained ensemble model with RF weight: {rf_weight:.3f}, GB weight: {gb_weight:.3f}")
        
        return models, lags
        
    except Exception as e:
        logger.warning(f"Ensemble training failed: {str(e)}, falling back to simple model")
        X, y = create_simple_features(series, lags=lags)
        lags = X.shape[1]
        
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X, y)
        
        return {'rf': model, 'gb': None, 'weights': {'rf': 1.0, 'gb': 0.0}}, lags


def forecast_with_ensemble(models: dict, series: pd.Series, steps: int, lags: int) -> List[float]:
    """
    Generate forecasts using ensemble of models.
    
    Args:
        models: Dictionary with trained models
        series: Historical time series
        steps: Number of future steps to predict
        lags: Number of lag features
        
    Returns:
        List of predicted values
    """
    clean_series = series.dropna()
    
    if len(clean_series) < lags:
        last_value = clean_series.iloc[-1] if len(clean_series) > 0 else 0.0
        return [float(last_value)] * steps
    
    # Ensure datetime index
    if not isinstance(clean_series.index, pd.DatetimeIndex):
        clean_series.index = pd.date_range(start='2020-01-01', periods=len(clean_series), freq='H')
    
    predictions_rf = []
    predictions_gb = []
    
    # Get last window of data
    window = clean_series.iloc[-lags:].copy()
    
    for step in range(steps):
        # Create features for this step
        try:
            if len(window) > 48 and isinstance(window.index, pd.DatetimeIndex):
                # Use advanced features
                window_df = window.to_frame(name='value')
                X, _ = create_advanced_features(window, lags=min(lags, len(window)))
                
                # Get last row for prediction
                if len(X) > 0:
                    X_pred = X.iloc[[-1]]
                else:
                    # Fallback
                    X_pred = pd.DataFrame([window.iloc[-lags:].values], 
                                         columns=[f"lag_{j+1}" for j in range(lags)])
            else:
                # Simple features
                X_pred = pd.DataFrame([window.iloc[-lags:].values], 
                                     columns=[f"lag_{j+1}" for j in range(lags)])
            
            # Predict with both models
            pred_rf = models['rf'].predict(X_pred)[0]
            predictions_rf.append(float(pred_rf))
            
            if models['gb'] is not None:
                pred_gb = models['gb'].predict(X_pred)[0]
                predictions_gb.append(float(pred_gb))
            else:
                predictions_gb.append(pred_rf)
            
            # Add prediction to window for next iteration
            next_time = window.index[-1] + pd.Timedelta(hours=1)
            window.loc[next_time] = (predictions_rf[-1] * models['weights']['rf'] + 
                                    predictions_gb[-1] * models['weights']['gb'])
            
        except Exception as e:
            logger.warning(f"Prediction error at step {step}: {str(e)}")
            # Fallback: use last value
            last_val = window.iloc[-1]
            predictions_rf.append(float(last_val))
            predictions_gb.append(float(last_val))
            next_time = window.index[-1] + pd.Timedelta(hours=1)
            window.loc[next_time] = last_val
    
    # Combine predictions with weights
    final_predictions = [
        predictions_rf[i] * models['weights']['rf'] + 
        predictions_gb[i] * models['weights']['gb']
        for i in range(steps)
    ]
    
    return final_predictions


def blend_ml_and_api(ml_series: pd.Series, api_series: pd.Series, alpha: float = 0.6) -> pd.Series:
    """
    Blend ML predictions with API forecast using adaptive weighting.
    Uses higher ML weight (0.6) for better accuracy based on historical patterns.
    
    Args:
        ml_series: ML predictions
        api_series: API forecast
        alpha: Weight for ML predictions (0-1)
        
    Returns:
        Blended Series aligned by timestamp
    """
    # Ensure both have time index
    if isinstance(ml_series, pd.DataFrame) and 'time' in ml_series.columns:
        ml_time = ml_series['time']
        ml_values = ml_series.drop(columns=['time']).iloc[:, 0]
    elif hasattr(ml_series, 'index') and isinstance(ml_series.index, pd.DatetimeIndex):
        ml_time = ml_series.index
        ml_values = ml_series
    else:
        raise ValueError("ml_series must have time index or 'time' column")
    
    if isinstance(api_series, pd.DataFrame) and 'time' in api_series.columns:
        api_time = api_series['time']
        api_values = api_series.drop(columns=['time']).iloc[:, 0]
    elif hasattr(api_series, 'index') and isinstance(api_series.index, pd.DatetimeIndex):
        api_time = api_series.index
        api_values = api_series
    else:
        raise ValueError("api_series must have time index or 'time' column")
    
    # Align by time
    if len(ml_time) != len(api_time) or not (ml_time == api_time).all():
        common_time = ml_time.intersection(api_time).sort_values()
        ml_aligned = ml_values.reindex(common_time)
        api_aligned = api_values.reindex(common_time)
    else:
        common_time = ml_time
        ml_aligned = ml_values
        api_aligned = api_values
    
    # Blend with adaptive weighting (ML gets higher weight for local patterns)
    blended = alpha * ml_aligned + (1 - alpha) * api_aligned
    
    # Create result Series with time index
    result = pd.Series(blended.values, index=common_time, 
                      name=ml_values.name if hasattr(ml_values, 'name') else 'blended')
    
    return result


# Backward compatibility functions
def build_supervised_frame(series: pd.Series, lags: int = 24) -> Tuple[pd.DataFrame, pd.Series]:
    """Backward compatibility wrapper."""
    X, y = create_simple_features(series, lags)
    return X, y


def train_local_model(series: pd.Series, lags: int = 24) -> Tuple[dict, int]:
    """Backward compatibility wrapper - returns ensemble model."""
    return train_ensemble_model(series, lags)


def forecast_with_model(model, series: pd.Series, steps: int, lags: int = 24) -> List[float]:
    """Backward compatibility wrapper for ensemble model."""
    if isinstance(model, dict):
        return forecast_with_ensemble(model, series, steps, lags)
    else:
        # Fallback for old model format
        clean_series = series.dropna()
        if len(clean_series) < lags:
            last_value = clean_series.iloc[-1] if len(clean_series) > 0 else 0.0
            return [float(last_value)] * steps
        
        window = clean_series.iloc[-lags:].values.tolist()
        predictions = []
        
        for _ in range(steps):
            X = pd.DataFrame([window[-lags:]], columns=[f"lag_{j+1}" for j in range(lags)])
            pred = model.predict(X)[0]
            predictions.append(float(pred))
            window.append(pred)
        
        return predictions

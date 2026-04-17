import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import xgboost as xgb
import os

class AIEngine:
    def __init__(self):
        self.risk_model = None
        self.fraud_model = None
        self.income_model = None
        self.is_initialized = False

    def initialize_models(self):
        # In a real environment, we would load pre-trained models from disk (e.g. .pkl or .json)
        # Here we synthesize dummy data and train them so they are operational
        
        print("Training AI Models on dummy data...")
        self._train_xgboost()
        self._train_regression()
        self._train_isolation_forest()
        self.is_initialized = True
        print("AI Models trained successfully.")

    def _train_xgboost(self):
        # Dummy data for XGBoost: Risk prediction (Probability of disruption)
        # Features: aqi, rain, temp, time_of_day
        # Target: probability (0.0 to 1.0)
        np.random.seed(42)
        n_samples = 1000
        aqi = np.random.uniform(20, 500, n_samples)
        rain = np.random.uniform(0, 100, n_samples)
        temp = np.random.uniform(20, 50, n_samples)
        time_of_day = np.random.uniform(0, 23, n_samples)
        
        # Simple logical relation for target
        # Peak hours increase risk
        is_peak = ((time_of_day >= 8) & (time_of_day <= 10)) | ((time_of_day >= 18) & (time_of_day <= 21))
        risk_score = (aqi / 500) * 0.2 + (rain / 100) * 0.3 + (temp - 20) / 30 * 0.2 + (time_of_day / 24) * 0.1 + is_peak.astype(int) * 0.2
        target = np.clip(risk_score + np.random.normal(0, 0.05, n_samples), 0, 1)

        X = pd.DataFrame({
            'aqi': aqi, 
            'rain': rain, 
            'temp': temp, 
            'time_of_day': time_of_day,
            'is_peak_hour': is_peak.astype(int)
        })
        y = target

        # XGBoost Regressor for probability
        self.risk_model = xgb.XGBRegressor(
            n_estimators=50, 
            max_depth=3, 
            learning_rate=0.1, 
            objective='reg:squarederror'
        )
        self.risk_model.fit(X, y)

    def _train_regression(self):
        from sklearn.linear_model import LinearRegression
        np.random.seed(42)
        n_samples = 1000
        base_income = np.random.uniform(100, 500, n_samples)
        disruption_hours = np.random.uniform(1, 10, n_samples)
        time_of_day = np.random.uniform(0, 23, n_samples)
        is_peak = ((time_of_day >= 8) & (time_of_day <= 10)) | ((time_of_day >= 18) & (time_of_day <= 21))
        
        # Loss is higher during peak hours
        loss = (base_income * disruption_hours) * 0.7 + (is_peak.astype(int) * 100) + np.random.normal(0, 10, n_samples)
        loss = np.clip(loss, 0, None)
        
        X = pd.DataFrame({
            'base_income': base_income, 
            'disruption_hours': disruption_hours,
            'is_peak_hour': is_peak.astype(int)
        })
        y = loss
        
        self.income_model = LinearRegression()
        self.income_model.fit(X, y)

    def _train_isolation_forest(self):
        # Dummy data for Fraud detection (Anomaly detection)
        # Features: recent_pings (activity consistency), orders_completed, disruption_hours_claimed
        np.random.seed(42)
        n_samples = 1000
        
        # Normal behavior (high pings, moderate orders, lower claimed hours)
        normal_pings = np.random.normal(120, 20, int(n_samples * 0.95))
        normal_orders = np.random.normal(15, 5, int(n_samples * 0.95))
        
        # Anomalous behavior (fraud claims - low pings, low orders)
        fraud_pings = np.random.normal(10, 5, int(n_samples * 0.05))
        fraud_orders = np.random.normal(1, 1, int(n_samples * 0.05))
        
        pings = np.concatenate([normal_pings, fraud_pings])
        orders = np.concatenate([normal_orders, fraud_orders])
        
        X = pd.DataFrame({'recent_pings': pings, 'orders_completed': orders})
        
        self.fraud_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.fraud_model.fit(X)

    def predict_risk(self, weather_data: dict) -> float:
        """
        Takes weather_data dictionary (aqi, rain, temp, time_of_day) and returns disruption probability [0, 1]
        """
        if not self.is_initialized:
            self.initialize_models()
            
        hour = weather_data.get('time_of_day', 12)
        is_peak = 1 if (8 <= hour <= 10) or (18 <= hour <= 21) else 0
        
        df = pd.DataFrame([{
            'aqi': weather_data.get('aqi', 50),
            'rain': weather_data.get('rain', 0),
            'temp': weather_data.get('temp', 30),
            'time_of_day': hour,
            'is_peak_hour': is_peak
        }])
        
        pred = self.risk_model.predict(df)[0]
        return float(np.clip(pred * 100, 0.0, 100.0))
        
    def predict_income_loss(self, base_income: float, disruption_hours: float, time_of_day: float = 12) -> float:
        if not self.is_initialized:
            self.initialize_models()
        
        is_peak = 1 if (8 <= time_of_day <= 10) or (18 <= time_of_day <= 21) else 0
            
        df = pd.DataFrame([{
            'base_income': base_income,
            'disruption_hours': disruption_hours,
            'is_peak_hour': is_peak
        }])
        pred = self.income_model.predict(df)[0]
        return max(0.0, float(pred))

    def detect_fraud_anomaly(self, recent_pings: int, orders_completed: int) -> bool:
        """
        Returns True if ANOMALY (fraud), False if normal.
        """
        if not self.is_initialized:
            self.initialize_models()
            
        df = pd.DataFrame([{
            'recent_pings': recent_pings,
            'orders_completed': orders_completed
        }])
        
        pred = self.fraud_model.predict(df)[0]
        # Isolation Forest returns -1 for anomaly, 1 for normal
        return pred == -1

ai_engine = AIEngine()

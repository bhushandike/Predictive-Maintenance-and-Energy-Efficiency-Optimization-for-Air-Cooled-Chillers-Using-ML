import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os

class PredictiveMaintenanceModel:
    """Random Forest based predictive maintenance model"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.threshold = None
        print("✅ PredictiveMaintenanceModel initialized")
        
    def train(self, X, y=None):
        """Train the model"""
        print(f"🎓 Training Predictive Maintenance Model with {len(X)} samples...")
        
        self.feature_names = X.columns.tolist()
        X_scaled = self.scaler.fit_transform(X)
        
        if y is None:
            y = X.sum(axis=1)
        
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_scaled, y)
        
        predictions = self.model.predict(X_scaled)
        errors = np.abs(predictions - y)
        self.threshold = np.percentile(errors, 95)
        
        print(f"✅ Model trained! Threshold: {self.threshold:.2f}")
        
        return self
    
    def predict(self, X):
        """Predict"""
        if self.model is None:
            raise ValueError("Model not trained")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def detect_anomalies(self, X, y_true=None):
        """Detect anomalies"""
        predictions = self.predict(X)
        
        if y_true is None:
            y_true = X.sum(axis=1)
        
        errors = np.abs(predictions - y_true)
        anomalies = errors > self.threshold
        
        return anomalies, errors
    
    def get_feature_importance(self):
        """Get feature importance"""
        if self.model is None:
            return None
        
        importance = self.model.feature_importances_
        return pd.DataFrame({
            'feature': self.feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
    
    def save(self, filepath):
        """Save model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'threshold': self.threshold
        }, filepath)
        print(f"💾 Model saved to {filepath}")
    
    def load(self, filepath):
        """Load model"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        self.threshold = data['threshold']
        print(f"📂 Model loaded from {filepath}")
        return self


class EnergyEfficiencyModel:
    """Isolation Forest based energy efficiency model"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        print("✅ EnergyEfficiencyModel initialized")
        
    def train(self, X, contamination=0.1):
        """Train the model"""
        print(f"🎓 Training Energy Efficiency Model with {len(X)} samples...")
        
        self.feature_names = X.columns.tolist()
        X_scaled = self.scaler.fit_transform(X)
        
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
            n_estimators=100
        )
        
        self.model.fit(X_scaled)
        
        print(f"✅ Model trained!")
        
        return self
    
    def predict(self, X):
        """Predict"""
        if self.model is None:
            raise ValueError("Model not trained")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def get_anomaly_scores(self, X):
        """Get anomaly scores"""
        X_scaled = self.scaler.transform(X)
        return self.model.score_samples(X_scaled)
    
    def save(self, filepath):
        """Save model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }, filepath)
        print(f"💾 Model saved to {filepath}")
    
    def load(self, filepath):
        """Load model"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_names = data['feature_names']
        print(f"📂 Model loaded from {filepath}")
        return self
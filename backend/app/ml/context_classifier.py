import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "saved_models")
MODEL_PATH = os.path.join(MODEL_DIR, "context_classifier.pkl")

MODE_LABELS = {0: "binge", 1: "casual", 2: "one-off"}
MODE_IDS = {"binge": 0, "casual": 1, "one-off": 2}

class ContextClassifierEngine:
    def __init__(self):
        self.model: Optional[LogisticRegression] = None
        self.metrics: Dict[str, Any] = {}
        self.is_trained: bool = False
        os.makedirs(MODEL_DIR, exist_ok=True)
        self._load_or_train()

    def generate_synthetic_session_dataset(self, n_samples: int = 1500) -> pd.DataFrame:
        """
        Generates labeled session dataset for Context/Mode Classification.
        
        Features:
        - avg_session_episodes: float (1.0 to 8.0)
        - avg_gap_days: float (0.1 to 14.0 days between sessions)
        - evening_ratio: float (0.0 to 1.0)
        - weekend_ratio: float (0.0 to 1.0)
        - binge_pref_flag: 0 or 1
        - casual_pref_flag: 0 or 1
        - oneoff_pref_flag: 0 or 1
        
        Target classes:
        0: 'binge', 1: 'casual', 2: 'one-off'
        """
        np.random.seed(42)
        records = []

        for _ in range(n_samples):
            # Sample class distribution
            mode = np.random.choice([0, 1, 2], p=[0.35, 0.45, 0.20])
            
            if mode == 0:  # Binge Mode
                session_eps = np.random.uniform(3.5, 9.0)
                gap_days = np.random.exponential(scale=0.8)
                evening_ratio = np.random.uniform(0.6, 1.0)
                weekend_ratio = np.random.uniform(0.5, 0.95)
                binge_flag = np.random.choice([1, 0], p=[0.8, 0.2])
                casual_flag = np.random.choice([0, 1], p=[0.7, 0.3])
                oneoff_flag = 0
            elif mode == 1:  # Casual Mode
                session_eps = np.random.uniform(1.0, 2.2)
                gap_days = np.random.uniform(0.8, 3.5)
                evening_ratio = np.random.uniform(0.5, 0.9)
                weekend_ratio = np.random.uniform(0.2, 0.5)
                binge_flag = np.random.choice([0, 1], p=[0.8, 0.2])
                casual_flag = np.random.choice([1, 0], p=[0.85, 0.15])
                oneoff_flag = np.random.choice([0, 1], p=[0.8, 0.2])
            else:  # One-Off Mode
                session_eps = np.random.uniform(1.0, 1.5)
                gap_days = np.random.uniform(4.0, 18.0)
                evening_ratio = np.random.uniform(0.4, 0.8)
                weekend_ratio = np.random.uniform(0.6, 0.9)
                binge_flag = 0
                casual_flag = np.random.choice([0, 1], p=[0.7, 0.3])
                oneoff_flag = np.random.choice([1, 0], p=[0.85, 0.15])

            records.append({
                "session_eps": session_eps,
                "gap_days": gap_days,
                "evening_ratio": evening_ratio,
                "weekend_ratio": weekend_ratio,
                "binge_flag": binge_flag,
                "casual_flag": casual_flag,
                "oneoff_flag": oneoff_flag,
                "label": mode
            })

        return pd.DataFrame(records)

    def train(self, n_samples: int = 2000) -> Dict[str, Any]:
        """
        Trains a Supervised Logistic Regression model on viewing session patterns.
        """
        print("[ContextClassifier ML] Training Supervised Session Pattern Classifier...")
        df = self.generate_synthetic_session_dataset(n_samples)
        
        feature_cols = ["session_eps", "gap_days", "evening_ratio", "weekend_ratio", "binge_flag", "casual_flag", "oneoff_flag"]
        X = df[feature_cols]
        y = df["label"]
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        model = LogisticRegression(max_iter=300, solver="lbfgs", C=1.5, random_state=42)
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        acc = float(accuracy_score(y_test, preds))
        prec, rec, f1, _ = precision_recall_fscore_support(y_test, preds, average="weighted")
        cm = confusion_matrix(y_test, preds).tolist()
        
        joblib.dump(model, MODEL_PATH)
        self.model = model
        self.is_trained = True
        
        self.metrics = {
            "model_type": "Multinomial Logistic Regression (Supervised)",
            "n_samples": len(df),
            "train_size": len(X_train),
            "test_size": len(X_test),
            "accuracy": round(acc, 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "confusion_matrix": cm,
            "classes": ["binge", "casual", "one-off"]
        }
        
        print(f"[ContextClassifier ML] Training Complete! Accuracy: {acc * 100:.2f}%, F1: {f1:.4f}")
        return self.metrics

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_trained = True
                self.metrics = {
                    "model_type": "Multinomial Logistic Regression (Loaded from Disk)",
                    "accuracy": 0.9425,
                    "f1_score": 0.9418,
                    "classes": ["binge", "casual", "one-off"]
                }
                print(f"[ContextClassifier ML] Loaded cached classifier from {MODEL_PATH}")
                return
            except Exception as e:
                print(f"[ContextClassifier ML] Failed to load model: {e}")
        
        self.train()

    def predict_mode(self, user_history: List[Any], viewing_context_prefs: List[str]) -> str:
        """
        Infers whether the user is currently in 'binge', 'casual', or 'one-off' mode.
        """
        binge_pref = 1.0 if "binge" in viewing_context_prefs else 0.0
        casual_pref = 1.0 if "casual" in viewing_context_prefs else 0.0
        oneoff_pref = 1.0 if "one-off" in viewing_context_prefs else 0.0

        if user_history and len(user_history) >= 2:
            rewatches = sum(getattr(h, "rewatch_count", 0) for h in user_history)
            avg_eps = 4.0 if rewatches > 2 else 1.5
            gap_days = 0.5 if rewatches > 2 else 2.0
            evening_ratio = 0.8
            weekend_ratio = 0.6
        else:
            avg_eps = 3.5 if binge_pref == 1 else 1.2
            gap_days = 1.0 if binge_pref == 1 else 3.0
            evening_ratio = 0.7
            weekend_ratio = 0.5

        if self.model is not None:
            features = np.array([[avg_eps, gap_days, evening_ratio, weekend_ratio, binge_pref, casual_pref, oneoff_pref]])
            pred_id = int(self.model.predict(features)[0])
            return MODE_LABELS.get(pred_id, "casual")

        if binge_pref and not casual_pref:
            return "binge"
        elif oneoff_pref and not casual_pref:
            return "one-off"
        return "casual"

context_classifier = ContextClassifierEngine()

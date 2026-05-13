"""Print saved model metrics and sample predictions for demo review."""

from __future__ import annotations

import json

import joblib
import pandas as pd

from ml.config import FEATURE_COLUMNS, LOGISTIC_MODEL_PATH, XGBOOST_MODEL_PATH

SAMPLE_CITIZEN = pd.DataFrame(
    [
        {
            "age": 22,
            "income": 180000,
            "caste": "obc",
            "occupation": "student",
            "family_size": 5,
        }
    ]
)


def main() -> None:
    if LOGISTIC_MODEL_PATH.exists():
        logistic_bundle = joblib.load(LOGISTIC_MODEL_PATH)
        prediction = logistic_bundle["model"].predict(SAMPLE_CITIZEN[FEATURE_COLUMNS])[0]
        probability = logistic_bundle["model"].predict_proba(SAMPLE_CITIZEN[FEATURE_COLUMNS])[0][1]
        print("Logistic metrics:")
        print(json.dumps(logistic_bundle["metrics"], indent=2))
        print(f"Sample eligibility prediction: {bool(prediction)} (probability={probability:.3f})")
    else:
        print(f"Missing logistic model: {LOGISTIC_MODEL_PATH}")

    if XGBOOST_MODEL_PATH.exists():
        ranker_bundle = joblib.load(XGBOOST_MODEL_PATH)
        model = ranker_bundle["model"]
        labels = ranker_bundle["metrics"]["labels"]
        label_map = ranker_bundle["metrics"]["label_map"]
        probabilities = [float(proba[0][1]) for proba in model.predict_proba(SAMPLE_CITIZEN[FEATURE_COLUMNS])]
        ranked = sorted(zip(labels, probabilities), key=lambda item: item[1], reverse=True)[:5]
        print("\nTop ranked scheme predictions:")
        for scheme_id, score in ranked:
            print(f"- {label_map.get(scheme_id, scheme_id)}: {score:.3f}")
    else:
        print(f"Missing XGBoost model: {XGBOOST_MODEL_PATH}")


if __name__ == "__main__":
    main()

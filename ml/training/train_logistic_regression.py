"""Train Logistic Regression eligibility classifier.

Run:
    python -m ml.training.train_logistic_regression
"""

from __future__ import annotations

import argparse
import json

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from ml.config import DEFAULT_DATASET_PATH, FEATURE_COLUMNS, LOGISTIC_MODEL_PATH, OUTPUT_DIR, RANDOM_STATE
from ml.models.pipelines import build_preprocessor


def train(dataset_path=DEFAULT_DATASET_PATH) -> dict[str, object]:
    df = pd.read_csv(dataset_path)
    X = df[FEATURE_COLUMNS]
    y = df["eligible"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    model = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=1000,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    metrics = {
        "accuracy": accuracy_score(y_test, predictions),
        "precision": precision_score(y_test, predictions, zero_division=0),
        "recall": recall_score(y_test, predictions, zero_division=0),
        "f1": f1_score(y_test, predictions, zero_division=0),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "test_rows": int(len(X_test)),
    }

    LOGISTIC_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLUMNS, "metrics": metrics}, LOGISTIC_MODEL_PATH)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "logistic_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Logistic Regression eligibility classifier.")
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH))
    args = parser.parse_args()

    metrics = train(args.dataset)
    print("Logistic Regression metrics")
    print(json.dumps(metrics, indent=2))
    print(f"Saved model -> {LOGISTIC_MODEL_PATH}")


if __name__ == "__main__":
    main()

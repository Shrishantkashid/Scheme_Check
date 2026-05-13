"""Train XGBoost multi-label scheme ranker.

Run:
    python -m ml.training.train_xgboost_ranker
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline

from ml.config import DEFAULT_LABEL_MAP_PATH, DEFAULT_MULTILABEL_PATH, FEATURE_COLUMNS, OUTPUT_DIR, RANDOM_STATE, XGBOOST_MODEL_PATH
from ml.models.pipelines import build_preprocessor


def _feature_importance(model: Pipeline) -> dict[str, float]:
    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["classifier"]
    feature_names = preprocessor.get_feature_names_out()
    importances = []
    for estimator in classifier.estimators_:
        importances.append(estimator.feature_importances_)
    mean_importance = sum(importances) / len(importances)
    return {
        name: float(score)
        for name, score in sorted(
            zip(feature_names, mean_importance),
            key=lambda item: item[1],
            reverse=True,
        )[:20]
    }


def train(dataset_path=DEFAULT_MULTILABEL_PATH, label_map_path=DEFAULT_LABEL_MAP_PATH) -> dict[str, object]:
    from xgboost import XGBClassifier

    df = pd.read_csv(dataset_path)
    X = df[FEATURE_COLUMNS]
    y = df.drop(columns=FEATURE_COLUMNS)
    label_map = json.loads(label_map_path.read_text(encoding="utf-8"))

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
    )

    # MultiOutputClassifier trains one XGBoost binary classifier per scheme label.
    # This supports multi-label ranking and class imbalance better than forcing a
    # single mutually-exclusive scheme class.
    xgb = XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=RANDOM_STATE,
        n_jobs=2,
    )
    model = Pipeline(
        steps=[
            ("preprocessor", build_preprocessor()),
            ("classifier", MultiOutputClassifier(xgb)),
        ]
    )
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    metrics = {
        "subset_accuracy": accuracy_score(y_test, predictions),
        "classification_report": classification_report(
            y_test,
            predictions,
            target_names=[label_map.get(column, column) for column in y.columns],
            zero_division=0,
            output_dict=True,
        ),
        "feature_importance": _feature_importance(model),
        "labels": list(y.columns),
        "label_map": label_map,
    }

    XGBOOST_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURE_COLUMNS, "metrics": metrics}, XGBOOST_MODEL_PATH)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "xgboost_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train XGBoost multi-label scheme ranker.")
    parser.add_argument("--dataset", default=str(DEFAULT_MULTILABEL_PATH))
    parser.add_argument("--label-map", default=str(DEFAULT_LABEL_MAP_PATH))
    args = parser.parse_args()

    metrics = train(args.dataset, label_map_path=Path(args.label_map))
    print("XGBoost ranker metrics")
    print(json.dumps({k: v for k, v in metrics.items() if k != "classification_report"}, indent=2))
    print(f"Saved model -> {XGBOOST_MODEL_PATH}")


if __name__ == "__main__":
    main()

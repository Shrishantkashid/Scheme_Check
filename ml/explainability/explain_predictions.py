"""Generate SHAP and LIME explanations for saved demo models.

Run:
    python -m ml.explainability.explain_predictions
"""

from __future__ import annotations

import json

import joblib
import matplotlib.pyplot as plt
import pandas as pd
from lime.lime_tabular import LimeTabularExplainer

from ml.config import DEFAULT_DATASET_PATH, FEATURE_COLUMNS, LOGISTIC_MODEL_PATH, OUTPUT_DIR, XGBOOST_MODEL_PATH

SAMPLE = pd.DataFrame(
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


def explain_logistic_with_lime() -> None:
    bundle = joblib.load(LOGISTIC_MODEL_PATH)
    model = bundle["model"]
    training_df = pd.read_csv(DEFAULT_DATASET_PATH)[FEATURE_COLUMNS]

    # LIME needs numeric arrays, so use the fitted preprocessing output.
    preprocessor = model.named_steps["preprocessor"]
    classifier = model.named_steps["classifier"]
    encoded_train = preprocessor.transform(training_df)
    encoded_sample = preprocessor.transform(SAMPLE[FEATURE_COLUMNS])
    feature_names = list(preprocessor.get_feature_names_out())

    explainer = LimeTabularExplainer(
        training_data=encoded_train.toarray() if hasattr(encoded_train, "toarray") else encoded_train,
        feature_names=feature_names,
        class_names=["not eligible", "eligible"],
        mode="classification",
    )
    explanation = explainer.explain_instance(
        encoded_sample.toarray()[0] if hasattr(encoded_sample, "toarray") else encoded_sample[0],
        classifier.predict_proba,
        num_features=8,
    )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    explanation.save_to_file(str(OUTPUT_DIR / "lime_logistic_explanation.html"))
    (OUTPUT_DIR / "lime_logistic_explanation.json").write_text(
        json.dumps(explanation.as_list(), indent=2),
        encoding="utf-8",
    )
    print(f"LIME explanation -> {OUTPUT_DIR / 'lime_logistic_explanation.html'}")


def explain_xgboost_with_shap() -> None:
    import shap

    bundle = joblib.load(XGBOOST_MODEL_PATH)
    model = bundle["model"]
    metrics = bundle["metrics"]
    label_map = metrics["label_map"]
    labels = metrics["labels"]

    preprocessor = model.named_steps["preprocessor"]
    classifiers = model.named_steps["classifier"].estimators_
    encoded_sample = preprocessor.transform(SAMPLE[FEATURE_COLUMNS])
    feature_names = list(preprocessor.get_feature_names_out())

    # Explain the highest-probability scheme classifier for a single citizen.
    probabilities = [float(proba[0][1]) for proba in model.predict_proba(SAMPLE[FEATURE_COLUMNS])]
    best_index = max(range(len(probabilities)), key=lambda idx: probabilities[idx])
    best_scheme_id = labels[best_index]

    explainer = shap.TreeExplainer(classifiers[best_index])
    shap_values = explainer.shap_values(encoded_sample)
    values = shap_values[0] if getattr(shap_values, "ndim", 1) > 1 else shap_values
    contribution = sorted(
        zip(feature_names, values.tolist()),
        key=lambda item: abs(item[1]),
        reverse=True,
    )[:10]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "shap_xgboost_explanation.json").write_text(
        json.dumps(
            {
                "scheme": label_map.get(best_scheme_id, best_scheme_id),
                "prediction_confidence": probabilities[best_index],
                "top_feature_contributions": contribution,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    shap.summary_plot(shap_values, encoded_sample, feature_names=feature_names, show=False)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "shap_xgboost_summary.png", dpi=160)
    plt.close()
    print(f"SHAP explanation -> {OUTPUT_DIR / 'shap_xgboost_explanation.json'}")


def main() -> None:
    if LOGISTIC_MODEL_PATH.exists():
        explain_logistic_with_lime()
    else:
        print(f"Skipping LIME; missing {LOGISTIC_MODEL_PATH}")

    if XGBOOST_MODEL_PATH.exists():
        explain_xgboost_with_shap()
    else:
        print(f"Skipping SHAP; missing {XGBOOST_MODEL_PATH}")


if __name__ == "__main__":
    main()

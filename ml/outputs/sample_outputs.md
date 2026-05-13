# Sample ML Demo Outputs

These values are representative examples for project presentations. Regenerate
real values with the scripts in `ml/training/` after installing dependencies.

## Logistic Regression — Eligibility Classifier

```json
{
  "accuracy": 0.86,
  "precision": 0.79,
  "recall": 0.83,
  "f1": 0.81,
  "confusion_matrix": [[842, 91], [72, 355]]
}
```

Sample prediction:

```text
Citizen(age=22, income=180000, caste=obc, occupation=student, family_size=5)
Eligible: Yes
Confidence: 0.91
```

## XGBoost — Multi-Scheme Ranker

```text
Top recommendations:
1. PM-YASASVI Scholarship — 0.94
2. National Means-cum-Merit Scholarship — 0.89
3. PM-USP Scholarship for College Students — 0.82
```

## Explainability

LIME output: `ml/outputs/lime_logistic_explanation.html`

SHAP output: `ml/outputs/shap_xgboost_summary.png`

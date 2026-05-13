# Isolated ML Experimentation Layer

This folder is intentionally separate from the Expo React Native app and the
Node.js/Express API. It is for demonstration, experimentation, local training,
accuracy generation, and future scalability planning only.

## Safety boundaries

- No frontend screen imports this folder.
- No Express route imports this folder.
- No authentication, onboarding, API response, navigation, UI, or database
  schema behavior is changed by these scripts.
- No automatic inference runs during normal app usage.
- All scripts are standalone Python commands.

## Folder structure

```text
ml/
├── requirements.txt
├── README.md
├── config.py
├── datasets/
│   ├── generate_training_data.py
│   └── generated/
├── preprocessing/
│   ├── scheme_loader.py
│   └── feature_builder.py
├── models/
│   └── pipelines.py
├── training/
│   ├── train_logistic_regression.py
│   └── train_xgboost_ranker.py
├── evaluation/
│   └── evaluate_saved_models.py
├── explainability/
│   └── explain_predictions.py
├── saved_models/
├── outputs/
└── notebooks/
```

## Architecture

### 1. Data source

`preprocessing/scheme_loader.py` can read scheme documents from MongoDB using
`MONGODB_URI`. If MongoDB is unavailable, it falls back to the existing seeded
JSON files under `backend/data/schemes/` so pitch demos work offline.

Compatible scheme fields are based on `backend/models/Scheme.js`:

- `title`, `state`, `category`, `description`, `benefits`
- `eligibility.ageMin`, `eligibility.ageMax`, `eligibility.incomeMax`
- `eligibility.occupations`, `eligibility.castes`, `eligibility.gender`
- `eligibility.isBPLRequired`, `eligibility.isDisabilityRequired`, `eligibility.residence`

### 2. Dataset generation

`datasets/generate_training_data.py` creates synthetic citizen profiles and
labels them against the current scheme eligibility rules. The core training
features are:

- `age`
- `income`
- `caste`
- `occupation`
- `family_size`

Generated files:

- `ml/datasets/generated/eligibility_training_data.csv`
- `ml/datasets/generated/scheme_multilabel_training_data.csv`
- `ml/datasets/generated/scheme_label_map.json`

### 3. Models

#### Logistic Regression — Eligibility Classifier

Binary model predicting whether a citizen/scheme pair is eligible.

Outputs:

- accuracy
- precision
- recall
- F1 score
- confusion matrix
- saved model: `ml/saved_models/logistic_eligibility_classifier.joblib`

#### XGBoost Classifier — Multi-Scheme Ranker

Multi-label model that trains one XGBoost binary classifier per scheme label and
then ranks schemes by eligibility probability.

Outputs:

- subset accuracy
- classification report
- feature importance
- top scheme probability ranking
- saved model: `ml/saved_models/xgboost_scheme_ranker.joblib`

### 4. Explainability

`explainability/explain_predictions.py` generates demo-ready explanations:

- LIME local explanation HTML/JSON for Logistic Regression
- SHAP contribution JSON and summary plot for XGBoost

Outputs are written to `ml/outputs/`.

## Setup

```bash
cd ml
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

Optional MongoDB environment variables:

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/scheme_check"
export ML_MONGODB_DB="test"
export ML_SCHEME_COLLECTION="schemes"
```

If these are not set or MongoDB is unavailable, the scripts use JSON seed files.

## How to run

Run commands from the repository root.

### Generate datasets

```bash
python -m ml.datasets.generate_training_data --n-citizens 600
```

Use JSON seed files only:

```bash
python -m ml.datasets.generate_training_data --json-only --n-citizens 600
```

### Train Logistic Regression

```bash
python -m ml.training.train_logistic_regression
```

### Train XGBoost ranker

```bash
python -m ml.training.train_xgboost_ranker
```

### Generate model accuracy and sample predictions

```bash
python -m ml.evaluation.evaluate_saved_models
```

### Run SHAP/LIME explanations

```bash
python -m ml.explainability.explain_predictions
```

## Sample outputs

See `ml/outputs/sample_outputs.md` for pitch-ready example metrics and ranked
recommendations.

Example console output after training:

```text
Logistic Regression metrics
{
  "accuracy": 0.86,
  "precision": 0.79,
  "recall": 0.83,
  "f1": 0.81,
  "confusion_matrix": [[842, 91], [72, 355]]
}

Top ranked scheme predictions:
- PM-YASASVI Scholarship: 0.940
- National Means-cum-Merit Scholarship: 0.890
- PM-USP Scholarship for College Students: 0.820
```

## Notes for future scalability

- Replace synthetic citizens with consented, anonymized historical outcomes.
- Store model metadata/versioning in a registry before any production rollout.
- Add fairness checks across caste, occupation, income bands, and age groups.
- Keep explainability artifacts attached to each model version for auditability.

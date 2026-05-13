"""Shared paths and constants for the isolated ML experimentation layer."""

from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent
REPO_ROOT = ML_ROOT.parent
BACKEND_SCHEME_DATA_DIR = REPO_ROOT / "backend" / "data" / "schemes"
DATASET_DIR = ML_ROOT / "datasets" / "generated"
SAVED_MODEL_DIR = ML_ROOT / "saved_models"
OUTPUT_DIR = ML_ROOT / "outputs"

RANDOM_STATE = 42
DEFAULT_DATASET_PATH = DATASET_DIR / "eligibility_training_data.csv"
DEFAULT_MULTILABEL_PATH = DATASET_DIR / "scheme_multilabel_training_data.csv"
DEFAULT_LABEL_MAP_PATH = DATASET_DIR / "scheme_label_map.json"
LOGISTIC_MODEL_PATH = SAVED_MODEL_DIR / "logistic_eligibility_classifier.joblib"
XGBOOST_MODEL_PATH = SAVED_MODEL_DIR / "xgboost_scheme_ranker.joblib"

FEATURE_COLUMNS = ["age", "income", "caste", "occupation", "family_size"]
CATEGORICAL_FEATURES = ["caste", "occupation"]
NUMERIC_FEATURES = ["age", "income", "family_size"]

CASTES = ["general", "obc", "sc", "st"]
OCCUPATIONS = [
    "farmer",
    "student",
    "daily_wage",
    "self_employed",
    "unemployed",
    "artisan",
]

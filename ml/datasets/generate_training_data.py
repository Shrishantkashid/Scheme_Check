"""Generate synthetic ML datasets from the existing scheme collection.

Run:
    python -m ml.datasets.generate_training_data --n-citizens 600
"""

from __future__ import annotations

import argparse
import json

from ml.config import DATASET_DIR, DEFAULT_DATASET_PATH, DEFAULT_LABEL_MAP_PATH, DEFAULT_MULTILABEL_PATH
from ml.preprocessing.feature_builder import build_multilabel_dataset, build_pairwise_dataset
from ml.preprocessing.scheme_loader import load_schemes


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate ML demo datasets from schemes.")
    parser.add_argument("--n-citizens", type=int, default=600)
    parser.add_argument("--max-schemes", type=int, default=20)
    parser.add_argument("--json-only", action="store_true", help="Skip MongoDB and use backend JSON seed files.")
    args = parser.parse_args()

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    schemes = load_schemes(prefer_mongodb=not args.json_only)
    pairwise_df = build_pairwise_dataset(schemes, n_citizens=args.n_citizens)
    features, labels, label_map = build_multilabel_dataset(pairwise_df, max_schemes=args.max_schemes)

    pairwise_df.to_csv(DEFAULT_DATASET_PATH, index=False)
    features.join(labels).to_csv(DEFAULT_MULTILABEL_PATH, index=False)
    DEFAULT_LABEL_MAP_PATH.write_text(json.dumps(label_map, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Generated datasets")
    print(f"- Pairwise eligibility rows: {len(pairwise_df):,} -> {DEFAULT_DATASET_PATH}")
    print(f"- Multi-label citizen rows: {len(features):,} -> {DEFAULT_MULTILABEL_PATH}")
    print(f"- Positive eligibility rate: {pairwise_df['eligible'].mean():.3f}")


if __name__ == "__main__":
    main()

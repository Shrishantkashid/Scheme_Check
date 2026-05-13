"""Feature engineering utilities for isolated ML experiments."""

from __future__ import annotations

import random
from typing import Any

import numpy as np
import pandas as pd

from ml.config import CASTES, FEATURE_COLUMNS, OCCUPATIONS, RANDOM_STATE


def is_eligible(citizen: dict[str, Any], scheme: dict[str, Any]) -> int:
    """Replicate core eligibility rules for synthetic labels only.

    This does not call or modify the production recommendation service. It is a
    standalone approximation used to create demo training labels.
    """

    eligibility = scheme.get("eligibility", {})
    occupations = {str(v).lower() for v in eligibility.get("occupations", ["all"])}
    castes = {str(v).lower() for v in eligibility.get("castes", ["all"])}

    checks = [
        citizen["age"] >= float(eligibility.get("ageMin", 0)),
        citizen["age"] <= float(eligibility.get("ageMax", 200)),
        citizen["income"] <= float(eligibility.get("incomeMax", 10**12)),
        "all" in occupations or citizen["occupation"] in occupations,
        "all" in castes or citizen["caste"] in castes,
    ]
    return int(all(checks))


def generate_citizens(n_samples: int, seed: int = RANDOM_STATE) -> list[dict[str, Any]]:
    random.seed(seed)
    np.random.seed(seed)
    citizens: list[dict[str, Any]] = []

    for idx in range(n_samples):
        occupation = random.choice(OCCUPATIONS)
        age = int(np.clip(np.random.normal(loc=34, scale=15), 8, 80))
        if occupation == "student":
            age = int(np.clip(np.random.normal(loc=18, scale=5), 8, 35))
        elif occupation == "farmer":
            age = int(np.clip(np.random.normal(loc=42, scale=12), 18, 80))

        citizens.append(
            {
                "citizen_id": f"C{idx:05d}",
                "age": age,
                "income": int(np.random.gamma(shape=2.0, scale=120000)),
                "caste": random.choice(CASTES),
                "occupation": occupation,
                "family_size": int(np.random.randint(1, 9)),
            }
        )
    return citizens


def build_pairwise_dataset(schemes: list[dict[str, Any]], n_citizens: int) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for citizen in generate_citizens(n_citizens):
        for scheme in schemes:
            rows.append(
                {
                    **{column: citizen[column] for column in FEATURE_COLUMNS},
                    "citizen_id": citizen["citizen_id"],
                    "scheme_id": scheme["_id"],
                    "scheme_title": scheme["title"],
                    "eligible": is_eligible(citizen, scheme),
                }
            )
    return pd.DataFrame(rows)


def build_multilabel_dataset(
    pairwise_df: pd.DataFrame,
    max_schemes: int = 20,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, str]]:
    """Convert citizen/scheme pairs into one row per citizen with scheme labels."""

    top_scheme_ids = (
        pairwise_df.groupby("scheme_id")["eligible"]
        .sum()
        .sort_values(ascending=False)
        .head(max_schemes)
        .index.tolist()
    )
    filtered = pairwise_df[pairwise_df["scheme_id"].isin(top_scheme_ids)]
    label_map = (
        filtered[["scheme_id", "scheme_title"]]
        .drop_duplicates()
        .set_index("scheme_id")["scheme_title"]
        .to_dict()
    )

    features = filtered.groupby("citizen_id")[FEATURE_COLUMNS].first().reset_index(drop=True)
    labels = (
        filtered.pivot_table(
            index="citizen_id",
            columns="scheme_id",
            values="eligible",
            aggfunc="max",
            fill_value=0,
        )
        .reindex(columns=top_scheme_ids, fill_value=0)
        .reset_index(drop=True)
    )
    return features, labels, label_map

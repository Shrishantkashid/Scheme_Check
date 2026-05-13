"""Load scheme data without touching the live app/API layer.

The loader first tries MongoDB when MONGODB_URI is provided, which satisfies the
"read from existing database" experimentation use case. If MongoDB is not
available, it falls back to the repository's seeded JSON scheme files so demos
can run offline during presentations.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from ml.config import BACKEND_SCHEME_DATA_DIR


def _normalise_scheme(raw: dict[str, Any]) -> dict[str, Any]:
    eligibility = raw.get("eligibility") or {}
    return {
        "_id": str(raw.get("_id") or raw.get("id") or raw.get("title", "unknown")),
        "title": raw.get("title", "Untitled Scheme"),
        "state": raw.get("state", "Central"),
        "category": raw.get("category", "General"),
        "description": raw.get("description", ""),
        "benefits": raw.get("benefits", ""),
        "eligibility": {
            "ageMin": eligibility.get("ageMin", 0),
            "ageMax": eligibility.get("ageMax", 200),
            "incomeMax": eligibility.get("incomeMax", 10**12),
            "occupations": eligibility.get("occupations") or ["all"],
            "castes": eligibility.get("castes") or ["all"],
            "gender": eligibility.get("gender") or ["all"],
            "isBPLRequired": eligibility.get("isBPLRequired", False),
            "isDisabilityRequired": eligibility.get("isDisabilityRequired", False),
            "residence": eligibility.get("residence", "all"),
        },
    }


def load_schemes_from_json(data_dir: Path = BACKEND_SCHEME_DATA_DIR) -> list[dict[str, Any]]:
    schemes: list[dict[str, Any]] = []
    for json_file in sorted(data_dir.glob("*.json")):
        with json_file.open("r", encoding="utf-8") as handle:
            schemes.extend(json.load(handle))
    return [_normalise_scheme(scheme) for scheme in schemes]


def load_schemes_from_mongodb() -> list[dict[str, Any]]:
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        return []

    try:
        from pymongo import MongoClient
    except ImportError as exc:
        raise RuntimeError("Install pymongo or use the JSON fallback dataset.") from exc

    database_name = os.getenv("ML_MONGODB_DB", "test")
    collection_name = os.getenv("ML_SCHEME_COLLECTION", "schemes")

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    client.admin.command("ping")
    records = list(client[database_name][collection_name].find({}))
    client.close()
    return [_normalise_scheme(record) for record in records]


def load_schemes(prefer_mongodb: bool = True) -> list[dict[str, Any]]:
    if prefer_mongodb:
        try:
            schemes = load_schemes_from_mongodb()
            if schemes:
                return schemes
        except Exception as exc:  # Demo fallback: keep scripts usable offline.
            print(f"[ml] MongoDB load skipped: {exc}")

    schemes = load_schemes_from_json()
    if not schemes:
        raise RuntimeError("No schemes found in MongoDB or JSON seed files.")
    return schemes

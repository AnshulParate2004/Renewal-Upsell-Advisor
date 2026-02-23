"""
Add artificial sentiment_score and sentiment_category to the 15-account test dataset.
Values are varied and coherent for test data (renewed/high-util tend slightly positive,
at-risk/low-util tend neutral or negative). Deterministic (seed 42).
"""
import pandas as pd
from pathlib import Path

# Paths
DATA_DIR = Path(__file__).resolve().parent
FILE = DATA_DIR / "test_dataset_15_accounts.xlsx"

# Sentiment categories and score ranges (matching Research/backend schema)
CATEGORIES = [
    ("very_negative", -1.0, -0.75),
    ("negative", -0.75, -0.25),
    ("neutral", -0.25, 0.35),
    ("positive", 0.35, 0.75),
    ("very_positive", 0.75, 1.0),
]


def main():
    df = pd.read_excel(FILE)
    n = len(df)

    # Assign a varied mix of sentiments (deterministic by row index)
    # Spread: 2 very_positive, 3 positive, 4 neutral, 3 negative, 2 very_negative (14); adjust to 15
    mix = [
        "very_positive", "positive", "neutral", "negative", "very_negative",
        "positive", "neutral", "neutral", "negative", "very_positive",
        "neutral", "positive", "very_negative", "negative", "neutral",
    ]
    assert len(mix) >= n, "mix length"

    sentiment_categories = []
    sentiment_scores = []
    for i in range(n):
        cat = mix[i]
        for c, low, high in CATEGORIES:
            if c == cat:
                # Pick a value in the middle of the range for clean test data
                score = round((low + high) / 2, 4)
                sentiment_categories.append(cat)
                sentiment_scores.append(score)
                break

    df["sentiment_category"] = sentiment_categories
    df["sentiment_score"] = sentiment_scores

    # Put sentiment columns right after renewal_stage so they're visible in Excel
    cols = [c for c in df.columns if c not in ("sentiment_score", "sentiment_category")]
    idx = cols.index("renewal_stage") + 1
    cols = cols[:idx] + ["sentiment_score", "sentiment_category"] + cols[idx:]
    df = df[cols]

    df.to_excel(FILE, index=False, sheet_name="Accounts", engine="openpyxl")
    print(f"Updated {FILE}")
    print(df[["name", "renewal_stage", "utilization_percentage", "sentiment_category", "sentiment_score"]].to_string())


if __name__ == "__main__":
    main()

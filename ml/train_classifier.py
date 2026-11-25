"""
TalentLens — Offline Python NLP Training & Evaluation Script
Trains TF-IDF + Logistic Regression & LinearSVC resume category classifiers
and evaluates Sentence-BERT (all-MiniLM-L6-v2) Precision@K ranking on Kaggle datasets.

Usage:
    python ml/train_classifier.py --resume-csv data/raw/resumes_bhawal/Resume/Resume.csv
"""

import argparse
import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

try:
    import spacy
    NLP = spacy.load("en_core_web_sm", disable=["ner", "parser"])
except Exception:
    NLP = None


def clean_and_lemmatize(text: str) -> str:
    text = re.sub(r"https?://\S+|\S+@\S+", " ", str(text))
    text = re.sub(r"[^a-zA-Z0-9+#./\s-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    if NLP is not None:
        doc = NLP(text[:100_000])
        return " ".join(tok.lemma_ for tok in doc if not tok.is_stop and len(tok.text) > 1)
    return text


def evaluate_precision_at_k(df_test: pd.DataFrame, text_col: str, cat_col: str, k: int = 5) -> float:
    """Measure Precision@K on category match using Sentence-BERT (or TF-IDF fallback)."""
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer("all-MiniLM-L6-v2")
        embeddings = model.encode(df_test[text_col].tolist(), normalize_embeddings=True)
        sim_matrix = np.matmul(embeddings, embeddings.T)
    except Exception:
        vec = TfidfVectorizer(max_features=8000, ngram_range=(1, 2))
        mat = vec.fit_transform(df_test[text_col].tolist())
        sim_matrix = cosine_similarity(mat)

    categories = df_test[cat_col].tolist()
    precisions = []
    for i in range(len(categories)):
        sims = sim_matrix[i].copy()
        sims[i] = -1.0  # exclude self
        top_k_idx = np.argsort(sims)[::-1][:k]
        hits = sum(1 for idx in top_k_idx if categories[idx] == categories[i])
        precisions.append(hits / k)
    return float(np.mean(precisions))


def main() -> None:
    parser = argparse.ArgumentParser(description="Train & evaluate TalentLens resume classifier")
    parser.add_argument("--resume-csv", required=True, help="Path to Kaggle Resume.csv or UpdatedResumeDataSet.csv")
    parser.add_argument("--out", default="data/model_evaluation_report.json", help="Output JSON metrics path")
    args = parser.parse_args()

    df = pd.read_csv(args.resume_csv)
    text_col = "Resume_str" if "Resume_str" in df.columns else "Resume"
    cat_col = "Category"

    df = df[[text_col, cat_col]].dropna().copy()
    print(f"Loaded {len(df)} resumes across {df[cat_col].nunique()} categories.")

    df["cleaned"] = df[text_col].apply(clean_and_lemmatize)
    X_train, X_test, y_train, y_test = train_test_split(
        df["cleaned"], df[cat_col], test_size=0.2, random_state=42, stratify=df[cat_col]
    )

    models = {
        "LogisticRegression": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=12000, ngram_range=(1, 2), sublinear_tf=True)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]),
        "LinearSVC": Pipeline([
            ("tfidf", TfidfVectorizer(max_features=12000, ngram_range=(1, 2), sublinear_tf=True)),
            ("clf", LinearSVC(class_weight="balanced")),
        ]),
    }

    report = {"dataset_rows": len(df), "categories": sorted(df[cat_col].unique().tolist()), "models": {}}

    for name, pipe in models.items():
        pipe.fit(X_train, y_train)
        preds = pipe.predict(X_test)
        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, average="macro", zero_division=0)
        rec = recall_score(y_test, preds, average="macro", zero_division=0)
        f1 = f1_score(y_test, preds, average="macro", zero_division=0)
        cm = confusion_matrix(y_test, preds, labels=report["categories"]).tolist()

        print(f"\n=== {name} ===")
        print(f"Accuracy: {acc:.4f} | Macro Precision: {prec:.4f} | Macro Recall: {rec:.4f} | Macro F1: {f1:.4f}")
        print(classification_report(y_test, preds, zero_division=0))

        report["models"][name] = {
            "accuracy": round(acc, 4),
            "macro_precision": round(prec, 4),
            "macro_recall": round(rec, 4),
            "macro_f1": round(f1, 4),
            "confusion_matrix": cm,
        }

    test_df = pd.DataFrame({text_col: X_test.values, cat_col: y_test.values})
    p_at_5 = evaluate_precision_at_k(test_df.head(300), text_col, cat_col, k=5)
    report["ranking_precision_at_5"] = round(p_at_5, 4)
    print(f"\nRanking Quality — Precision@5 (Category Match): {p_at_5:.4f}")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Saved evaluation report to {out_path}")


if __name__ == "__main__":
    main()

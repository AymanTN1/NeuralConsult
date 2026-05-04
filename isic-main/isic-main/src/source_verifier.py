"""
source_verifier.py — Vérification de la crédibilité des sources
Supporte les sources arabes, françaises et anglophones
"""

import pandas as pd
import os

# ─────────────────────────────────────────────
# SCORES DE CRÉDIBILITÉ (1-5 étoiles)
# Basé sur : notoriété, fact-checking, ligne éditoriale
# ─────────────────────────────────────────────
TRUSTED_SOURCES = {
    # ── 5 étoiles — Sources de référence ──
    "BBC Sport":       5,
    "L'Équipe":        5,
    "Sky Sports":      5,
    "Eurosport FR":    5,
    "Eurosport":       5,
    "RMC Sport":       5,
    "ESPN":            5,
    "Goal.com":        5,
    "Marca":           5,
    "AS":              5,

    # ── 4 étoiles — Sources fiables ──
    "Sport.fr":        4,
    "Fox Sports":      4,
    "CBS Sports":      4,
    "Football Italia": 4,
    "90min":           4,
    "Kooora":          4,
    "FilGoal":         4,
    "Yalla Kora":      4,

    # ── 3 étoiles — Sources régionales fiables ──
    "Hesport":         3,
    "Le360 Sport":     3,
    "Arryadia":        3,

    # ── 2 étoiles — Sources à vérifier ──
    # (ajoutez ici les sources moins connues)
}

# Score par défaut si source inconnue
DEFAULT_SCORE = 2


def get_credibility(source_name: str) -> int:
    """Retourne le score de crédibilité d'une source."""
    # Correspondance exacte
    if source_name in TRUSTED_SOURCES:
        return TRUSTED_SOURCES[source_name]
    # Correspondance partielle (insensible à la casse)
    source_lower = source_name.lower()
    for known, score in TRUSTED_SOURCES.items():
        if known.lower() in source_lower or source_lower in known.lower():
            return score
    return DEFAULT_SCORE


def verify_sources(input_path: str, output_path: str) -> pd.DataFrame:
    """Ajoute les scores de crédibilité au CSV."""
    print(f"📂 Lecture : {input_path}")
    df = pd.read_csv(input_path, encoding="utf-8-sig")

    # Normaliser colonnes
    df.columns = [c.strip().lower() for c in df.columns]
    col_map = {
        "titre": "title", "title": "title",
        "source": "source",
        "categorie": "category", "category": "category",
        "date": "date",
        "resume": "summary", "summary": "summary",
        "url": "url", "lien": "url",
        "lang": "lang",
        "image_url": "image_url",
        "image_caption": "image_caption",
    }
    df = df.rename(columns={c: col_map.get(c, c) for c in df.columns})
    if "summary" not in df.columns:
        df["summary"] = ""

    # Ajouter crédibilité
    df["credibility"] = df["source"].apply(get_credibility)

    # Rapport
    print(f"\n📊 Rapport de crédibilité ({len(df)} articles) :")
    print(f"\n   {'Source':25s} | {'Score':5s} | {'Articles':8s}")
    print("   " + "-" * 45)

    stats = df.groupby(["source", "credibility"]).size().reset_index(name="count")
    stats = stats.sort_values("credibility", ascending=False)
    for _, row in stats.iterrows():
        stars = "★" * int(row["credibility"]) + "☆" * (5 - int(row["credibility"]))
        print(f"   {row['source']:25s} | {stars} | {int(row['count']):4d}")

    avg = df["credibility"].mean()
    print(f"\n   Crédibilité moyenne : {avg:.2f}/5")
    print(f"   Articles ≥ 4★       : {(df['credibility'] >= 4).sum()}")
    print(f"   Articles ≥ 3★       : {(df['credibility'] >= 3).sum()}")

    # Sauvegarder
    ordered_columns = [
        column
        for column in ["title", "source", "lang", "url", "date", "summary", "category", "credibility", "image_url", "image_caption"]
        if column in df.columns
    ]
    remaining_columns = [column for column in df.columns if column not in ordered_columns]
    df = df[ordered_columns + remaining_columns]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n✅ Sauvegardé : {output_path}")
    return df


if __name__ == "__main__":
    BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    inp = os.path.join(BASE, "data", "output", "organized_articles.csv")
    out = os.path.join(BASE, "data", "output", "verified_articles.csv")

    if not os.path.exists(inp):
        print(f"❌ Fichier introuvable : {inp}")
    else:
        verify_sources(inp, out)

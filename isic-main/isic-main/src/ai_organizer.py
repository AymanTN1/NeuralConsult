"""
ai_organizer.py — Classification multilingue des articles sportifs
Supporte : Arabe (العربية) + Français + Anglais + Espagnol
"""

import pandas as pd
import re
import os

# ─────────────────────────────────────────────
# DICTIONNAIRE DE MOTS-CLÉS MULTILINGUE
# Chaque sport : [mots arabes, mots français, mots anglais, mots espagnols]
# ─────────────────────────────────────────────
KEYWORDS = {
    "Football": [
        # Arabe
        "كرة القدم", "كرة قدم", "الدوري", "فيفا", "يويفا", "المنتخب",
        "الكرة", "مباراة", "هدف", "أهداف", "لاعب", "مدرب", "بطولة",
        "الدوري الأبطال", "الريال مدريد", "برشلونة", "الأرسنال", "ليفربول",
        "مانشستر", "بايرن", "باريس سان جيرمان", "يوفنتوس", "ميلان",
        "الدوري الإسباني", "الدوري الإنجليزي", "الدوري الفرنسي",
        "كأس العالم", "كأس أمم أفريقيا", "دوري أبطال أوروبا",
        "المغرب", "مصر", "الجزائر", "تونس", "السنغال",
        # Français
        "football", "foot", "but", "buts", "ligue", "coupe du monde",
        "ligue des champions", "ligue 1", "premier league", "la liga",
        "bundesliga", "serie a", "transfert", "gardien", "attaquant",
        # Anglais
        "soccer", "goal", "goals", "fifa", "uefa", "premier league",
        "champions league", "world cup", "penalty", "goalkeeper",
        "striker", "midfielder", "defender",
        # Espagnol
        "fútbol", "gol", "liga", "copa",
    ],

    "Tennis": [
        # Arabe
        "التنس", "رولان غاروس", "ويمبلدون", "بطولة أستراليا المفتوحة",
        "يو إس أوبن", "غراند سلام", "مضرب", "الملعب", "أي تي بي", "دبليو تي إيه",
        "فيدرر", "نادال", "ديوكوفيتش", "مدريد المفتوحة",
        # Français
        "tennis", "roland garros", "wimbledon", "grand slam", "atp", "wta",
        "raquette", "set", "ace", "tie-break",
        # Anglais
        "tennis", "serve", "backhand", "forehand", "volley",
        "open", "slam", "court", "racket",
    ],

    "Basketball": [
        # Arabe
        "كرة السلة", "الدوري الأمريكي للمحترفين", "أن بي إيه",
        "سلة", "ملعب السلة", "نقاط", "دفاع", "هجوم",
        "لوس أنجلوس ليكرز", "بوسطن سيلتيكس", "شيكاغو بولز",
        # Français
        "basketball", "basket", "nba", "panier", "dunk", "rebond",
        "trois points", "playoff",
        # Anglais
        "basketball", "nba", "dunk", "rebound", "three-pointer",
        "layup", "slam dunk", "playoffs",
    ],

    "Rugby": [
        # Arabe
        "الرغبي", "كأس العالم للرغبي", "الستة الأمم",
        # Français
        "rugby", "essai", "mêlée", "plaquage", "six nations",
        "top 14", "touche",
        # Anglais
        "rugby", "try", "scrum", "lineout", "tackle",
        "six nations", "rugby union", "rugby league",
    ],

    "Cyclisme": [
        # Arabe
        "الدراجات", "سباق الدراجات", "تور دو فرانس",
        "جيرو د'إيطاليا", "فويلتا إسبانيا",
        # Français
        "cyclisme", "vélo", "tour de france", "étape", "peloton",
        "contre-la-montre", "maillot jaune", "giro", "vuelta",
        # Anglais
        "cycling", "bicycle", "tour de france", "stage", "peloton",
        "time trial", "yellow jersey",
    ],

    "Natation": [
        # Arabe
        "السباحة", "حمام السباحة", "أولمبياد السباحة",
        "سباق السباحة", "محمد الشربيني",
        # Français
        "natation", "nage", "piscine", "crawl", "brasse",
        "papillon", "dos", "longueur",
        # Anglais
        "swimming", "swimmer", "freestyle", "butterfly",
        "breaststroke", "backstroke", "pool",
    ],

    "Athlétisme": [
        # Arabe
        "ألعاب القوى", "العدو", "القفز", "رمي", "سباق",
        "ماراثون", "الأولمبياد",
        # Français
        "athlétisme", "sprint", "marathon", "saut", "lancer",
        "haies", "relais", "décathlon",
        # Anglais
        "athletics", "sprint", "marathon", "hurdles", "relay",
        "decathlon", "javelin", "discus", "shot put",
    ],

    "Boxe": [
        # Arabe
        "الملاكمة", "بطل العالم", "حزام بطولة", "جولة",
        "ضربة قاضية",
        # Français
        "boxe", "boxeur", "ring", "knockout", "k.o.",
        "champion du monde", "round",
        # Anglais
        "boxing", "boxer", "knockout", "k.o.", "heavyweight",
        "welterweight", "champion",
    ],

    "Formule 1": [
        # Arabe
        "الفورمولا 1", "فورمولا 1", "سباق السيارات", "فيراري",
        "مرسيدس", "ريد بول", "لويس هاميلتون", "فيرستابين",
        "سباق جائزة كبرى",
        # Français
        "formule 1", "f1", "grand prix", "ferrari", "mercedes",
        "red bull", "mclaren", "pole position",
        # Anglais
        "formula 1", "f1", "grand prix", "ferrari", "mercedes",
        "red bull", "pole position", "pit stop",
    ],

    "Golf": [
        # Arabe
        "الغولف", "بطولة ماسترز", "بطولة بريطانيا المفتوحة",
        # Français
        "golf", "green", "eagle", "birdie", "par", "bogey",
        "masters", "open", "club",
        # Anglais
        "golf", "birdie", "eagle", "par", "bogey", "masters",
        "pga", "open championship",
    ],

    "Handball": [
        # Arabe
        "كرة اليد", "دوري كرة اليد", "بطولة كرة اليد",
        # Français
        "handball", "hand", "gardien de but", "ailier",
        "pivot", "jet de 7 mètres",
        # Anglais
        "handball", "goalkeeper",
    ],

    "Volleyball": [
        # Arabe
        "الكرة الطائرة", "طائرة",
        # Français
        "volleyball", "volley", "filet", "service", "smash",
        # Anglais
        "volleyball", "spike", "set", "libero",
    ],
}

# Catégories en arabe → nom normalisé
ARABIC_CAT_MAP = {
    "كرة القدم":    "Football",
    "التنس":        "Tennis",
    "كرة السلة":   "Basketball",
    "الرغبي":       "Rugby",
    "الدراجات":    "Cyclisme",
    "السباحة":     "Natation",
    "ألعاب القوى": "Athlétisme",
    "الملاكمة":    "Boxe",
    "الفورمولا 1": "Formule 1",
    "الغولف":      "Golf",
}


def detect_language(text: str) -> str:
    """Détecte si le texte est majoritairement arabe."""
    if not text:
        return "other"
    arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    total_chars = len(text.replace(" ", ""))
    if total_chars == 0:
        return "other"
    ratio = arabic_chars / total_chars
    return "arabic" if ratio > 0.25 else "latin"


def classify_article(title: str, source: str = "") -> str:
    """
    Classifie un article dans une catégorie sportive.
    Supporte arabe, français, anglais, espagnol.
    """
    text = (title + " " + source).lower()

    best_cat = "Autre"
    best_score = 0

    for category, keywords in KEYWORDS.items():
        score = 0
        for kw in keywords:
            kw_lower = kw.lower()
            if kw_lower in text:
                # Bonus si mot-clé long (plus spécifique)
                score += len(kw_lower.split())
        if score > best_score:
            best_score = score
            best_cat = category

    return best_cat


def organize_articles(input_path: str, output_path: str) -> pd.DataFrame:
    """Charge le CSV et classifie chaque article."""
    print(f"📂 Lecture : {input_path}")
    df = pd.read_csv(input_path, encoding="utf-8-sig")

    # Normaliser les noms de colonnes
    df.columns = [c.strip().lower() for c in df.columns]
    col_map = {
        "titre": "title", "title": "title",
        "source": "source",
        "categorie": "category", "category": "category", "discipline": "category",
        "date": "date",
        "resume": "summary", "summary": "summary",
        "url": "url", "lien": "url",
        "credibility": "credibility", "credibilite": "credibility",
    }
    df = df.rename(columns={c: col_map.get(c, c) for c in df.columns})

    if "title" not in df.columns:
        raise ValueError("Colonne 'titre' ou 'title' introuvable dans le CSV")

    print(f"📊 {len(df)} articles à classifier…")

    # Classifier
    df["category"] = df.apply(
        lambda row: classify_article(
            str(row.get("title", "")),
            str(row.get("source", ""))
        ),
        axis=1
    )

    # Stats
    counts = df["category"].value_counts()
    print("\n📈 Résultats de classification :")
    for cat, n in counts.items():
        pct = n / len(df) * 100
        print(f"   {cat:20s} → {n:4d} articles ({pct:.1f}%)")

    # Sauvegarder
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n✅ Sauvegardé : {output_path}")
    return df


if __name__ == "__main__":
    BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    inp = os.path.join(BASE, "data", "output", "articles.csv")
    out = os.path.join(BASE, "data", "output", "organized_articles.csv")

    if not os.path.exists(inp):
        print(f"❌ Fichier introuvable : {inp}")
        print("   → Exécutez d'abord scraper.py")
    else:
        organize_articles(inp, out)
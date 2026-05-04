"""
run_pipeline.py — Exécute tout le pipeline ISIC en une commande
Usage : python src/run_pipeline.py
"""

import subprocess
import sys
import os
import time

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "src")
PY = sys.executable


def run_step(name: str, script: str, emoji: str):
    print(f"\n{'='*55}")
    print(f"{emoji}  {name}")
    print(f"{'='*55}")
    start = time.time()
    result = subprocess.run([PY, os.path.join(SRC, script)])
    elapsed = time.time() - start
    if result.returncode == 0:
        print(f"✅ {name} terminé en {elapsed:.1f}s")
    else:
        print(f"❌ Erreur dans {name} (code {result.returncode})")
        sys.exit(result.returncode)


if __name__ == "__main__":
    print("\n" + "🚀 " * 10)
    print("   PIPELINE ISIC — VEILLE SPORTIVE MULTILINGUE")
    print("🚀 " * 10)

    run_step("Scraping des sources",        "scraper.py",         "📡")
    run_step("Classification multilingue",  "ai_organizer.py",    "🏷️")
    run_step("Enrichissement (résumés+img)","data_enricher.py",   "🖼️")
    run_step("Vérification des sources",    "source_verifier.py", "⭐")
    run_step("Génération des rapports",     "report_generator.py","📰")

    print("\n" + "✅ " * 10)
    print("   PIPELINE TERMINÉ AVEC SUCCÈS")
    print("✅ " * 10)
    print(f"\n📂 Ouvrez : web/index.html dans votre navigateur")
    print(f"   Ou lancez : python -m http.server 8000")
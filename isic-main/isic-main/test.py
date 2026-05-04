#!/usr/bin/env python3
"""
Test rapide de l'application ISIC
Vérifie que tous les composants fonctionnent
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test des imports principaux"""
    try:
        from config.settings import settings
        print("✅ Configuration chargée")

        from models.database import create_tables, Article
        print("✅ Modèles de base de données OK")

        from services.scraper_service import ArticleScraper
        print("✅ Service de scraping OK")

        from services.classifier_service import ArticleClassifier
        print("✅ Service de classification OK")

        from services.credibility_service import CredibilityEvaluator
        print("✅ Service de crédibilité OK")

        from services.ai_service import AIService
        print("✅ Service IA OK")

        from routes.api import router
        print("✅ Routes API OK")

        from main import app
        print("✅ Application FastAPI OK")

        return True
    except ImportError as e:
        print(f"❌ Erreur d'import: {e}")
        return False

def test_database():
    """Test de la base de données"""
    try:
        from models.database import create_tables, SessionLocal
        create_tables()
        print("✅ Base de données créée")

        # Test d'une session
        db = SessionLocal()
        db.close()
        print("✅ Connexion DB OK")
        return True
    except Exception as e:
        print(f"❌ Erreur base de données: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Test de l'application ISIC")
    print("=" * 40)

    # Test des imports
    if not test_imports():
        print("\n❌ Échec des imports - Vérifiez l'installation des dépendances")
        return

    # Test de la base de données
    if not test_database():
        print("\n❌ Échec de la base de données")
        return

    print("\n✅ Tous les tests sont passés!")
    print("\n🚀 Pour démarrer l'application:")
    print("   cd backend")
    print("   python main.py")
    print("\n📊 Puis ouvrez frontend/index.html dans votre navigateur")

if __name__ == "__main__":
    main()
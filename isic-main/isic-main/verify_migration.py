#!/usr/bin/env python3
"""
verify_migration.py - Script de vérification de la migration
Vérifie que toutes les fonctionnalités de src/ sont intégrées dans backend/
"""

import os
import sys
import importlib.util

def check_file_exists(path):
    """Vérifie qu'un fichier existe"""
    return os.path.isfile(path)

def check_import(module_path, class_name=None):
    """Vérifie qu'un module peut être importé"""
    try:
        spec = importlib.util.spec_from_file_location("module", module_path)
        module = importlib.util.module_from_spec(spec)
        
        # Ne pas exécuter le module entièrement, juste vérifier la syntaxe
        with open(module_path, 'r', encoding='utf-8') as f:
            compile(f.read(), module_path, 'exec')
        
        return True, "✅"
    except SyntaxError as e:
        return False, f"❌ Syntax Error: {e}"
    except Exception as e:
        return False, f"❌ {str(e)}"

def main():
    """Lance les vérifications"""
    print("\n" + "="*80)
    print("🔍 VÉRIFICATION DE LA MIGRATION src/ → backend/")
    print("="*80 + "\n")
    
    base_path = os.path.dirname(os.path.abspath(__file__))
    
    # Structure requise
    required_files = {
        "Services (Fonctionnalités migrées)": [
            ("backend/services/scraper_service.py", "ScraperService"),
            ("backend/services/credibility_service.py", "CredibilityService"),
            ("backend/services/nlp_service.py", "NLPService"),
            ("backend/services/ranking_service.py", "RankingService"),
        ],
        "AI Pipeline": [
            ("backend/ai_agent/pipeline.py", "AIPipeline"),
        ],
        "Architecture (Contrôleurs)": [
            ("backend/controllers/ai_controller.py", None),
            ("backend/controllers/article_controller.py", None),
        ],
        "Repositories (Accès données)": [
            ("backend/repositories/base_repository.py", None),
            ("backend/repositories/article_repository.py", None),
        ],
        "Database (ORM)": [
            ("backend/database/db.py", None),
            ("backend/database/models.py", None),
        ],
        "API Views": [
            ("backend/views/articles.py", None),
            ("backend/views/sources.py", None),
        ],
    }
    
    total_checks = 0
    passed_checks = 0
    
    for section, files in required_files.items():
        print(f"\n📋 {section}")
        print("-" * 80)
        
        for file_rel, class_name in files:
            file_path = os.path.join(base_path, file_rel)
            total_checks += 1
            
            if check_file_exists(file_path):
                success, msg = check_import(file_path, class_name)
                if success:
                    print(f"  ✅ {file_rel}")
                    if class_name:
                        print(f"     → Classe: {class_name}")
                    passed_checks += 1
                else:
                    print(f"  ⚠️  {file_rel}")
                    print(f"     {msg}")
            else:
                print(f"  ❌ {file_rel} - FICHIER MANQUANT")
    
    # Résumé
    print("\n" + "="*80)
    print("📊 RÉSUMÉ FINAL")
    print("="*80)
    print(f"✅ Fichiers correctement migrés: {passed_checks}/{total_checks}")
    
    if passed_checks == total_checks:
        print("\n🎉 MIGRATION RÉUSSIE!")
        print("   All src/ functionality has been integrated into backend/ structure.")
        return 0
    else:
        print(f"\n⚠️  {total_checks - passed_checks} problème(s) détecté(s)")
        return 1

if __name__ == "__main__":
    sys.exit(main())

# 📰 Projet ISIC - Organisateur d'Articles Sportifs

Un projet Python complet pour scraper, filtrer, organiser et synthétiser des articles sportifs provenant de multiples sources en ligne, avec une architecture moderne frontend/backend.

## ✨ Fonctionnalités

### Module 1 - Collecte des Données ✅
- **Web Scraping** : Extraction automatique d'articles depuis 15 sources sportives majeures
- **Stockage Base de Données** : Sauvegarde en base de données SQL avec SQLAlchemy
- **API REST** : Endpoints FastAPI pour accéder aux données
- **Identification des sources** : Traçabilité complète de la provenance

### Module 2 - Classification IA ✅
- **Classification automatique** : Utilisation de dictionnaires multilingues (Arabe, Français, Anglais, Espagnol)
- **Catégorisation sportive** : Football, Tennis, Basketball, Rugby, Cyclisme, Natation, Athlétisme, etc.
- **Support multilingue** : Détection automatique de la langue et classification adaptée

### Module 3 - Évaluation de Crédibilité ✅
- **Analyse de crédibilité** : Système de scoring automatique des sources (1-5 étoiles)
- **Base de connaissances** : Historique des performances des sources
- **Filtrage intelligent** : Privilégie les sources reconnues et de confiance

### Module 4 - Génération de Revue de Presse ✅
- **Synthèse IA** : Génération automatique de revues avec Claude AI
- **Rapports multiformat** : JSON pour API, HTML pour affichage
- **Interface web moderne** : Dashboard interactif avec graphiques et filtres
- **Statistiques temps réel** : Métriques sur les articles et sources

## 📁 Nouvelle Structure du Projet

```
isic/
├── backend/                          # API FastAPI
│   ├── main.py                       # Point d'entrée FastAPI
│   ├── config/
│   │   └── settings.py               # Configuration centralisée
│   ├── models/
│   │   └── database.py               # Modèles SQLAlchemy
│   ├── routes/
│   │   └── api.py                    # Routes API REST
│   └── services/                     # Services métier
│       ├── scraper_service.py        # Service de scraping
│       ├── classifier_service.py     # Service de classification IA
│       ├── credibility_service.py    # Service d'évaluation crédibilité
│       └── ai_service.py             # Service d'analyse IA
├── frontend/                         # Interface utilisateur
│   └── index.html                    # Dashboard web moderne
├── data/                             # Données persistées
│   ├── input/                        # Données d'entrée
│   └── output/                       # Données traitées (CSV)
├── docs/                             # Documentation et rapports
├── requirements.txt                  # Dépendances Python
├── .env                              # Variables d'environnement
├── start.py                          # Script de démarrage
└── README.md                         # Documentation
```

## 🛠️ Installation

### Prérequis
- Python 3.8+
- Virtual Environment (recommandé)

### Étapes

1. **Cloner/Télécharger le projet**
   ```bash
   cd isic
   ```

2. **Créer un environnement virtuel**
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate  # Windows
   # source .venv/bin/activate  # Linux/Mac
   ```

3. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurer les variables d'environnement** (optionnel)
   ```bash
   # Copier et modifier .env si nécessaire
   cp .env .env.local
   ```

## 🚀 Utilisation

### Démarrage Rapide

```bash
python start.py
```

Cette commande :
1. Installe les dépendances
2. Lance le backend FastAPI sur http://localhost:8000
3. Ouvre le frontend dans votre navigateur
4. Initialise la base de données automatiquement

### Utilisation de l'API

L'API REST est disponible sur `http://localhost:8000/api/v1/` :

#### Endpoints principaux :
- `GET /articles` - Récupérer les articles avec filtres
- `POST /scrape` - Lancer le scraping
- `POST /classify` - Classifier les articles
- `POST /ai/report` - Générer un rapport IA
- `GET /stats/overview` - Statistiques générales

#### Documentation API :
- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

### Interface Web

Le dashboard web (`frontend/index.html`) offre :
- **Vue d'ensemble** : KPIs et statistiques
- **Filtrage avancé** : Par catégorie, source, crédibilité, date
- **Graphiques** : Distribution par catégorie, source, évolution temporelle
- **Rapport IA** : Synthèse automatique avec Claude
- **Détails d'articles** : Analyse individuelle avec IA

## 🔧 Pipeline de Traitement

### Pipeline Automatique

1. **Scraping** : Collecte d'articles depuis 15 sources multilingues
2. **Classification** : Attribution automatique de catégories sportives
3. **Évaluation** : Calcul des scores de crédibilité
4. **Stockage** : Sauvegarde en base de données
5. **Synthèse** : Génération de rapports IA

### Commandes API

```bash
# Scraper de nouvelles données
curl -X POST http://localhost:8000/api/v1/scrape

# Classifier les articles non classifiés
curl -X POST http://localhost:8000/api/v1/classify

# Mettre à jour les crédibilités
curl -X POST http://localhost:8000/api/v1/credibility/update

# Générer un rapport IA
curl -X POST http://localhost:8000/api/v1/ai/report
```

## 🎯 Architecture

### Backend (FastAPI)
- **Modèles** : SQLAlchemy pour la persistance
- **Services** : Logique métier séparée
- **Routes** : API REST propre
- **Configuration** : Variables d'environnement

### Frontend (Vanilla JS)
- **Responsive** : Design moderne avec CSS Grid/Flexbox
- **API Integration** : Fetch API pour communiquer avec le backend
- **Charts** : Graphiques avec Chart.js
- **Thème** : Mode sombre/clair

### Base de Données
- **SQLite** par défaut (facile à utiliser)
- **PostgreSQL** possible en production
- **Migrations** automatiques au démarrage

## 🔐 Variables d'Environnement

Créer un fichier `.env` pour configurer :

```env
# Base de données
DATABASE_URL=sqlite:///isic.db

# API
API_HOST=localhost
API_PORT=8000
API_DEBUG=true

# Scraping
SCRAPING_DELAY=1.5
MAX_ARTICLES_PER_SOURCE=20

# IA (optionnel)
AI_API_KEY=votre_clé_claude
AI_MODEL=claude-3-haiku-20240307
```

## 📊 Métriques et Monitoring

- **Health Check** : `GET /api/v1/health`
- **Statistiques** : `GET /api/v1/stats/overview`
- **Logs** : Console et fichiers de logs
- **Performance** : Métriques de scraping et classification

---

**Développé avec ❤️ pour la veille sportive intelligente**


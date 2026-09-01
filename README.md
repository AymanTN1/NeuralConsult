# 🧠 NeuralConsult - Plateforme d'Accompagnement Clinique & IA Médicale

![NeuralConsult Banner](https://img.shields.io/badge/NeuralConsult-Medical%20AI-0052CC?style=for-the-badge&logo=health)

**NeuralConsult** est une plateforme SaaS innovante dédiée à l'accompagnement clinique et au suivi des patients (notamment dans le cadre du sevrage tabagique). Elle intègre des technologies d'Intelligence Artificielle de pointe, notamment un système **RAG (Retrieval-Augmented Generation)** pour offrir un assistant médical fiable, précis et basé sur des documents médicaux réels.

🔗 **Lien de Production** : [https://neural-consult-tabac.vercel.app](https://neural-consult-tabac.vercel.app)

---

## 🏗️ Architecture Globale du Projet

Le projet adopte une architecture moderne **Microservices / Distribuée** 100% hébergée dans le Cloud pour garantir scalabilité, performance et sécurité :

1. **Frontend (Vercel)** : Interface Utilisateur dynamique et fluide.
2. **Backend API (Render)** : Gestion de la logique métier, sécurité et orchestration.
3. **AI Knowledge Engine (Render)** : Microservice spécialisé dans le traitement du Langage Naturel (NLP) et la génération de réponses (LLM).
4. **Database (Supabase)** : Stockage relationnel haute performance.

---

## 🛠️ Stack Technologique & Détails Techniques

### 1. Frontend (Interface Utilisateur)
* **Framework** : React.js avec Vite.
* **Styling & Animations** : CSS Vanilla avancé, **GSAP (GreenSock)** pour des micro-animations fluides et un curseur dynamique, offrant une expérience utilisateur (UX) "Premium" et immersive.
* **Déploiement** : Vercel (Auto-déploiement CI/CD depuis GitHub).

### 2. Backend (Logique Métier & Sécurité)
* **Framework** : Java 21 & Spring Boot 3.2.
* **Sécurité** : Spring Security avec **JWT (JSON Web Tokens)** stockés de manière sécurisée via des cookies `HttpOnly` pour prévenir les attaques XSS.
* **ORM** : Hibernate / Spring Data JPA.
* **Fonctionnalités** : Gestion des profils (Médecins/Patients), génération de roadmaps de traitement, intégration d'un système de messagerie, vérification d'email.
* **Déploiement** : Render (via Dockerisation).

### 3. Service IA & RAG (Intelligence Artificielle)
* **Framework** : Python & FastAPI (Serveur asynchrone haute performance).
* **Orchestration LLM** : **LangChain**.
* **Modèles Utilisés** : 
  * *Google Generative AI (Gemini Pro)* : Pour la génération de texte et les Embeddings.
  * *Groq API* : Pour une inférence ultra-rapide (Llama 3 / Mixtral).
* **Base de Données Vectorielle** : **ChromaDB** (Stockage des embeddings locaux).

### 4. Base de Données
* **Fournisseur** : Supabase (AWS Cloud - PostgreSQL 16).
* **Configuration** : Connection Pooling via PgBouncer (Port `6543`) pour gérer des milliers de connexions simultanées sans surcharger la base.

---

## 🧠 L'Architecture RAG (Retrieval-Augmented Generation)

Le cœur de l'innovation de NeuralConsult réside dans son assistant médical qui ne se contente pas de "deviner" des réponses (hallucinations), mais se base sur des connaissances cliniques validées.

### Comment fonctionne notre RAG ?

1. **Ingestion des Données (Document Loading)** : 
   Nous utilisons `PyMuPDF` et les document loaders de LangChain pour lire des documents médicaux (ex: guides cliniques de sevrage).
2. **Fragmentation (Text Splitting)** : 
   Le texte est découpé en petits morceaux (chunks) sémantiquement cohérents à l'aide d'un `RecursiveCharacterTextSplitter`.
3. **Vectorisation (Embeddings)** : 
   Chaque chunk de texte est transformé en un vecteur mathématique grâce au modèle **Google Generative AI Embeddings**. Ce vecteur capture le *sens* du texte.
4. **Stockage (Vector Store)** : 
   Les vecteurs sont stockés dans **ChromaDB**.
5. **Recherche & Génération (Query & Generation)** :
   * Quand un patient pose une question, sa question est vectorisée.
   * ChromaDB recherche les *N* chunks de texte mathématiquement les plus proches (recherche de similarité).
   * Le contexte trouvé est injecté dans le prompt envoyé au LLM (Gemini ou un modèle Groq).
   * Le LLM génère une réponse précise, sourcée et formatée en Markdown, **sans aucune hallucination clinique**.

---

## 🔑 Gestion des Clés API & Sécurité

L'interaction avec les LLMs et les services externes nécessite une gestion rigoureuse des clés API (Secrets).

### Interaction avec l'IA
Le service IA s'attend à recevoir des variables d'environnement pour s'authentifier auprès des fournisseurs :
* `GEMINI_API_KEY` : Permet d'accéder aux modèles Google pour les embeddings et la génération.
* `GROQ_API_KEY` : (Optionnel/Hybride) Permet de router certaines requêtes vers le LPU (Language Processing Unit) de Groq pour une latence proche de 0.

### Déploiement Sécurisé (Cloud)
* **Aucune clé API n'est pushée sur GitHub** (présence dans le `.gitignore`).
* Lors du déploiement sur **Render**, les clés API sont injectées dynamiquement via le gestionnaire de "Environment Variables" sécurisé du tableau de bord.
* Le Backend Java communique avec le Service IA Python via un réseau privé ou une URL protégée, garantissant que les endpoints d'IA ne sont pas exposés publiquement sans authentification JWT.

---

## ⚙️ Flux d'Utilisation (Workflow)

1. **Onboarding** : Le patient s'inscrit, confirme son email, et remplit un formulaire d'évaluation clinique (ex: Test de Fagerström pour la dépendance).
2. **Analyse IA** : L'évaluation est envoyée au backend, qui la transmet au service IA. L'IA génère un profil de dépendance et un **Plan de Sevrage (Roadmap)** personnalisé.
3. **Suivi Médecin** : Le médecin accède au dossier du patient, valide la roadmap et surveille l'évolution.
4. **Assistance Continue** : Le patient interagit 24/7 avec l'agent conversationnel RAG pour des conseils médicaux urgents ou des encouragements, soulageant ainsi le temps médical du professionnel.

---

## 🚀 Lancement Local (Pour les développeurs)

Si vous souhaitez faire tourner le projet en local pour le développement :

```bash
# 1. Cloner le projet
git clone https://github.com/AymanTN1/NeuralConsult.git

# 2. Lancer la Base de données et les services via Docker
docker-compose up -d

# 3. Lancer le Frontend
cd frontend
npm install
npm run dev
```

*Note : Assurez-vous d'avoir un fichier `.env` à la racine contenant vos clés API valides.*

---
*Ce projet a été conçu avec une attention particulière à l'ingénierie logicielle robuste et à l'intégration éthique et performante de l'Intelligence Artificielle en santé.*

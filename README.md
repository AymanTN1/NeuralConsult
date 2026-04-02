# NeuralConsult Sevrage

Plateforme clinique de sevrage tabagique construite comme un poste de travail médical moderne.

Le projet transforme les données saisies par le patient en :

- un dossier patient structuré
- une évaluation clinique obligatoire
- des scores tabacologie / psychologie
- un plan de sevrage généré automatiquement
- une note clinique exploitable par le médecin
- un tableau de bord de suivi quotidien

L’application est organisée en 3 briques :

- `frontend` : interface React/Vite au style “clinical workstation”
- `backend` : API Spring Boot sécurisée par JWT cookie HTTP-only
- `ai-service` : microservice FastAPI pour la génération et la validation des notes cliniques

---

## 1. Vision du projet

`NeuralConsult Sevrage` n’est pas juste un formulaire tabacologie.

L’objectif est de construire une chaîne complète :

1. authentifier un patient
2. forcer la complétion de son évaluation initiale
3. centraliser son dossier personnel et clinique
4. calculer les scores utiles au sevrage
5. produire une synthèse lisible par le médecin
6. proposer un plan de prise en charge cohérent
7. suivre l’évolution dans le temps

Le fil directeur du produit est le suivant :

- le `Profile` contient l’identité et la démographie
- l’`Evaluation` contient la matière clinique et tabacologique
- les `Tests` calculent les scores officiels
- le `Plan` propose l’orientation thérapeutique
- la `Note clinique` synthétise les faits sans hallucination
- le `Dashboard` rend visible l’évolution

---

## 2. Stack technique réelle

Le code actuel utilise :

### Frontend

- React 18
- Vite 5
- React Router
- Axios
- Bootstrap 5 + Bootstrap Icons
- Recharts
- GSAP ScrollTrigger
- Three.js / `@react-three/fiber`

### Backend

- Java 21
- Spring Boot 3.2.5
- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- Spring Actuator
- PostgreSQL
- JWT via `jjwt`

### AI service

- Python
- FastAPI
- Pydantic v2
- Uvicorn
- httpx
- pytest

### Déploiement

- Docker Compose
- 4 services : `frontend`, `backend`, `ai-service`, `db`

---

## 3. Architecture globale

```text
Frontend (React/Vite)
    |
    |  HTTP + cookie JWT
    v
Backend (Spring Boot)
    |
    |  JPA / PostgreSQL
    v
Database

Backend
    |
    |  POST /api/clinical-notes/generate
    v
AI Service (FastAPI)
```

### Responsabilités

`frontend`

- affiche la landing page immersive
- gère l’authentification côté UX
- force la redirection vers l’évaluation si le profil est incomplet
- affiche les formulaires métier
- affiche les scores, graphiques et plans

`backend`

- gère les comptes utilisateurs
- sécurise les routes
- stocke les données du patient
- calcule et persiste les scores officiels
- orchestre les plans de sevrage
- prépare les faits pour le moteur de note clinique

`ai-service`

- génère une note médicale structurée à partir des faits
- valide automatiquement la cohérence minimale de cette note
- bloque la sauvegarde si la sortie n’est pas jugée valide

---

## 4. Structure du repository

```text
neuralconsult/
├── ai-service/      # FastAPI, génération de notes cliniques, préparation RAG
├── backend/         # Spring Boot API, sécurité, scoring, plans, journal, notes
├── database/        # schéma SQL de base
├── docker/          # Dockerfiles
├── docs/            # notes d’architecture / release notes
├── frontend/        # React + Vite
├── docker-compose.yml
└── README.md
```

---

## 5. Parcours utilisateur métier

### 5.1 Authentification

Le patient peut :

- créer un compte via `POST /api/auth/register`
- se connecter via `POST /api/auth/login`
- se déconnecter via `POST /api/auth/logout`

Le backend écrit un cookie JWT `NC_ACCESS` :

- `HttpOnly`
- `SameSite=Strict`
- utilisé automatiquement par Axios avec `withCredentials: true`

### 5.2 Forçage de l’onboarding

Le produit force la complétion de l’évaluation initiale à deux niveaux.

#### Côté frontend

Dans `frontend/src/components/ProtectedRoute.jsx` :

- si l’utilisateur n’est pas connecté : redirection vers `/login`
- si `user.profile.onboardingComplete === false` : redirection vers `/evaluation`

#### Côté backend

Dans `backend/src/main/java/com/neuralconsult/sevrage/security/OnboardingRequiredFilter.java` :

- toute route authentifiée est bloquée si le profil n’est pas complet
- le backend renvoie `428` avec :

```json
{"error":"ONBOARDING_REQUIRED"}
```

Exceptions autorisées :

- `/api/auth/**`
- `/api/onboarding`
- `/api/me`
- `/actuator/**`

Cela garantit qu’un patient ne peut pas “sauter” l’évaluation initiale.

---

## 6. Logique métier : séparation `Profile` vs `Evaluation`

Un point fort important du projet est la séparation entre :

### `Profile`

Page personnelle, limitée aux données d’identité.

Contenu principal :

- date de naissance
- sexe
- ville
- pays
- profession
- niveau d’études affiché en lecture issue de l’évaluation

La page `Profile` n’est plus censée porter la matière clinique lourde.

### `Evaluation` / `Profiling`

La timeline d’évaluation regroupe le dossier tabacologique structuré.

Phases actuelles :

1. `Social & Personal Context` : Q1 à Q11
2. `Medical Risks & History` : Q12 à Q17
3. `Smoking Habits & E-Cig` : Q18 à Q27
4. `Dependency Scoring` : préparation dépendance / motivation
5. `Social Vulnerability & Co-Addictions` : EPICES / AUDIT / CAGE / HONC / cannabis

Important :

- les données démographiques servent de `single source of truth`
- les données comme date de naissance, sexe, taille, poids, cigarettes/jour, âge de début tabac sont synchronisées dans `PatientProfile`
- les scores dérivés sont recalculés au backend

---

## 7. Entités de données principales

### `User`

Représente le compte applicatif.

Contient notamment :

- email
- mot de passe hashé
- nom complet

### `PatientProfile`

Noyau du dossier personnel agrégé.

Contient :

- date de naissance
- sexe
- taille / poids
- ville / pays
- profession
- cigarettes par jour
- âge de début tabac
- score Fagerström agrégé
- score HAD anxiété agrégé
- score HAD dépression agrégé
- niveau de dépendance agrégé
- notes médicales
- `is_onboarding_complete`

### `OnboardingAssessment`

Contient l’évaluation initiale détaillée :

- contexte social
- antécédents médicaux
- habitudes tabagiques
- e-cigarette
- budget tabac
- alcool
- CAGE
- cannabis
- EPICES
- HONC
- motivation / peurs / raisons d’arrêt

### `FagerstromTest`

Historise les évaluations officielles de dépendance tabagique.

### `HadTest`

Historise les évaluations officielles anxiété / dépression.

### `SevragePlan`

Stocke le plan thérapeutique généré :

- intensité
- résumé
- recommandation NRT
- recommandations comportementales
- plan de suivi
- protocole anti-rechute
- date de démarrage
- date cible
- étapes

### `ClinicalNote`

Stocke :

- synthèse clinique
- note complémentaire
- statut de validation
- nom du modèle
- snapshot JSON des faits utilisés

### `DailyReport`

Journal patient quotidien :

- cigarettes fumées
- intensité des cravings
- humeur
- stress
- usage NRT
- rechute
- notes

---

## 8. Logique complète du profiling / évaluation initiale

Le `profiling` n’est pas un simple formulaire monobloc.

Il sert à :

- constituer le dossier initial
- renseigner le contexte médico-social
- préparer la décision clinique
- alimenter les plans et les notes

### 8.1 Sauvegarde

Le backend reçoit un `OnboardingRequest` puis :

1. récupère ou crée le `PatientProfile`
2. copie les données personnelles dans `PatientProfile`
3. marque `onboardingComplete = true` au premier enregistrement réussi
4. récupère ou crée `OnboardingAssessment`
5. copie les réponses détaillées dans `OnboardingAssessment`
6. calcule les scores dérivés
7. persiste l’ensemble

Fichier clé :

- `backend/src/main/java/com/neuralconsult/sevrage/onboarding/OnboardingService.java`

### 8.2 Scores dérivés calculés pendant le profiling

Le backend calcule automatiquement :

- `cageScore`
- `cagePositive`
- `honcScore`
- `honcHighDependence`
- `alcoholScore`
- `epicesScore`

Ces scores sont calculés même si le frontend n’affiche qu’une partie des valeurs finales.

---

## 9. Logique de scoring : tests et calculs

Cette section est essentielle pour présenter le projet.

## 9.1 Fagerström

Le score Fagerström est calculé dans :

- `backend/src/main/java/com/neuralconsult/sevrage/medical/scoring/MedicalScoringService.java`
- DTO : `backend/src/main/java/com/neuralconsult/sevrage/medical/scoring/dto/FagerstromRequest.java`

### Questions prises en compte

Le test officiel codé actuellement utilise 6 items :

1. temps avant la première cigarette
2. difficulté à s’abstenir dans les lieux interdits
3. cigarette la plus difficile à abandonner
4. nombre de cigarettes par jour
5. consommation plus forte le matin
6. tabac même en cas de maladie

### Pondérations codées

`timeToFirstCigarette`

- `WITHIN_5_MIN` = 3
- `MIN_6_TO_30` = 2
- `MIN_31_TO_60` = 1
- `AFTER_60` = 0

`mostDifficultCigarette`

- `FIRST_IN_MORNING` = 1
- `ANY_OTHER` = 0

`cigarettesPerDay`

- `TEN_OR_LESS` = 0
- `ELEVEN_TO_TWENTY` = 1
- `TWENTY_ONE_TO_THIRTY` = 2
- `THIRTY_ONE_OR_MORE` = 3

Booléens

- `difficultToRefrain` = +1 si vrai
- `smokeMoreInMorning` = +1 si vrai
- `smokeWhenIll` = +1 si vrai

### Formule

```text
total =
  points(timeToFirstCigarette)
  + difficultToRefrain
  + points(mostDifficultCigarette)
  + points(cigarettesPerDay)
  + smokeMoreInMorning
  + smokeWhenIll
```

### Interprétation du résultat de test

Dans `FagerstromResult` :

- `0 à 2` => `NONE`
- `3 à 4` => `LOW`
- `5 à 6` => `MEDIUM`
- `7+` => `HIGH`

### Agrégation dans le profil patient

Le `PatientProfileService` recalcule un niveau agrégé légèrement plus fin :

- `0 à 2` => `NONE`
- `3 à 4` => `LOW`
- `5 à 6` => `MODERATE`
- `7 à 8` => `HIGH`
- `9+` => `VERY_HIGH`

Important :

- le `niveau` du test et le `niveau agrégé profil` n’utilisent pas exactement la même granularité
- c’est normal dans le code actuel
- pour une soutenance, il faut le dire clairement

## 9.2 HAD

Le score HAD est calculé dans :

- `backend/src/main/java/com/neuralconsult/sevrage/medical/scoring/MedicalScoringService.java`
- DTO : `backend/src/main/java/com/neuralconsult/sevrage/medical/scoring/dto/HadRequest.java`

### Principe

14 questions, chaque réponse vaut de `0` à `3`.

### Sous-scores

Anxiété :

```text
A = q1 + q3 + q5 + q7 + q9 + q11 + q13
```

Dépression :

```text
D = q2 + q4 + q6 + q8 + q10 + q12 + q14
```

### Interprétation

Fonction `interpretHad(score)` :

- `0 à 7` => `NORMAL`
- `8 à 10` => `BORDERLINE`
- `11+` => `CERTAIN_SYMPTOMATOLOGY`

### Conséquence

Après enregistrement d’un test HAD :

- les scores anxiété / dépression sont stockés dans `HadTest`
- les valeurs agrégées sont synchronisées dans `PatientProfile`

## 9.3 CAGE

Calculé pendant l’onboarding.

Questions booléennes :

- `cageCutDown`
- `cageAnnoyed`
- `cageGuilty`
- `cageEyeOpener`

### Formule

```text
cageScore = nombre de réponses vraies
```

### Interprétation

```text
cagePositive = cageScore >= 2
```

## 9.4 HONC

Calculé pendant l’onboarding.

Questions booléennes :

- `honcQ1` à `honcQ10`

### Formule

```text
honcScore = nombre de réponses vraies
```

### Interprétation

```text
honcHighDependence = honcScore >= 7
```

## 9.5 AUDIT-C simplifié

Calculé pendant l’onboarding.

Variables :

- `alcoholFrequency`
- `alcoholQuantity`
- `alcoholBinge`

### Formule

Si les 3 champs sont absents :

```text
alcoholScore = null
```

Sinon :

```text
alcoholScore =
  (alcoholFrequency ou 0)
  + (alcoholQuantity ou 0)
  + (alcoholBinge ou 0)
```

## 9.6 EPICES

Le code actuel ne calcule pas le score EPICES pondéré officiel.

Il calcule un `compteur de réponses positives` sur Q49 à Q59 :

```text
epicesScore = nombre de réponses vraies parmi 11 questions
```

C’est très important à expliquer :

- `epicesScore` dans l’application actuelle = compteur simple
- ce n’est pas encore la formule pondérée officielle EPICES

Le service de notes cliniques le rappelle explicitement dans sa logique.

---

## 10. Logique des tests cliniques

Les tests officiels sont gérés séparément dans l’espace `Tests`.

Fichiers clés :

- `frontend/src/pages/Tests.jsx`
- `backend/src/main/java/com/neuralconsult/sevrage/medical/tests/ClinicalTestService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/medical/tests/ClinicalTestController.java`

### Fonctionnement

Pour Fagerström et HAD, l’utilisateur peut :

- créer un test
- mettre à jour un test existant
- supprimer un test
- consulter l’historique

### Effet métier

À chaque enregistrement :

- le test est historisé
- le score est recalculé
- le profil patient agrégé est mis à jour
- le dashboard et les autres modules consomment ensuite les scores agrégés

### Synchronisation dossier patient

L’écran `Tests` réaffiche les données synchronisées du dossier patient :

- date de naissance
- sexe
- taille
- poids

Cela évite de redemander certaines informations déjà connues.

---

## 11. Génération des plans de sevrage

La logique de plan est un point central du projet.

Fichiers clés :

- `backend/src/main/java/com/neuralconsult/sevrage/plan/SevragePlanService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/strategy/PlanContext.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/strategy/HighDependenceStrategy.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/strategy/ModerateDependenceStrategy.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/strategy/LowDependenceStrategy.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/strategy/StandardRelapseProtocolStrategy.java`

## 11.1 Principe général

Le backend ne “bricole” pas un texte unique.

Il suit un `strategy pattern` :

1. construire un `PlanContext`
2. sélectionner la première stratégie compatible
3. construire un `PlanDraft`
4. persister ou mettre à jour `SevragePlan`

## 11.2 Données d’entrée du `PlanContext`

Le contexte lit :

- `fagerstromScore`
- `hadAnxietyScore`
- `hadDepressionScore`
- `dependenceLevel`
- `cagePositive`
- `honcHighDependence`
- fréquence de consommation cannabis

### Helpers importants

`hasSevereMoodSymptoms()`

- vrai si `HAD A >= 11` ou `HAD D >= 11`

`hasBorderlineMoodSymptoms()`

- vrai si `HAD A >= 8` ou `HAD D >= 8`

`cannabisFrequentUse()`

- vrai si fréquence = `TEN_TO_19`, `TWENTY_TO_29` ou `DAILY`

## 11.3 Sélection de stratégie

Ordre de priorité :

1. `HighDependenceStrategy`
2. `ModerateDependenceStrategy`
3. `LowDependenceStrategy`

### Stratégie haute dépendance

Condition :

- `fagerstromScore >= 7`
- ou `dependenceLevel == HIGH`
- ou `dependenceLevel == VERY_HIGH`

Sortie :

- intensité `INTENSIVE`
- date cible = `aujourd’hui + 14 jours`
- NRT combinée
- suivi hebdomadaire initial
- renforcement psychologique si symptômes sévères
- étapes supplémentaires si `cagePositive`
- étapes supplémentaires si usage cannabis fréquent

### Stratégie dépendance modérée

Condition :

- `4 <= fagerstromScore <= 6`

Sortie :

- intensité `MODERATE`
- date cible = `aujourd’hui + 10 jours`
- NRT adaptée
- coaching structuré
- suivi toutes les 2 semaines
- surveillance de l’humeur si HAD borderline

### Stratégie faible dépendance

Condition :

- stratégie de fallback

Sortie :

- intensité `BASIC`
- date cible = `aujourd’hui + 7 jours`
- accent sur motivation, routines saines, activité physique
- suivi mensuel

## 11.4 Protocole anti-rechute

Le protocole standard ajoute toujours :

- respiration lente
- hydratation
- marche rapide
- contact d’un proche ou soignant
- retour au plan sans culpabilité
- notation du déclencheur

Ajouts conditionnels :

- contact psychologique < 24h si symptômes sévères
- accompagnement spécialisé si alcool / cannabis problématique

## 11.5 Important : état réel du projet

Le code actuel :

- génère automatiquement **un plan unique**
- ne propose pas encore un vrai choix patient entre 3 plans mutuellement exclusifs

Autrement dit :

- la logique stratégique existe
- la sélection explicite par le patient n’est pas encore implémentée côté métier

---

## 12. Génération des notes cliniques

Le module “intelligence clinique” existe déjà, mais il faut le présenter honnêtement.

Fichiers clés :

- `backend/src/main/java/com/neuralconsult/sevrage/clinical/notes/ClinicalNotesService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/clinical/notes/AiClinicalNotesClient.java`
- `ai-service/app/clinical_notes.py`
- `ai-service/app/services/clinical_notes.py`
- `ai-service/app/services/knowledge_base.py`

## 12.1 Ce que fait réellement le système

Le backend :

1. assemble les faits du patient
2. les envoie au microservice AI
3. récupère une synthèse
4. vérifie que la validation est positive
5. sauvegarde la note seulement si la validation passe

## 12.2 Faits transmis au générateur

Le backend assemble 3 blocs :

`patient_profile`

- démographie
- consommation de base
- scores agrégés
- niveau de dépendance
- notes médicales

`onboarding_assessment`

- tabagisme actuel
- réduction récente
- budget tabac
- score EPICES
- antécédent de dépression
- autres problèmes de santé
- e-cigarette
- statut pro
- éducation
- tabac au domicile
- score alcool
- score CAGE
- score HONC

`tests`

- dernier Fagerström
- dernier HAD

## 12.3 Type de génération actuel

Le service AI n’est pas encore un LLM branché à une base vectorielle.

Aujourd’hui, le moteur est :

- déterministe
- basé sur les faits
- sans hallucination volontaire
- identifié comme `deterministic-v1`

Concrètement :

- il formate une `note médicale structurée`
- il formate une `note complémentaire`
- il ne doit pas inventer ce qui manque
- il explicite les champs absents

## 12.4 Validation automatique

La sortie est bloquée si :

- `medical_summary` est trop courte
- `complementary_note` est trop courte
- des scores présents dans les faits n’apparaissent pas dans la synthèse
- la section `Donnees manquantes` est absente

Si la validation échoue :

- le microservice renvoie `422`
- le backend ne persiste rien

## 12.5 Sauvegarde conditionnelle

Le backend respecte l’invariant suivant :

- **aucune note générée n’est sauvegardée si la validation échoue**

En cas de succès, il stocke aussi :

- `factsSnapshot` JSON

Ce snapshot est important pour :

- la traçabilité
- la revue médicale
- la lutte contre l’hallucination

## 12.6 Préparation RAG

Le projet est `RAG-ready`, mais pas encore branché à une base vectorielle.

La classe `KnowledgeBaseClient` est un stub volontaire :

- aujourd’hui : renvoie une liste vide
- demain : pourra interroger une base de connaissances INPES / recommandations officielles

C’est une préparation d’architecture, pas encore une intégration complète.

---

## 13. Dashboard et suivi quotidien

Le dashboard est construit pour transformer les données en trajectoire clinique lisible.

Fichiers clés :

- `frontend/src/pages/Dashboard.jsx`
- `backend/src/main/java/com/neuralconsult/sevrage/report/DailyReportService.java`

### Données chargées

Le dashboard récupère :

- plan courant
- rapports journaliers
- historique HAD
- onboarding
- note clinique

### Calculs visibles

`baselineDailyConsumption`

- `user.profile.cigarettesPerDay`
- sinon `onboarding.manufacturedCigarettesPerDay`

`averageDailyConsumption`

- moyenne des `cigarettesSmoked` sur les rapports quotidiens chargés

`avoidedPerDay`

```text
avoidedPerDay = max(0, baselineDailyConsumption - averageDailyConsumption)
```

`lifeMinutesGained`

```text
lifeMinutesGained = avoidedPerDay * 11 * max(nombreDeRapports, 1)
```

`estimatedCostPerCigarette`

```text
weeklySpend / (baselineDailyConsumption * 7)
```

si les données existent

`moneySaved`

```text
moneySaved = avoidedPerDay * estimatedCostPerCigarette * max(nombreDeRapports, 1)
```

### Intérêt clinique

Le dashboard met volontairement en avant :

- le temps de vie gagné
- les scores de risque
- l’évolution HAD anxiété / dépression
- les jalons de récupération

---

## 14. Landing page : logique produit et calculateur

La landing page n’est pas purement décorative.

Elle joue 3 rôles :

- attirer
- sensibiliser
- préparer à l’entrée dans le parcours

Fichier clé :

- `frontend/src/pages/Landing.jsx`

### Calculateur d’impact

Entrées :

- `cigarettesPerDay`
- `cigarettesPerPack`
- `packPrice`

Constante :

- `CO2_PER_CIGARETTE_KG = 0.014`

### Formules

```text
packsPerDay = cigarettesPerDay / cigarettesPerPack
dailySpend = packsPerDay * packPrice
monthlySavings = dailySpend * 30
yearlySavings = dailySpend * 365
yearlyCo2Kg = cigarettesPerDay * 365 * 0.014
```

Milestones :

- ils sont débloqués selon `yearlySavings`

Exemples actuels :

- week-end respiration
- ordinateur
- voyage
- scooter

### Timeline landing

La landing affiche aussi une roadmap centrale des phases cliniques.

Cette roadmap :

- illustre le parcours
- ne remplace pas la vraie logique métier d’évaluation
- sert d’orientation et d’impact visuel

---

## 15. Résumé fonctionnel des pages frontend

### `/`

- landing page immersive
- calculateur économies / CO2
- storytelling visuel
- roadmap du parcours

### `/login` et `/register`

- entrée sécurisée dans la plateforme

### `/evaluation`

- timeline obligatoire du dossier initial
- centralise les données cliniques et sociales

### `/profile`

- identité patient uniquement
- résumé démographique lisible
- édition contrôlée

### `/tests`

- Fagerström officiel
- HAD officiel
- historique des tests

### `/plan`

- plan thérapeutique généré
- intensité
- NRT
- comportement
- suivi
- anti-rechute

### `/dashboard`

- scores
- graphiques
- temps de vie gagné
- preview note clinique
- checklist santé

### `/journal`

- journal quotidien du patient

---

## 16. Endpoints API principaux

### Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Utilisateur / profil

- `GET /api/me`
- `PUT /api/patient-profile`
- `POST /api/patient-profile/scores`
- `DELETE /api/patient-profile`

### Onboarding

- `GET /api/onboarding`
- `POST /api/onboarding`

### Scoring direct

- `POST /api/medical/scoring/fagerstrom`
- `POST /api/medical/scoring/had`

### Tests historisés

- `GET /api/tests/fagerstrom`
- `POST /api/tests/fagerstrom`
- `PUT /api/tests/fagerstrom/{id}`
- `DELETE /api/tests/fagerstrom/{id}`
- `GET /api/tests/had`
- `POST /api/tests/had`
- `PUT /api/tests/had/{id}`
- `DELETE /api/tests/had/{id}`

### Plans

- `GET /api/sevrage-plan/current`
- `POST /api/sevrage-plan/generate`

### Notes cliniques

- `GET /api/clinical-notes`
- `POST /api/clinical-notes/generate`

### Journal

- `GET /api/daily-reports`
- `POST /api/daily-reports`
- `DELETE /api/daily-reports/{id}`

---

## 17. Comment lancer le projet

## 17.1 Avec Docker Compose

Depuis la racine `neuralconsult/` :

```bash
docker compose up --build
```

Services :

- frontend : `http://localhost:5173`
- backend : `http://localhost:8080`
- ai-service : `http://localhost:8000`
- PostgreSQL : `localhost:5432`

## 17.2 En local sans Docker

### Base de données

Créer une base PostgreSQL :

- base : `neuralconsult`
- user : `neural`
- password : `neuralpass`

### Backend

```bash
cd backend
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## 17.3 Configuration utile

Backend :

- `backend/src/main/resources/application.yml`

Frontend :

- `VITE_API_URL` optionnel, sinon `http://localhost:8080`

AI service :

- `.env.example` contient les placeholders futurs pour Gemini, DB et RAG

---

## 18. Note base de données importante

Si vous utilisez une ancienne base déjà existante et que la colonne d’onboarding n’existe pas encore, ajoutez-la :

```sql
ALTER TABLE patient_profile
ADD COLUMN is_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
```

Avec Docker Compose actuel, `spring.jpa.hibernate.ddl-auto=update` aide souvent à créer les colonnes manquantes, mais une migration explicite reste plus propre en environnement maîtrisé.

---

## 19. Forces du projet à mettre en valeur

Pour une soutenance ou une présentation, les points forts sont :

### 1. Architecture claire

- séparation frontend / backend / ai-service / db
- découpage propre des responsabilités

### 2. Sécurité métier réelle

- JWT en cookie HTTP-only
- protection Spring Security
- filtre backend pour imposer l’évaluation initiale

### 3. Dossier patient structuré

- vraie séparation entre identité et clinique
- réduction des doublons
- synchronisation des scores dans le profil

### 4. Scoring explicite et traçable

- Fagerström codé avec pondérations
- HAD codé avec sous-scores anxiété / dépression
- CAGE, HONC, AUDIT-C, EPICES calculés côté backend

### 5. Historisation

- historique Fagerström
- historique HAD
- journal quotidien

### 6. Génération de plans

- moteur à stratégies
- intensité adaptée au risque
- protocole anti-rechute intégré

### 7. Intelligence clinique sécurisée

- génération de note médicale
- validation automatique
- sauvegarde conditionnelle
- snapshot des faits pour traçabilité

### 8. Préparation RAG

- architecture prête pour brancher des recommandations officielles
- séparation explicite entre faits, génération, validation et références

### 9. UX produit forte

- landing immersive
- dashboard clinique
- timeline d’évaluation
- distinction visuelle entre état “candidate” et état “patient”

---

## 20. Limites actuelles et honnêteté technique

Pour une bonne présentation, il faut aussi être honnête sur l’état actuel.

### Déjà implémenté

- authentification
- onboarding forcé
- profil personnel séparé
- évaluation initiale structurée
- scoring Fagerström
- scoring HAD
- scores dérivés onboarding
- génération de plan
- note clinique déterministe validée
- dashboard
- journal quotidien

### Partiellement implémenté / à renforcer

- EPICES officiel pondéré : pas encore, compteur simple pour l’instant
- RAG réel : pas encore branché à une base vectorielle
- vraie génération LLM/Gemini : pas encore active dans le moteur clinique actuel
- choix patient parmi plusieurs plans exclusifs : pas encore implémenté côté métier
- intégration complète de tous les tests dans une seule timeline unifiée : encore en évolution

---

## 21. Fichiers les plus importants à connaître

### Frontend

- `frontend/src/App.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/Onboarding.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/Tests.jsx`
- `frontend/src/pages/Plan.jsx`
- `frontend/src/pages/Dashboard.jsx`

### Backend

- `backend/src/main/java/com/neuralconsult/sevrage/security/AuthController.java`
- `backend/src/main/java/com/neuralconsult/sevrage/security/OnboardingRequiredFilter.java`
- `backend/src/main/java/com/neuralconsult/sevrage/patient/PatientProfileService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/onboarding/OnboardingService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/medical/scoring/MedicalScoringService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/medical/tests/ClinicalTestService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/plan/SevragePlanService.java`
- `backend/src/main/java/com/neuralconsult/sevrage/clinical/notes/ClinicalNotesService.java`

### AI service

- `ai-service/app/clinical_notes.py`
- `ai-service/app/services/clinical_notes.py`
- `ai-service/app/services/knowledge_base.py`

---

## 22. En une phrase

`NeuralConsult Sevrage` est une plateforme clinique orientée sevrage tabagique qui combine dossier patient, évaluation médico-sociale, scoring tabacologie/psychologie, plan thérapeutique et synthèse clinique validée dans une architecture prête pour le RAG.

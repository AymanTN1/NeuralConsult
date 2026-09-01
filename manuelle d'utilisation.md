# manuelle d'utilisation

Ce guide explique comment demarrer NeuralConsult Sevrage en local pour les tests.

## Pre-requis
- Java 21
- Maven 3.9+
- Node.js 20+
- Python 3.11+
- Docker (optionnel mais recommande)

## Option 1: Docker Compose (recommande)
1. Ouvrir un terminal a la racine du projet `neuralconsult`.
2. Lancer:
   - `docker compose up --build`
3. Services exposes:
   - Backend: http://localhost:8080
   - Frontend: http://localhost:5173
   - AI Service: http://localhost:8000
   - Postgres: localhost:5432

## Option 2: Lancement manuel
### Base de donnees
- Demarrer PostgreSQL localement.
- Creer la base `neuralconsult` et un utilisateur `neural`/`neuralpass`.
- Executer `database/schema.sql` si besoin.

### Backend (Spring Boot)
1. Aller dans `backend`.
2. Lancer:
   - `mvn spring-boot:run`
3. Config JWT (fichier `backend/src/main/resources/application.yml`):
   - `security.jwt.secret` doit etre une cle d'au moins 32 caracteres.

### Frontend (React)
1. Aller dans `frontend`.
2. Lancer:
   - `npm install`
   - `npm run dev`
3. Ouvrir: http://localhost:5173

### AI Service (FastAPI)
1. Aller dans `ai-service`.
2. Lancer:
   - `python -m venv .venv`
   - `.venv\Scripts\activate`
   - `pip install -r requirements.txt`
   - `uvicorn main:app --reload --port 8000`

## Tests rapides
- Backend health: `GET http://localhost:8080/actuator/health`
- AI health: `GET http://localhost:8000/api/health`

## Notes securite
- En dev, `security.jwt.cookieSecure` est a `false`.
- En prod, activer HTTPS et passer `cookieSecure` a `true`.

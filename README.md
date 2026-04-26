# NeuralConsult Sevrage

README de reference pour un nouveau membre de l'equipe, pour un encadrant, ou pour une IA chargee de preparer une presentation du projet.

Ce document decrit **ce qui est reellement implemente dans le repository aujourd'hui** : fonctionnalites produit, roles, parcours utilisateurs, architecture technique, modules IA, automatisations, endpoints principaux et scenario de demo.

---

## 1. Resume executif

**NeuralConsult Sevrage** est une plateforme de sevrage tabagique qui combine :

- un parcours patient structure et obligatoire,
- un espace medecin pour l'analyse clinique,
- une validation admin des comptes praticiens,
- plusieurs assistants IA specialises,
- un suivi quotidien,
- des rendez-vous de teleconsultation,
- un espace communaute,
- un systeme de notifications + emails.

L'objectif n'est pas seulement de stocker un questionnaire, mais de construire une **chaine de prise en charge complete** :

1. creer et securiser le compte,
2. verifier l'email,
3. forcer l'evaluation initiale,
4. imposer le passage des tests cliniques,
5. imposer la premiere entree de journal,
6. orienter le patient vers un medecin,
7. produire des resumes cliniques IA,
8. assurer un suivi quotidien,
9. offrir un soutien psychologique IA 24/7,
10. permettre une teleconsultation visio avec le medecin,
11. maintenir l'engagement via la communaute.

---

## 2. Proposition de valeur du projet

Le projet repond a 4 problemes concrets :

- le patient tabagique abandonne souvent faute de suivi continu,
- le medecin manque de temps pour relire tout le dossier brut,
- les scores et observations sont disperses,
- l'accompagnement psychologique n'est pas disponible 24/7.

La plateforme apporte donc :

- une **evaluation initiale guidee**,
- des **tests normalises**,
- un **journal quotidien**,
- une **synthese IA medicale** pour le medecin,
- un **assistant psychologique IA** entre les rendez-vous,
- une **mise en relation structuree** patient-medecin,
- une **teleconsultation visio** gratuite via Jitsi Meet,
- une **communaute sociale** pour casser l'isolement.

---

## 3. Roles dans la plateforme

### 3.1 Patient

Le patient peut :

- creer un compte,
- verifier son email,
- reinitialiser son mot de passe avec un code a 6 chiffres,
- remplir l'evaluation initiale obligatoire,
- demander de l'aide IA question par question,
- passer les tests Fagerstrom et HAD,
- remplir son journal quotidien,
- consulter son dashboard,
- voir son plan de sevrage,
- discuter avec l'IA 24/7,
- envoyer une demande a un medecin,
- reserver une teleconsultation,
- rejoindre l'espace communaute,
- gerer son profil personnel.

### 3.2 Medecin

Le medecin peut :

- creer son profil praticien,
- attendre la validation admin,
- recevoir des demandes de patients,
- accepter ou refuser un rattachement patient,
- consulter le dossier medical complet d'un patient,
- voir les tests, le journal, la conversation IA et les alertes,
- lire les resumes IA de phase et le resume global,
- ajouter ses propres notes libres par phase,
- valider un plan candidat genere par l'IA,
- definir ses disponibilites de teleconsultation,
- confirmer/refuser/completer les rendez-vous,
- creer une consultation urgente hors planning normal,
- consulter et accuser les alertes critiques generees par l'IA 24/7.

### 3.3 Administrateur

L'administrateur peut :

- voir les comptes medecins en attente,
- valider ou refuser leur activation,
- controler la mise en relation medecin-patient via la gouvernance du systeme.

---

## 4. Fonctionnalites produit detaillees

## 4.1 Landing page et experience d'accueil

Le frontend propose une landing page immersive avec :

- une scene hero cinematographique,
- un scroll narratif,
- une animation visuelle autour de la consommation tabagique,
- un rendu des poumons degrade selon la progression du scroll,
- des sections de presentation de la plateforme,
- un theme bleu/blanc a identite clinique.

Objectif : donner une image moderne, medicale et memorisable au produit.

## 4.2 Authentification et securite utilisateur

Fonctionnalites implementees :

- inscription via `POST /api/auth/register`,
- connexion via `POST /api/auth/login`,
- deconnexion via `POST /api/auth/logout`,
- verification email via code a 6 chiffres,
- renvoi du code de verification,
- mot de passe oublie via code a 6 chiffres,
- reinitialisation du mot de passe,
- compte admin bootstrappe automatiquement,
- JWT stocke dans un cookie HTTP-only.

Points importants :

- l'email doit etre confirme avant usage normal du compte,
- le mot de passe n'est jamais recuperable en clair,
- les flux de verification et de reset utilisent de vrais emails si SMTP est configure,
- le login et les routes protegees utilisent le profil du compte et les roles.

## 4.3 Verification email reelle

Le projet supporte l'envoi reel d'emails avec SMTP Gmail ou autre fournisseur SMTP.

Emails deja implementes :

- code de verification d'email,
- code de reinitialisation du mot de passe,
- emails miroirs des notifications importantes,
- emails de rappel,
- emails d'alerte IA urgente,
- emails de lien visio de consultation.

## 4.4 Parcours patient obligatoire

Le produit force l'ordre suivant :

1. `Evaluation`
2. `Tests`
3. `Journal`
4. reste de la plateforme

Ce verrouillage existe a 2 niveaux :

- **frontend** : `ProtectedRoute.jsx`
- **backend** : `OnboardingRequiredFilter.java`

Codes d'erreur metier deja geres :

- `ONBOARDING_REQUIRED`
- `TESTS_REQUIRED`
- `JOURNAL_REQUIRED`

Cela garantit qu'un patient ne peut pas sauter le parcours clinique initial.

## 4.5 Evaluation initiale clinique

La page `Evaluation` est un des coeurs du projet.

Fonctionnalites :

- timeline centrale par phases,
- ouverture des phases dans un panel central,
- scroll visuel avec progression verticale,
- saisie d'un grand questionnaire clinique et tabacologique,
- separation claire entre donnees personnelles et donnees cliniques,
- sauvegarde backend de l'onboarding,
- generation de scores derives,
- aide utilisateur guidee par bulles lors de la premiere prise en main.

Le questionnaire couvre notamment :

- contexte social et personnel,
- antecedents medicaux,
- facteurs de risque,
- habitudes tabagiques,
- e-cigarette et autres produits,
- tentatives d'arret,
- motivations et craintes,
- alcool, cannabis, vulnerabilite sociale,
- informations utiles a l'evaluation de la dependance.

## 4.6 Assistant IA d'explication des questions

Pendant l'evaluation, le patient peut cliquer sur une icone d'aide IA sur chaque question.

Fonctionnalites :

- reformulation de la question en langage simple,
- clarification du sens medical,
- proposition prudente d'une interpretation,
- maintien de la reponse finale chez le patient,
- ancrage visuel de l'icone sur la question elle-meme.

Cette IA utilise son **propre RAG specialise** et ne partage pas directement le meme corpus que l'IA psychologique ou l'IA de notes cliniques.

## 4.7 Tests cliniques

La page `Tests` gere :

- **Fagerstrom** : dependance nicotinique,
- **HAD** : anxiete et depression.

Fonctionnalites :

- enregistrement des tests,
- modification des tests,
- suppression des tests,
- historique des tests,
- recalcul des indicateurs patient,
- redirection automatique vers `Journal` quand les tests requis sont termines.

## 4.8 Journal quotidien

La page `Journal` permet au patient de renseigner des entrees quotidiennes.

Informations suivies :

- cigarettes fumees,
- cravings,
- stress,
- humeur,
- symptomes de sevrage,
- declencheurs.

Fonctionnalites :

- ajout d'une entree journaliere,
- consultation de l'historique,
- suppression d'une entree,
- visualisation via graphiques cote dashboard et cote medecin,
- rappels automatiques si le journal n'est pas rempli pendant 2 jours consecutifs.

## 4.9 Dashboard patient

Le dashboard patient centralise :

- scores Fagerstrom et HAD,
- vues graphiques,
- synthese de progression,
- indicateurs derives,
- tendances issues du journal,
- elements utiles au sevrage.

## 4.10 Plan de sevrage

Le module `Plan` permet de :

- generer un plan de sevrage,
- consulter le plan courant,
- afficher les resumes IA et les points d'attention,
- exposer des pistes therapeutiques compréhensibles.

Cote medecin, les **plans candidats IA** peuvent etre lus puis valides avec une note medecin.

## 4.11 Notes cliniques et intelligence clinique

Le projet distingue plusieurs couches de synthese clinique :

### Note clinique IA

Elle contient une synthese medicale structurée a partir :

- de l'evaluation,
- des tests,
- du journal,
- des informations du profil.

### Resumes IA par phase

Pour chaque phase d'evaluation, l'IA genere :

- un petit resume utile au patient et au medecin,
- des points d'attention,
- une aide a l'analyse de la dependance.

### Notes libres du medecin par phase

Le medecin peut ajouter sa propre lecture clinique sur chaque phase.
Cette note est visible cote medecin uniquement.

### Resume global IA

Le resume global croise :

- evaluation initiale,
- tests Fagerstrom,
- tests HAD,
- journal quotidien,
- contexte medical et social,
- intensite de dependance,
- vulnerabilites.

### Validation de plan

Le medecin peut valider un plan candidat produit par l'IA et y attacher sa note clinique.

## 4.12 Repertoire medecins et association patient-medecin

Le patient dispose d'un annuaire medecin avec :

- liste des medecins visibles uniquement apres validation admin,
- matching par ville, pays ou teleconsultation,
- bio et informations du medecin,
- message optionnel au medecin,
- historique des demandes envoyees.

Regles metier :

- un patient deja rattache a un medecin ne voit plus l'annuaire complet,
- les rendez-vous ne sont reservables qu'avec le medecin associe,
- si l'association disparait, l'annuaire redevient visible.

## 4.13 Profil medecin et validation admin

Le medecin complete un profil incluant :

- ville,
- pays,
- specialite,
- annees d'experience,
- bio,
- disponibilite a la teleconsultation.

Ensuite :

- le compte reste en attente,
- l'administrateur voit la demande,
- l'administrateur approuve ou rejette,
- apres approbation, le medecin devient visible dans l'annuaire patient.

## 4.14 Workspace medecin

Le workspace medecin a ete pense comme un vrai poste de travail clinique.

Fonctionnalites :

- tableau des demandes patients en attente,
- tableau des patients associes,
- actions contextuelles par patient,
- chargement du dossier patient dans un panneau de travail,
- navigation interne entre plusieurs vues :
  - vue clinique,
  - profil patient,
  - dossier medical,
  - dashboard,
  - journal,
  - conversation IA,
  - synthese IA,
  - rendez-vous.

Le medecin peut y voir :

- les informations personnelles du patient,
- toutes les reponses de l'evaluation initiale,
- l'historique HAD et Fagerstrom,
- les entrees du journal,
- la note clinique IA,
- le resume global IA,
- les resumes IA de phase,
- les notes libres du medecin,
- les plans candidats,
- les rendez-vous lies a ce patient,
- l'historique de conversation IA 24/7.

## 4.15 IA psychologue 24/7

La page `IA 24/7` offre un espace de dialogue continu entre le patient et un assistant IA de soutien.

Fonctionnalites :

- conversation patient <-> IA,
- generation d'une reponse empathique courte et actionnable,
- evaluation du risque par l'IA,
- resume conversationnel,
- historisation des messages,
- rattachement du fil au medecin associe.

En cas de signal critique, l'IA peut :

- creer une **alerte medecin**,
- stocker la raison clinique de l'alerte,
- rendre l'alerte visible dans l'espace medecin,
- envoyer une notification et un email urgents,
- reproposer l'alerte toutes les 8 heures tant qu'elle reste ouverte,
- permettre au medecin d'accuser reception de l'alerte,
- proposer une consultation urgente depuis l'ecran d'alerte.

## 4.16 Rendez-vous et teleconsultation visio

Le module `Rendez-vous` est riche et couvre le patient comme le medecin.

### Cote medecin

Le medecin peut :

- definir des **disponibilites basees sur une date de calendrier**,
- choisir une plage horaire pour un jour lointain (mois prochain ou plus),
- modifier ou supprimer ses disponibilites,
- voir les demandes de consultation en attente,
- confirmer ou refuser un rendez-vous,
- marquer une consultation comme terminee,
- annuler une consultation,
- creer une **consultation urgente** hors disponibilites normales.

### Cote patient

Le patient peut :

- voir uniquement les disponibilites de son medecin associe,
- choisir un jour dans le calendrier,
- voir les seances de 20 minutes disponibles ce jour-la,
- demander un rendez-vous,
- suivre le statut de la demande,
- ouvrir la visio quand elle devient disponible.

### Regles metier

- 1 seance maximum par semaine,
- 4 seances maximum par mois,
- consultation urgente possible hors planning normal si le medecin la cree,
- les demandes patient arrivent d'abord en **attente**,
- le medecin doit confirmer pour finaliser la seance.

### Statuts geres

Le planning medecin distingue :

- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `REFUSED`
- `CANCELLED`

### Visio

Le projet integre une logique de teleconsultation gratuite via **Jitsi Meet** :

- generation automatique d'une salle,
- envoi du lien environ 10 minutes avant la consultation,
- bouton `Rejoindre la visio` dans l'interface,
- notifications et emails patient + medecin,
- rappel a 24h puis a 10 minutes.

## 4.17 Notifications in-app + emails miroir

Le systeme de notifications couvre :

- demandes patient -> medecin,
- reponses medecin -> patient,
- rappels de rendez-vous,
- lien visio disponible,
- consultation qui commence,
- rappels tests,
- rappels journal quotidien,
- alertes IA critiques.

Chaque notification importante peut etre :

- visible dans l'interface,
- marquee comme lue,
- comptee dans un badge de resume,
- miroir en email structure.

## 4.18 Communaute sociale

L'espace `Communautes` a evolue vers une experience de type reseau social.

Fonctionnalites principales :

- premiere entree dans la communaute = choix obligatoire d'un `username`,
- photo de profil optionnelle,
- fil `Pour vous`,
- espace `Explorer`,
- espace `Activite`,
- espace `Messages`,
- espace `Mon profil`,
- publication texte + photo,
- likes type `coeur`,
- commentaires affiches uniquement sur clic,
- compteur de commentaires visible sans ouvrir le detail,
- partage d'un post a un ami,
- recherche de profils,
- consultation d'un profil public,
- follow / unfollow,
- invitations d'amitie / connexion,
- acceptation ou refus des connexions,
- messagerie directe privee,
- affichage des interactions recues.

Important :

- les anciens comptes ne sont pas bloques globalement sur la plateforme,
- l'exigence du username sert surtout d'entree a l'espace communaute,
- la photo reste optionnelle.

### Capacite additionnelle cote backend

Le backend conserve aussi des endpoints de type :

- serveurs,
- salons,
- messages de salon,
- adhésion a un serveur.

La version UI principale actuellement expose surtout le **mode social/feed**, mais le backend garde une base pour une logique plus proche de serveurs/channels si l'equipe veut la reactiver plus tard.

## 4.19 Guide patient integre

La plateforme inclut un guide contextuel pour les nouveaux patients :

- bulles explicatives au premier passage,
- indication de la prochaine etape,
- explication du menu,
- accompagnement sur `Evaluation`, `Tests`, `Journal`, `Dashboard`, `Plan`, `Medecins`, `Rendez-vous`, `IA 24/7`, `Communautes` et `Profil`.

---

## 5. Architecture IA

Le projet utilise plusieurs couches IA distinctes.

## 5.1 Principe general

Le backend Spring Boot orchestre les donnees applicatives et appelle un microservice FastAPI dedie a l'IA.

Le microservice IA supporte deux fournisseurs si configures :

- **Groq** (priorite si configure)
- **Gemini** (fallback si Groq absent)

## 5.2 Services IA implémentés

### 1. Assistant d'explication des questions

Fichier principal :

- `ai-service/app/services/question_assistant.py`

Role :

- expliquer une question du formulaire,
- reformuler sans changer le sens clinique,
- proposer une suggestion prudente si possible.

### 2. IA psychologue / soutien 24/7

Fichier principal :

- `ai-service/app/services/support_chat.py`

Role :

- repondre au patient,
- detecter le niveau de risque,
- decider s'il faut alerter le medecin,
- produire une raison d'alerte.

### 3. IA de notes cliniques

Fichier principal :

- `ai-service/app/services/clinical_notes.py`

Role :

- produire une note clinique structurée,
- signaler les donnees manquantes,
- rester sobre et sans hallucination.

### 4. IA d'intelligence clinique globale

Fichier principal :

- `ai-service/app/services/clinical_intelligence.py`

Role :

- produire les resumes de phase,
- produire le resume global,
- proposer des plans candidats,
- extraire des priorites cliniques utiles au medecin.

## 5.3 Separation des RAGs

Un point important du projet est la separation des bases de connaissance par usage.

Fichier central :

- `ai-service/app/services/domain_knowledge.py`

RAGs separes :

- `Question-RAG` pour l'explication du questionnaire,
- `Psy-RAG` pour le soutien 24/7,
- `Notes-RAG` pour les notes medicales,
- `Clinical-Intel-RAG` pour les resumes et plans globaux.

Cela evite de melanger les consignes et ameliore la specialisation de chaque assistant.

---

## 6. Architecture technique

## 6.1 Briques principales

- `frontend` : React + Vite
- `backend` : Spring Boot + Spring Security + JPA
- `ai-service` : FastAPI
- `db` : PostgreSQL
- `adminer` : outil d'inspection base de donnees

## 6.2 Stack frontend

- React 18
- Vite 5
- React Router
- Axios
- Bootstrap 5 + Bootstrap Icons
- Recharts
- GSAP ScrollTrigger
- Three.js / `@react-three/fiber`

## 6.3 Stack backend

- Java 21
- Spring Boot 3.2.x
- Spring Web
- Spring Security
- Spring Data JPA
- Spring Validation
- Spring Actuator
- PostgreSQL
- JWT
- Scheduling Spring
- JavaMail / SMTP

## 6.4 Stack IA

- Python
- FastAPI
- Pydantic v2
- httpx
- pytest

## 6.5 Deploiement local

Le projet tourne via Docker Compose avec :

- `db` sur `5432`
- `backend` sur `8080`
- `frontend` sur `5173`
- `ai-service` sur `8000`
- `adminer` sur `8081`

---

## 7. Structure du repository

```text
neuralconsult/
├── ai-service/
│   ├── app/
│   │   ├── clinical_intelligence.py
│   │   ├── clinical_notes.py
│   │   ├── question_assistant.py
│   │   ├── support_chat.py
│   │   └── services/
│   └── tests/
├── backend/
│   └── src/main/java/com/neuralconsult/sevrage/
│       ├── appointment/
│       ├── clinical/
│       ├── community/
│       ├── doctor/
│       ├── mail/
│       ├── medical/
│       ├── notification/
│       ├── onboarding/
│       ├── patient/
│       ├── plan/
│       ├── report/
│       ├── security/
│       ├── support/
│       └── user/
├── database/
├── docker/
├── docs/
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── data/
│       ├── pages/
│       └── services/
├── docker-compose.yml
├── manuelle d'utilisation.md
└── README.md
```

---

## 8. Endpoints backend principaux par domaine

## 8.1 Authentification

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/me`

## 8.2 Onboarding / profil patient

- `GET /api/onboarding`
- `POST /api/onboarding`
- `PUT /api/patient-profile`
- `POST /api/patient-profile/scores`
- `DELETE /api/patient-profile`

## 8.3 Tests cliniques

- `POST /api/tests/fagerstrom`
- `PUT /api/tests/fagerstrom/{id}`
- `DELETE /api/tests/fagerstrom/{id}`
- `GET /api/tests/fagerstrom`
- `POST /api/tests/had`
- `PUT /api/tests/had/{id}`
- `DELETE /api/tests/had/{id}`
- `GET /api/tests/had`

## 8.4 Journal

- `POST /api/daily-reports`
- `GET /api/daily-reports`
- `DELETE /api/daily-reports/{id}`

## 8.5 IA et synthese clinique

- `POST /api/ai-assistant/assist`
- `GET /api/clinical-notes`
- `POST /api/clinical-notes/generate`
- `GET /api/clinical-intelligence`
- `POST /api/clinical-intelligence/generate`
- `POST /api/clinical-intelligence/plans/{candidateId}/validate`
- `POST /api/sevrage-plan/generate`
- `GET /api/sevrage-plan/current`

## 8.6 Medecins et association

- `POST /api/doctors/profile`
- `GET /api/doctors/profile/me`
- `GET /api/doctors`
- `GET /api/doctors/admin/pending`
- `POST /api/doctors/admin/{doctorProfileId}/approve`
- `POST /api/doctors/admin/{doctorProfileId}/reject`
- `POST /api/doctors/requests`
- `GET /api/doctors/requests/patient`
- `GET /api/doctors/association/patient`
- `GET /api/doctors/requests/doctor`
- `POST /api/doctors/requests/{id}/accept`
- `POST /api/doctors/requests/{id}/refuse`
- `GET /api/doctors/patients`
- `GET /api/doctors/patients/{patientProfileId}/dossier`
- `POST /api/doctors/patients/{patientProfileId}/phase-summaries/{phaseSummaryId}/doctor-note`

## 8.7 Rendez-vous

- `GET /api/appointments/patient`
- `GET /api/appointments/availability/patient`
- `POST /api/appointments`
- `POST /api/appointments/{id}/cancel`
- `POST /api/appointments/{id}/patient-update`
- `GET /api/appointments/doctor`
- `GET /api/appointments/availability/doctor`
- `POST /api/appointments/availability/doctor`
- `POST /api/appointments/availability/doctor/{id}/delete`
- `POST /api/appointments/doctor/urgent`
- `POST /api/appointments/{id}/doctor-update`
- `POST /api/appointments/{id}/confirm`
- `POST /api/appointments/{id}/refuse`
- `POST /api/appointments/{id}/complete`
- `POST /api/appointments/{id}/cancel-doctor`

## 8.8 Support 24/7

- `GET /api/support/current`
- `POST /api/support/current/messages`
- `GET /api/support/doctor/alerts`
- `POST /api/support/doctor/alerts/{id}/acknowledge`
- `GET /api/support/doctor/patients/{patientProfileId}`

## 8.9 Notifications

- `GET /api/notifications`
- `GET /api/notifications/summary`
- `POST /api/notifications/{id}/read`

## 8.10 Communaute

Mode social :

- `GET /api/communities/social`
- `GET /api/communities/social/profile`
- `PUT /api/communities/social/profile`
- `GET /api/communities/social/search`
- `GET /api/communities/social/users/{targetUserId}`
- `POST /api/communities/social/posts`
- `POST /api/communities/social/posts/{postId}/reactions`
- `POST /api/communities/social/posts/{postId}/comments`
- `POST /api/communities/social/posts/{postId}/share`
- `POST /api/communities/social/users/{targetUserId}/follow`
- `POST /api/communities/social/users/{targetUserId}/connections`
- `POST /api/communities/social/connections/{connectionId}/accept`
- `POST /api/communities/social/connections/{connectionId}/decline`
- `GET /api/communities/social/direct/{counterpartId}`
- `POST /api/communities/social/direct/{counterpartId}`

Mode serveurs/channels expose egalement :

- `GET /api/communities/servers`
- `POST /api/communities/servers`
- `POST /api/communities/servers/{serverId}/join`
- `GET /api/communities/servers/{serverId}`
- `GET /api/communities/channels/{channelId}/messages`
- `POST /api/communities/channels/{channelId}/messages`

---

## 9. Automatisations metier importantes

## 9.1 Automatisations rendez-vous

Taches planifiees :

- envoi du lien Jitsi environ 10 minutes avant la consultation,
- notification quand la visio commence,
- rappels de consultation a 24h,
- rappels de consultation a 10 minutes,
- creation technique de la salle si necessaire.

## 9.2 Automatisations patient

- rappel des tests si incomplets,
- rappel du journal si non rempli depuis 2 jours,
- synchronisation des flags `testsComplete` / `journalComplete`.

## 9.3 Automatisations IA critiques

- creation d'une alerte medecin si l'IA 24/7 detecte un risque,
- envoi d'un email urgent,
- renvoi de l'email toutes les 8 heures tant que l'alerte reste ouverte,
- arret des relances apres `acknowledge` du medecin.

---

## 10. Frontend : pages et usage

### Pages publiques

- `/` : landing page
- `/login` : connexion
- `/register` : inscription
- `/verify-email` : verification email
- `/forgot-password` : reinitialisation mot de passe

### Pages protegees patient

- `/evaluation`
- `/tests`
- `/journal`
- `/dashboard`
- `/plan`
- `/doctors`
- `/appointments`
- `/support`
- `/communities`
- `/profile`
- `/notifications`

### Pages protegees medecin

- `/dashboard` : workspace patient/gestion patients
- `/appointments` : planning et disponibilites
- `/support` : conversations IA et alertes
- `/communities`
- `/profile` : profil medecin
- `/notifications`

### Pages protegees admin

- `/dashboard` : validation des comptes medecins

---

## 11. Lancement local

## 11.1 Docker Compose (recommande)

Depuis la racine du projet :

```bash
docker compose up --build
```

Acces :

- frontend : `http://localhost:5173`
- backend : `http://localhost:8080`
- ai-service : `http://localhost:8000`
- adminer : `http://localhost:8081`

## 11.2 Variables d'environnement importantes

Exemples dans `.env.example` :

- `APP_MAIL_ENABLED`
- `APP_MAIL_FROM_ADDRESS`
- `APP_MAIL_FROM_NAME`
- `SPRING_MAIL_HOST`
- `SPRING_MAIL_PORT`
- `SPRING_MAIL_USERNAME`
- `SPRING_MAIL_PASSWORD`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## 11.3 Sante des services

- backend : `GET http://localhost:8080/actuator/health`
- ai-service : `GET http://localhost:8000/api/health`

---

## 12. Comptes et bootstrap utiles

Compte admin bootstrappe automatiquement :

- email : `admin@neuralconsult.ma`
- mot de passe : `Admin123!`

**Important** : a changer immediatement en environnement reel.

---

## 13. Scenario de demo conseille pour une presentation

Voici un scenario de soutenance simple et fort.

### Etape 1 : Landing + vision

Montrer :

- landing page,
- identite medicale,
- narration du probleme tabagique.

### Etape 2 : Creation de compte

Montrer :

- inscription,
- verification email par code,
- login.

### Etape 3 : Parcours obligatoire patient

Montrer :

- redirection forcee vers `Evaluation`,
- timeline par phases,
- aide IA sur une question,
- enregistrement des reponses,
- passage vers `Tests`,
- passage vers `Journal`.

### Etape 4 : Lecture clinique patient

Montrer :

- dashboard,
- plan,
- note clinique IA,
- resume global IA.

### Etape 5 : Medecin

Montrer :

- creation / validation du profil medecin,
- demande de rattachement,
- acceptation cote medecin,
- ouverture du dossier patient,
- vues `Profil`, `Dossier medical`, `Dashboard`, `Journal`, `Conversation IA`, `Synthese IA`.

### Etape 6 : Support psychologique IA

Montrer :

- conversation patient avec IA 24/7,
- detection d'une alerte,
- lecture de l'alerte cote medecin,
- bouton `Consultation urgente`.

### Etape 7 : Rendez-vous visio

Montrer :

- disponibilites du medecin,
- reservation patient,
- confirmation medecin,
- rappel,
- lien Jitsi Meet.

### Etape 8 : Communaute

Montrer :

- creation du username,
- post photo / texte,
- commentaires sur clic,
- coeur,
- partage a un ami,
- messagerie privee.

---

## 14. Points forts a mettre en avant dans une soutenance

- parcours clinique **force** et non cosmetique,
- separation claire patient / medecin / admin,
- multiple IA **specialisees** au lieu d'un seul assistant generique,
- separation des RAGs par usage,
- synthese IA exploitable par le medecin,
- soutien psychologique IA 24/7 avec escalade clinique,
- teleconsultation visio gratuite integree dans le workflow,
- communaute sociale de soutien,
- notifications + emails + automatisations,
- architecture dockerisee propre et modulaire.

---

## 15. Limites connues / perimetre actuel

Pour eviter toute confusion pendant une presentation, voici ce qui est important :

- le projet couvre deja beaucoup de fonctionnalites produit reelles,
- la communaute expose deux modeles cote backend : social feed et serveurs/channels, mais le frontend met surtout en avant le mode social,
- l'integration visio s'appuie sur Jitsi Meet via lien genere automatiquement,
- il n'y a pas actuellement de module finalise de lecture automatique de radiographies pulmonaires dans ce repository,
- il faut un SMTP configure pour l'envoi reel des emails.

---

## 16. En une phrase

**NeuralConsult Sevrage est une plateforme clinique de sevrage tabagique qui structure l'onboarding medical, automatise les syntheses IA, relie patient et medecin, organise les teleconsultations et maintient l'accompagnement entre les rendez-vous grace a l'IA 24/7 et a la communaute.**

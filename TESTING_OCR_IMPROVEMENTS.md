# Guide de Test - Améliorations OCR du Frontend

## 🚀 Démarrage Rapide

### Windows (PowerShell)
```powershell
cd C:\Users\ayman\Desktop\NeuralConsult\neuralconsult
.\build-ocr-test.bat all
```

### Linux/Mac (Bash)
```bash
cd ~/Desktop/NeuralConsult/neuralconsult
chmod +x build-ocr-test.sh
./build-ocr-test.sh all
```

### Après ~2-3 minutes
- Accédez à: **http://localhost:5173/#/register**
- Testez l'OCR avec une photo de carte d'identité

---

## 📋 Commandes Disponibles

### Windows (Batch)
```batch
build-ocr-test.bat build       # Construire image Docker
build-ocr-test.bat run         # Démarrer conteneur
build-ocr-test.bat test        # Tester conteneur
build-ocr-test.bat logs        # Afficher logs
build-ocr-test.bat clean       # Arrêter/supprimer conteneur
build-ocr-test.bat all         # Tout faire
build-ocr-test.bat help        # Afficher aide
```

### Linux/Mac (Bash)
```bash
./build-ocr-test.sh build       # Construire image Docker
./build-ocr-test.sh run         # Démarrer conteneur
./build-ocr-test.sh test        # Tester conteneur
./build-ocr-test.sh logs        # Afficher logs
./build-ocr-test.sh clean       # Arrêter/supprimer conteneur
./build-ocr-test.sh all         # Tout faire
./build-ocr-test.sh help        # Afficher aide
```

---

## ✅ Checklist de Test

### Test 1: Upload d'Images Valides
**Objectif**: Vérifier que les images correctes passent la validation

- [ ] Upload JPEG landscape (800×500px) → ✓ Acceptée → OCR réussit
- [ ] Upload PNG landscape (1000×600px) → ✓ Acceptée → OCR réussit
- [ ] Upload PDF avec CIN → ✓ Acceptée → OCR réussit

**Résultat attendu**: 
- Image affichée en preview
- Bouton "Lire la CIN" actif
- OCR s'exécute sans erreur (8-12 secondes)
- Noms/prénoms/dates extraits correctement

---

### Test 2: Rejet d'Images Trop Petites
**Objectif**: Vérifier validation dimensions minimum

- [ ] Upload image 300×200px
- [ ] Upload image 400×250px

**Résultat attendu**:
```
Fichier rejeté: "Image trop petite. Minimum 500×320px. 
Votre image: 300×200px"
```

Validation timing: < 1 seconde
Couleur: ⚠️ Warning (jaune)

---

### Test 3: Rejet d'Images Trop Grandes
**Objectif**: Vérifier limite taille maximale

- [ ] Upload image 4000×3000px
- [ ] Upload fichier PNG 5MB

**Résultat attendu**:
```
Fichier rejeté: "Image trop grande. Maximum 3000×2000px"
Fichier rejeté: "Fichier trop volumineux. Maximum 3MB"
```

---

### Test 4: Détection Portrait
**Objectif**: Vérifier rejet images en mode portrait

- [ ] Upload image 500×800px (portrait)
- [ ] Upload image 600×900px (portrait)

**Résultat attendu**:
```
Fichier rejeté: "Image détectée en mode portrait. 
Les cartes doivent être en mode paysage (horizontal). 
Veuillez les tourner."
```

---

### Test 5: Détection de Flou
**Objectif**: Vérifier détection flou

- [ ] Upload photo très flou (testé avec variance Laplacienne)
- [ ] Upload photo nette

**Résultat attendu pour flou**:
```
Fichier rejeté: "Image flou ou mauvaise qualité détectée. 
Utilisez une photo nette et bien éclairée."
```

---

### Test 6: Validation Format de Fichier
**Objectif**: Vérifier que seuls JPEG/PNG/PDF acceptés

- [ ] Upload image .bmp → ✗ Rejeté
- [ ] Upload image .webp → ✗ Rejeté
- [ ] Upload image .jpg → ✓ Acceptée
- [ ] Upload image .png → ✓ Acceptée

**Résultat attendu pour .bmp**:
```
Fichier rejeté: "Format non autorisé. 
Acceptez: JPEG ou PNG. Format détecté: image/bmp"
```

---

### Test 7: Auto-Rotation OCR
**Objectif**: Vérifier que images tournées sont auto-corrigées

**Procédure**:
1. Prendre photo de CIN
2. La tourner manuellement 90° dans un éditeur d'image
3. Sauver comme "cin-rotated.jpg"
4. Upload "cin-rotated.jpg"
5. Validation dimensions: ✓ OK (ratio toujours valide)
6. Cliquer "Lire la CIN"
7. OCR teste les 4 rotations automatiquement

**Résultat attendu**:
- OCR prend un peu plus de temps (8-12s au lieu de 5-8s)
- Les 4 rotations sont testées en arrière-plan
- Meilleure rotation sélectionnée
- Noms/prénoms/dates extraits correctement même si image tournée

**Vérification avancée** (console browser):
```javascript
// Les logs du worker OCR montreront les 4 rotations testées
```

---

### Test 8: Aspect Ratio Invalide
**Objectif**: Vérifier rejet images avec ratio incorrect

- [ ] Upload image 200×800px (trop étiré)
- [ ] Upload image 1500×200px (trop plat)

**Résultat attendu**:
```
Fichier rejeté: "Rapport d'aspect incorrect. 
Attendu: 1.3:1 à 1.8:1. Détecté: X.XX:1. 
Assurez-vous que toute la carte est visible."
```

---

### Test 9: Validation de Fichier PDF
**Objectif**: Vérifier support PDF et limitation de taille

- [ ] Upload PDF < 5MB → ✓ Accepté
- [ ] Upload PDF 6MB → ✗ Rejeté

**Résultat attendu pour PDF trop gros**:
```
Fichier rejeté: "Fichier trop volumineux. 
Maximum 5MB. Votre fichier: 6MB"
```

---

### Test 10: UX & Messages d'Erreur
**Objectif**: Vérifier que les messages aident l'utilisateur

**Checklist**:
- [ ] Messages d'erreur sont clairs et spécifiques
- [ ] Messages contiennent chiffres exactes (tailles, dimensions)
- [ ] Messages fournissent des solutions ("Tournez l'image", etc.)
- [ ] Erreurs validation = avertissement (jaune)
- [ ] Erreurs OCR = danger (rouge)
- [ ] Placeholder affiche contraintes acceptées
- [ ] Aucun message générique du type "Erreur"

---

## 🔍 Résultats Attendus vs Réels

### Validation Immédiate (< 1 seconde)
```
AVANT: Upload → Pas de retour → Utilisateur attend
APRÈS: Upload → Validation immédiate → Message spécifique ✓
```

### Auto-Rotation (Transparent à l'utilisateur)
```
AVANT: Upload image tournée → OCR échoue 50% du temps
APRÈS: Upload image tournée → Auto-corrigée silencieusement ✓
```

### Flou Détecté
```
AVANT: Upload flou → OCR 8s → N'importe quoi
APRÈS: Upload flou → Rejeté (< 1s) → Message ✓
```

---

## 🛠️ Troubleshooting

### Docker pas trouvé
```bash
# Installez Docker Desktop si absent
# https://www.docker.com/products/docker-desktop
```

### Port 5173 déjà utilisé
```bash
# Trouvez ce qui utilise le port
netstat -ano | findstr :5173

# Ou changez le port dans le script
# Cherchez FRONTEND_PORT et changez la valeur
```

### Build Docker échoue
```bash
# Nettoyez les images existantes
docker system prune -a

# Réessayez le build
.\build-ocr-test.bat build
```

### Conteneur s'arrête immédiatement
```bash
# Vérifiez les logs
docker logs <container_name>

# Vérifiez que docker/frontend.Dockerfile existe
ls docker/frontend.Dockerfile
```

---

## 📊 Métriques de Test

À la fin des tests, vous devriez observer:

| Métrique | Attendu |
|----------|---------|
| Temps validation image | < 1 seconde |
| Temps OCR (bonne image) | 8-12 secondes |
| Images rejetées | Immédiatement avant OCR |
| Taux succès OCR | 85-90%+ |
| Messages d'erreur clarté | Spécifiques & actionables |
| Auto-rotation | Transparent (silent success) |

---

## 📝 Notes pour Reporter Bugs

Si vous trouvez un problème, incluez:

1. **Commande exécutée**: `build-ocr-test.bat all`
2. **Type d'image testée**: Taille, format, rotation
3. **Comportement attendu**: Devrait être acceptée/rejetée
4. **Comportement réel**: Que s'est-il passé
5. **Message d'erreur**: Screenshot ou texte exact
6. **Logs du conteneur**: `docker logs neuralconsult-frontend-ocr-test`

---

## ✨ Prochaines Étapes

Après validation locale:
1. Committer les changements
2. Pusher vers Git
3. Builder image finale: `docker build -t aymantantani/neuralconsult-frontend:v2.0 .`
4. Pousser image vers registry
5. Mettre à jour production avec nouvelle image

---

**Version**: 1.0 (29 avril 2026)  
**Dernière mise à jour**: 2026-04-29

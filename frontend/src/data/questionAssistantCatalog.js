const yesNoChoices = [
  { value: "true", label: "Oui" },
  { value: "false", label: "Non" }
];

const scoreChoices = Array.from({ length: 11 }, (_, index) => ({
  value: String(index),
  label: String(index)
}));

const trimesterChoices = [
  { value: "1", label: "1er trimestre" },
  { value: "2", label: "2eme trimestre" },
  { value: "3", label: "3eme trimestre" }
];

const makeEntry = (phaseId, questionLabel, choices = [], questionContext = "") => ({
  phaseId,
  questionLabel,
  officialChoices: choices,
  questionContext
});

const makeYesNoEntry = (phaseId, questionLabel, questionContext) =>
  makeEntry(phaseId, questionLabel, yesNoChoices, questionContext);

const makeNumericEntry = (phaseId, questionLabel, questionContext) =>
  makeEntry(phaseId, questionLabel, [], questionContext);

const makeTextEntry = (phaseId, questionLabel, questionContext) =>
  makeEntry(phaseId, questionLabel, [], questionContext);

export const QUESTION_ASSISTANT_CATALOG = {
  appointmentLeadDays: makeNumericEntry(
    1,
    "Depuis combien de jours avez-vous pris rendez-vous ?",
    "L'IA doit aider le patient a retrouver un nombre de jours reel entre la prise de rendez-vous et aujourd'hui. Pas d'estimation vague."
  ),
  dateOfBirth: makeNumericEntry(
    1,
    "Date de naissance",
    "L'IA doit demander la date officielle de naissance, car elle sert a calculer l'age clinique et le contexte medical."
  ),
  sex: makeEntry(1, "Sexe", [
    { value: "FEMALE", label: "Femme" },
    { value: "MALE", label: "Homme" },
    { value: "OTHER", label: "Autre" }
  ], "L'IA doit simplement clarifier la categorie administrative a selectionner dans le dossier."),
  heightCm: makeNumericEntry(1, "Taille (cm)", "Attendre une taille en centimetres. L'IA aide a convertir si le patient parle en metres."),
  weightKg: makeNumericEntry(1, "Poids (kg)", "Attendre un poids actuel en kilogrammes. Si le patient hesite, proposer son poids recent le plus fiable."),
  pregnant: makeYesNoEntry(1, "Etes-vous actuellement enceinte ?", "Question reservee aux patientes concernees. Repondre Oui seulement si la grossesse est actuelle."),
  pregnancyTrimester: makeEntry(1, "A quel trimestre de grossesse etes-vous ?", trimesterChoices, "L'IA aide a convertir le mois de grossesse en trimestre si besoin."),
  usesBirthControlPill: makeYesNoEntry(1, "Prenez-vous la pilule ?", "Repondre Oui si la pilule contraceptive est prise actuellement de facon reguliere."),
  consultationObjective: makeEntry(1, "Quel est votre objectif en venant en consultation de tabacologie ?", [
    { value: "STOP_COMPLETELY", label: "Arreter completement" },
    { value: "REDUCE", label: "Reduire la consommation" },
    { value: "INFO", label: "Obtenir des renseignements" },
    { value: "MAINTAIN_QUIT", label: "Maintenir l'arret" }
  ], "L'IA doit distinguer l'objectif principal du patient aujourd'hui, pas un objectif secondaire."),
  professionalStatus: makeEntry(1, "Quelle est votre situation professionnelle actuelle ?", [
    { value: "ACTIVE", label: "Actif" },
    { value: "UNEMPLOYED_RSA", label: "Au chomage / RSA" },
    { value: "STUDENT", label: "Etudiant / formation" },
    { value: "RETIRED", label: "Retraite" },
    { value: "HOMEMAKER", label: "Homme ou femme au foyer" },
    { value: "DISABILITY", label: "Invalidite / AAH" }
  ], "L'IA doit choisir la situation dominante actuelle."),
  smokesAtHome: makeYesNoEntry(1, "Fumez-vous a l'interieur de votre habitation ?", "Repondre Oui si cela arrive reellement a l'interieur du domicile, meme pas tous les jours."),
  otherSmokersAtHome: makeYesNoEntry(1, "Y a-t-il d'autres fumeurs dans votre foyer ?", "Repondre Oui si au moins une autre personne du foyer fume actuellement."),
  educationLevel: makeEntry(1, "Quel est votre niveau d'etudes ?", [
    { value: "NO_DIPLOMA", label: "Sans diplome" },
    { value: "SECONDARY", label: "Niveau secondaire" },
    { value: "CAP_BEP", label: "CAP / BEP" },
    { value: "BAC", label: "Baccalaureat" },
    { value: "BAC_PLUS_2", label: "Bac +2" },
    { value: "ABOVE_BAC_PLUS_2", label: "Au-dela de Bac +2" }
  ], "L'IA doit aider le patient a choisir le niveau le plus proche de son diplome le plus eleve."),
  referralSource: makeEntry(1, "Qui vous a conseille de venir a cette consultation ?", [
    { value: "HOSPITALIZATION", label: "Hospitalisation" },
    { value: "ENTOURAGE", label: "Entourage" },
    { value: "GP", label: "Medecin traitant" },
    { value: "SPECIALIST", label: "Medecin specialiste" },
    { value: "OCCUPATIONAL_DOCTOR", label: "Medecin du travail" },
    { value: "PHARMACIST", label: "Pharmacien" },
    { value: "TABAC_INFO_SERVICE", label: "Tabac Info Service" },
    { value: "PERSONAL_DECISION", label: "Demarche personnelle" }
  ], "L'IA doit identifier la source principale qui a motive la venue."),
  city: makeTextEntry(1, "Ville", "Attendre la ville de residence actuelle du patient."),
  countryCode: makeTextEntry(1, "Pays", "Attendre le pays de residence actuelle du patient."),
  occupation: makeTextEntry(1, "Profession", "Attendre l'intitule simple de la profession ou de l'activite principale."),
  cigarettesPerDay: makeNumericEntry(1, "Combien de cigarettes fumez-vous par jour ?", "L'IA doit aider a retrouver une moyenne quotidienne actuelle, pas le pire jour exceptionnel."),
  smokingStartAge: makeNumericEntry(1, "A quel age avez-vous commence a fumer quotidiennement ?", "Attendre l'age ou le tabac est devenu quotidien, pas juste la premiere cigarette essayee."),
  medicalHistoryNotes: makeTextEntry(1, "Notes medicales personnelles", "Question libre pour ajouter un contexte clinique personnel utile au dossier."),

  riskHypertension: makeYesNoEntry(2, "Avez-vous de l'hypertension arterielle ?", "Repondre Oui si ce facteur de risque a deja ete diagnostique ou traite."),
  riskDiabetes: makeYesNoEntry(2, "Avez-vous du diabete ?", "Repondre Oui si le patient est ou a ete suivi pour diabete."),
  riskHypercholesterolemia: makeYesNoEntry(2, "Avez-vous un exces de cholesterol ?", "Repondre Oui si un taux eleve de cholesterol a deja ete signale ou traite."),
  cardiovascularMyocardialInfarction: makeYesNoEntry(2, "Avez-vous eu un infarctus du myocarde ?", "Repondre Oui si l'episode a deja eu lieu."),
  cardiovascularAngina: makeYesNoEntry(2, "Avez-vous eu une angine de poitrine (angor) ?", "Repondre Oui si un diagnostic d'angor a deja ete pose."),
  cardiovascularStroke: makeYesNoEntry(2, "Avez-vous eu un accident vasculaire cerebral ?", "Repondre Oui si un AVC a deja ete diagnostique."),
  cardiovascularPeripheralArteryDisease: makeYesNoEntry(2, "Avez-vous une arteriopathie des membres inferieurs ?", "Repondre Oui si l'arterite ou une maladie arterielle peripherique a deja ete diagnostiquee."),
  respiratoryChronicBronchitis: makeYesNoEntry(2, "Avez-vous une bronchite chronique ?", "Repondre Oui si un professionnel de sante a deja parle de bronchite chronique."),
  respiratoryCopd: makeYesNoEntry(2, "Avez-vous une BPCO ?", "Repondre Oui uniquement si la BPCO a deja ete diagnostiquee."),
  respiratoryAsthma: makeYesNoEntry(2, "Avez-vous de l'asthme ?", "Repondre Oui si l'asthme est actuel ou deja connu medicalement."),
  cancerLung: makeYesNoEntry(2, "Avez-vous eu un cancer du poumon ?", "Repondre Oui si un cancer du poumon a deja ete diagnostique."),
  cancerThroat: makeYesNoEntry(2, "Avez-vous eu un cancer de la gorge (ORL) ?", "Repondre Oui si un cancer ORL a deja ete diagnostique."),
  cancerBladder: makeYesNoEntry(2, "Avez-vous eu un cancer de la vessie ?", "Repondre Oui si ce cancer a deja ete diagnostique."),
  cancerOther: makeYesNoEntry(2, "Avez-vous eu un autre cancer ?", "Repondre Oui uniquement s'il existe un autre cancer confirme a preciser."),
  medicationTranquilizers: makeYesNoEntry(2, "Prenez-vous regulierement des tranquillisants ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationSleepingPills: makeYesNoEntry(2, "Prenez-vous regulierement des somniferes ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationAntidepressants: makeYesNoEntry(2, "Prenez-vous regulierement des antidepresseurs ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationNeuroleptics: makeYesNoEntry(2, "Prenez-vous regulierement des neuroleptiques ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationMoodRegulators: makeYesNoEntry(2, "Prenez-vous regulierement des regulateurs de l'humeur ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationSubstitutionTreatment: makeYesNoEntry(2, "Prenez-vous un traitement de substitution (Subutex / Methadone) ?", "Repondre Oui si le traitement est pris actuellement."),
  depressionHistory: makeYesNoEntry(2, "Avez-vous deja ete soigne pour une depression avec arret d'activite ?", "Repondre Oui si un tel episode depressif a deja existe."),
  cardiovascularMyocardialInfarction: makeYesNoEntry(2, "Avez-vous eu un infarctus du myocarde ?", "Repondre Oui si l'episode a deja eu lieu dans la vie du patient."),
  cardiovascularAngina: makeYesNoEntry(2, "Avez-vous eu une angine de poitrine ?", "Repondre Oui si le diagnostic d'angor a deja ete pose."),
  cardiovascularStroke: makeYesNoEntry(2, "Avez-vous eu un accident vasculaire cerebral ?", "Repondre Oui si le patient a deja eu un AVC."),
  cardiovascularPeripheralArteryDisease: makeYesNoEntry(2, "Avez-vous une arteriopathie des membres inferieurs ?", "Repondre Oui si l'arterite ou une maladie arterielle peripherique a deja ete diagnostiquee."),
  respiratoryChronicBronchitis: makeYesNoEntry(2, "Avez-vous une bronchite chronique ?", "Repondre Oui si un professionnel de sante a deja parle de bronchite chronique ou d'une toux matinale chronique durable."),
  respiratoryCopd: makeYesNoEntry(2, "Avez-vous une BPCO ?", "Repondre Oui uniquement si la bronchopneumopathie chronique obstructive a deja ete diagnostiquee."),
  respiratoryAsthma: makeYesNoEntry(2, "Avez-vous de l'asthme ?", "Repondre Oui si l'asthme est actuel ou deja connu medicalement."),
  cancerLung: makeYesNoEntry(2, "Avez-vous eu un cancer du poumon ?", "Repondre Oui si un cancer du poumon a deja ete diagnostique."),
  cancerThroat: makeYesNoEntry(2, "Avez-vous eu un cancer de la gorge ORL ?", "Repondre Oui si un cancer ORL a deja ete diagnostique."),
  cancerBladder: makeYesNoEntry(2, "Avez-vous eu un cancer de la vessie ?", "Repondre Oui si ce cancer a deja ete diagnostique."),
  cancerOther: makeYesNoEntry(2, "Avez-vous eu un autre cancer ?", "Repondre Oui uniquement s'il existe un autre cancer confirme a preciser juste apres."),
  cancerOtherDetails: makeTextEntry(2, "Precisez l'autre cancer", "Nommer clairement l'autre cancer si la case precedente est Oui."),
  medicationTranquilizers: makeYesNoEntry(2, "Prenez-vous regulierement des tranquillisants ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationSleepingPills: makeYesNoEntry(2, "Prenez-vous regulierement des somniferes ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationAntidepressants: makeYesNoEntry(2, "Prenez-vous regulierement des antidepresseurs ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationNeuroleptics: makeYesNoEntry(2, "Prenez-vous regulierement des neuroleptiques ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationMoodRegulators: makeYesNoEntry(2, "Prenez-vous regulierement des regulateurs de l'humeur ?", "Repondre Oui si la prise est actuelle et assez reguliere."),
  medicationSubstitutionTreatment: makeYesNoEntry(2, "Prenez-vous un traitement de substitution type Subutex ou methadone ?", "Repondre Oui si le traitement est pris actuellement de facon reguliere."),
  depressionHistory: makeYesNoEntry(2, "Avez-vous deja ete soigne pour une depression avec arret partiel ou total d'activite ?", "Repondre Oui si un tel episode depressif a deja existe, meme dans le passe."),
  otherHealthIssues: makeTextEntry(2, "Autres problemes de sante a signaler", "L'IA aide a formuler un resume court si le patient veut ajouter un autre probleme de sante important."),

  reducedConsumptionLastMonth: makeYesNoEntry(3, "Avez-vous reduit votre consommation au cours du mois precedent ?", "Repondre Oui si une vraie reduction a ete mise en place avant cette consultation."),
  currentlySmoking: makeYesNoEntry(3, "Fumez-vous encore actuellement ?", "Repondre Non seulement si aucun tabac n'est fume actuellement."),
  quitDays: makeNumericEntry(3, "Depuis combien de jours avez-vous arrete ?", "Utiliser ce champ si l'arret est recent et s'exprime en jours."),
  quitMonths: makeNumericEntry(3, "Depuis combien de mois avez-vous arrete ?", "Utiliser ce champ si l'arret est mieux exprime en mois."),
  cigarettesPerDayBeforeQuit: makeNumericEntry(3, "Combien de cigarettes fumiez-vous par jour avant l'arret ?", "Attendre une moyenne quotidienne avant l'arret."),
  smokesDaily: makeYesNoEntry(3, "Fumez-vous tous les jours ?", "Repondre Oui si le tabac est consomme quotidiennement."),
  manufacturedCigarettesPerDay: makeNumericEntry(3, "Combien de cigarettes manufacturees par jour ?", "Moyenne quotidienne actuelle des cigarettes achetees en paquet."),
  rolledCigarettesPerDay: makeNumericEntry(3, "Combien de cigarettes roulees par jour ?", "Moyenne quotidienne actuelle des cigarettes roulees."),
  cigarillosPerDay: makeNumericEntry(3, "Combien de cigarillos par jour ?", "Moyenne quotidienne actuelle des cigarillos. Le dossier rappelle qu'un cigarillo equivaut environ a deux cigarettes."),
  usesCigar: makeYesNoEntry(3, "Consommez-vous des cigares ?", "Repondre Oui si le produit est utilise actuellement, meme occasionnellement."),
  usesPipe: makeYesNoEntry(3, "Consommez-vous la pipe ?", "Repondre Oui si ce produit est utilise actuellement."),
  usesChewingTobacco: makeYesNoEntry(3, "Consommez-vous du tabac a macher ?", "Repondre Oui si ce produit est utilise actuellement."),
  usesSnus: makeYesNoEntry(3, "Consommez-vous du snus ?", "Repondre Oui si ce produit est utilise actuellement."),
  usesHookah: makeYesNoEntry(3, "Consommez-vous le narguile ou la chicha ?", "Repondre Oui si ce produit est utilise actuellement."),
  usesPloom: makeYesNoEntry(3, "Consommez-vous du Ploom ?", "Repondre Oui si ce produit est utilise actuellement."),
  otherTobaccoDetails: makeTextEntry(3, "Autres produits du tabac", "L'IA aide a decrire un autre produit tabagique non liste si necessaire."),
  usesECigarette: makeYesNoEntry(3, "Utilisez-vous une cigarette electronique ?", "Repondre Oui si le vapotage est actuel."),
  ecigWeeklyLiquid: makeNumericEntry(3, "Quel volume de liquide vapotez-vous par semaine ?", "Attendre un volume hebdomadaire de e-liquide si le patient vapote."),
  usesNicotineCartridges: makeYesNoEntry(3, "Utilisez-vous parfois des cartouches de nicotine ?", "Repondre Oui si des cartouches ou pods nicotines sont utilises au moins parfois."),
  nicotineCartridgeDosage: makeTextEntry(3, "Quel dosage de nicotine utilisez-vous ?", "Attendre un dosage ou un taux de nicotine, par exemple en mg ou mg/ml selon ce que le patient connait."),

  motivationStage: makeEntry(4, "Parmi ces phrases, laquelle vous decrit le mieux aujourd'hui ?", [
    { value: "1", label: "Je ne veux pas arreter de fumer" },
    { value: "2", label: "Je pense que je devrais arreter mais je ne le souhaite pas vraiment" },
    { value: "3", label: "Je veux arreter mais je n'ai pas reflechi au moment" },
    { value: "4", label: "Je veux reellement arreter mais je ne sais pas quand" },
    { value: "5", label: "Je veux arreter et je souhaite le faire bientot" },
    { value: "6", label: "Je veux arreter au cours du trimestre a venir" },
    { value: "7", label: "Je veux arreter dans le mois qui vient" }
  ], "L'IA doit distinguer le niveau reel de motivation et surtout l'horizon temporel du projet d'arret."),
  motivationScore: makeEntry(4, "Motivation sur 10", scoreChoices, "0 signifie aucune motivation, 10 signifie motivation maximale. L'IA aide le patient a se positionner honnetement."),
  confidenceScore: makeEntry(4, "Confiance sur 10", scoreChoices, "0 signifie aucune confiance, 10 signifie totale confiance pour reussir l'arret."),
  smokingReasonAutomatic: makeEntry(4, "Je fume parce que c'est un geste automatique", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonConviviality: makeEntry(4, "Je fume par convivialite", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonPleasure: makeEntry(4, "Je fume pour le plaisir", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonStress: makeEntry(4, "Je fume pour combattre le stress", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonConcentration: makeEntry(4, "Je fume pour mieux me concentrer", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonSupportMoral: makeEntry(4, "Je fume pour soutenir mon moral", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  smokingReasonWeight: makeEntry(4, "Je fume pour ne pas grossir", scoreChoices, "0 signifie jamais, 10 signifie toujours."),
  quitReasons: makeTextEntry(4, "Pourquoi voulez-vous arreter de fumer ?", "L'IA doit aider le patient a verbaliser sa motivation principale avec ses propres mots."),
  quitFears: makeTextEntry(4, "Que craignez-vous en arretant de fumer ?", "L'IA doit aider le patient a verbaliser ses peurs de rechute, stress, poids ou manque."),
  weightConcernScore: makeEntry(4, "Crainte de prendre du poids sur 10", scoreChoices, "0 signifie pas du tout, 10 signifie extremement."),
  weightConfidenceScore: makeEntry(4, "Confiance a ne pas prendre du poids sur 10", scoreChoices, "0 signifie aucune confiance, 10 signifie totale confiance."),
  physicalActivityLevel: makeEntry(4, "Activite physique habituelle", [
    { value: "NONE", label: "Aucune" },
    { value: "LESS_THAN_30_MIN", label: "Moins de 30 min" },
    { value: "ONE_TO_TWO_HOURS", label: "1 a 2 heures" },
    { value: "TWO_TO_FOUR_HOURS", label: "2 a 4 heures" },
    { value: "MORE_THAN_FOUR_HOURS", label: "Plus de 4 heures" }
  ], "L'IA doit aider le patient a choisir son niveau d'activite physique recent le plus representatif."),
  triggers: makeTextEntry(4, "Declencheurs principaux", "L'IA aide a identifier les situations qui poussent a fumer: stress, cafe, pause, voiture, soiree, solitude, etc."),

  alcoholFrequency: makeEntry(5, "Combien de fois vous arrive-t-il de consommer de l'alcool ?", [
    { value: "0", label: "Jamais" },
    { value: "1", label: "1 fois / mois" },
    { value: "2", label: "2 a 4 fois / mois" },
    { value: "3", label: "2 a 3 fois / semaine" },
    { value: "4", label: "4 fois ou plus / semaine" }
  ], "Tres important: cette question porte sur l'annee ecoulee, pas uniquement sur la derniere semaine."),
  alcoholQuantity: makeEntry(5, "Combien de verres standard buvez-vous au cours d'une journee ordinaire ?", [
    { value: "0", label: "1 ou 2" },
    { value: "1", label: "3 ou 4" },
    { value: "2", label: "5 ou 6" },
    { value: "3", label: "7 a 9" },
    { value: "4", label: "10 ou plus" }
  ], "Penser au nombre habituel de verres lors d'une journee ou de l'alcool est consomme."),
  alcoholBinge: makeEntry(5, "Au cours d'une meme occasion, combien de fois vous arrive-t-il de boire 6 verres ou plus ?", [
    { value: "0", label: "Jamais" },
    { value: "1", label: "Moins d'1 fois / mois" },
    { value: "2", label: "1 fois / mois" },
    { value: "3", label: "1 fois / semaine" },
    { value: "4", label: "Chaque jour ou presque" }
  ], "L'IA doit aider le patient a raisonner sur sa frequence habituelle de consommation importante."),
  cageCutDown: makeYesNoEntry(5, "Avez-vous deja ressenti le besoin de diminuer l'alcool ?", "Repondre Oui si cette idee s'est deja imposee reellement au patient."),
  cageAnnoyed: makeYesNoEntry(5, "L'entourage vous a-t-il deja fait des remarques sur votre alcool ?", "Repondre Oui si le patient a deja ete critique ou interpelle sur sa consommation."),
  cageGuilty: makeYesNoEntry(5, "Avez-vous deja eu l'impression de boire trop ?", "Repondre Oui si le patient s'est deja senti coupable ou inquiet de sa consommation."),
  cageEyeOpener: makeYesNoEntry(5, "Avez-vous deja eu besoin d'alcool le matin ?", "Repondre Oui si cela est deja arrive, meme si ce n'est pas quotidien."),
  cannabisLast12Months: makeYesNoEntry(5, "Avez-vous consomme du cannabis au cours des 12 derniers mois ?", "Repondre Oui si une consommation a existe au moins une fois dans les 12 derniers mois."),
  cannabisFrequency: makeEntry(5, "Combien de fois avez-vous consomme du cannabis au cours des 30 derniers jours ?", [
    { value: "NONE", label: "Aucune" },
    { value: "LESS_THAN_3", label: "1 a 2 fois" },
    { value: "THREE_TO_5", label: "3 a 5 fois" },
    { value: "SIX_TO_9", label: "6 a 9 fois" },
    { value: "TEN_TO_19", label: "10 a 19 fois" },
    { value: "TWENTY_TO_29", label: "20 a 29 fois" },
    { value: "DAILY", label: "Tous les jours" }
  ], "L'IA doit aider a choisir la frequence la plus proche sur les 30 derniers jours."),
  cannabisStartAge: makeNumericEntry(5, "A quel age avez-vous commence le cannabis ?", "Attendre l'age de debut de consommation, pas l'age de consommation quotidienne."),
  weeklyTobaccoSpend: makeNumericEntry(5, "Quelle somme consacrez-vous au tabac chaque semaine ?", "Attendre une depense hebdomadaire approximative mais credible, dans la devise locale du patient."),
  incomeBracket: makeEntry(5, "Dans quelle tranche se situent vos revenus mensuels nets ?", [
    { value: "BELOW_1000", label: "Moins de 1000" },
    { value: "FROM_1001_TO_2000", label: "1001 a 2000" },
    { value: "FROM_2001_TO_3000", label: "2001 a 3000" },
    { value: "FROM_3001_TO_4000", label: "3001 a 4000" },
    { value: "ABOVE_4000", label: "Plus de 4000" }
  ], "L'IA doit aider le patient a choisir la tranche de revenus mensuels la plus proche."),
  epicesQ49: makeYesNoEntry(5, "Rencontrez-vous parfois un travailleur social ?", "Question sociale EPICES. Repondre Oui si cela arrive reellement."),
  epicesQ50: makeYesNoEntry(5, "Beneficiez-vous d'une assurance maladie complementaire ?", "Repondre Oui si le patient dispose actuellement d'une complementaire sante."),
  epicesQ51: makeYesNoEntry(5, "Vivez-vous en couple ?", "Repondre Oui si le patient vit actuellement en couple."),
  epicesQ52: makeYesNoEntry(5, "Etes-vous proprietaire de votre logement ?", "Repondre Oui si le logement principal appartient au patient ou au couple."),
  epicesQ53: makeYesNoEntry(5, "Avez-vous des difficultes financieres dans le mois ?", "Repondre Oui s'il existe des moments du mois ou les besoins essentiels deviennent difficiles a couvrir."),
  epicesQ54: makeYesNoEntry(5, "Avez-vous fait du sport au cours des 12 derniers mois ?", "Repondre Oui si une pratique sportive a eu lieu au moins une fois dans les 12 derniers mois."),
  epicesQ55: makeYesNoEntry(5, "Etes-vous alle au spectacle au cours des 12 derniers mois ?", "Repondre Oui si le patient est alle au cinema, theatre, concert ou equivalent au moins une fois."),
  epicesQ56: makeYesNoEntry(5, "Etes-vous parti en vacances au cours des 12 derniers mois ?", "Repondre Oui si le patient a quitte son domicile pour des vacances au moins une fois."),
  epicesQ57: makeYesNoEntry(5, "Avez-vous eu des contacts familiaux dans les 6 derniers mois ?", "Repondre Oui s'il y a eu de vrais contacts avec la famille elargie autres que parents ou enfants proches."),
  epicesQ58: makeYesNoEntry(5, "Quelqu'un pourrait-il vous heberger quelques jours en cas de difficulte ?", "Repondre Oui si une personne de confiance pourrait reellement le faire."),
  epicesQ59: makeYesNoEntry(5, "Quelqu'un pourrait-il vous apporter une aide materielle en cas de difficulte ?", "Repondre Oui si une personne de confiance pourrait reellement aider financierement ou materiellement."),
  honcQ1: makeYesNoEntry(5, "Est-il difficile d'arreter de fumer ?", "Question HONC. Repondre Oui si l'arret ou la reduction est difficile a controler."),
  honcQ2: makeYesNoEntry(5, "Fumez-vous parce que vous vous sentez dependant ?", "Repondre Oui si le patient sent une dependance plus qu'un simple choix occasionnel."),
  honcQ3: makeYesNoEntry(5, "Avez-vous des envies imperieuses de fumer ?", "Repondre Oui si des cravings forts existent reellement."),
  honcQ4: makeYesNoEntry(5, "Avez-vous un besoin urgent d'une cigarette ?", "Repondre Oui si cette urgence est ressentie reellement."),
  honcQ5: makeYesNoEntry(5, "Avez-vous du mal a ne pas fumer aux endroits interdits ?", "Repondre Oui si le controle est difficile meme dans des lieux interdits."),
  honcQ6: makeYesNoEntry(5, "Avez-vous du mal a vous concentrer sans fumer ?", "Repondre Oui si le manque de tabac perturbe la concentration."),
  honcQ7: makeYesNoEntry(5, "Etes-vous irritable si vous ne fumez pas ?", "Repondre Oui si le sevrage rend le patient irritable."),
  honcQ8: makeYesNoEntry(5, "Etes-vous nerveux ou anxieux sans fumer ?", "Repondre Oui si l'absence de tabac augmente l'anxiete ou la nervosite."),
  honcQ9: makeYesNoEntry(5, "Etes-vous triste ou deprime sans fumer ?", "Repondre Oui si le sevrage s'accompagne de tristesse ou d'humeur deprimee."),
  honcQ10: makeYesNoEntry(5, "Avez-vous un besoin urgent ou un debut de panique si vous ne fumez pas ?", "Repondre Oui si le manque provoque une sensation de panique ou d'urgence forte."),
  notes: makeTextEntry(5, "Notes complementaires", "L'IA peut aider le patient a resumer des elements sociaux ou addictologiques importants en quelques phrases simples.")
};

export const getQuestionAssistantMeta = (fieldName, phaseId = null) => {
  if (!fieldName) return null;
  const direct = QUESTION_ASSISTANT_CATALOG[fieldName];
  if (direct) {
    return { questionId: fieldName, ...direct };
  }

  const humanized = fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

  return {
    questionId: fieldName,
    phaseId,
    questionLabel: humanized,
    officialChoices: [],
    questionContext:
      "L'assistant doit reformuler cette question de facon pedagogique, interroger le patient comme un clinicien et ne jamais choisir a sa place."
  };
};

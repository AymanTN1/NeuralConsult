from __future__ import annotations

from app.services.knowledge_base import StaticKnowledgeBaseClient, make_references


QUESTION_ASSISTANT_REFERENCES = make_references(
    [
        (
            "NeuralConsult/Question-RAG",
            "Clarification clinique des questions initiales",
            "Reformuler la question avec un langage simple, distinguer fait medical confirme, suspicion du patient et contexte social, puis revenir vers les choix officiels du formulaire.",
            ["question", "evaluation", "clarification", "choix officiels"],
        ),
        (
            "NeuralConsult/Question-RAG",
            "Regle de suggestion prudente",
            "Ne proposer une reponse officielle que si le message du patient contient assez d'indices coherents. Sinon, garder la suggestion vide et poursuivre l'entretien avec 2 a 4 questions courtes.",
            ["suggestion", "prudence", "confirmation patient"],
        ),
        (
            "NeuralConsult/Question-RAG",
            "Nuance sur les antecedents medicaux",
            "Pour une question Oui/Non medicale, separer un diagnostic etabli par un medecin, un traitement deja prescrit, et une simple impression du patient.",
            ["antecedents", "oui non", "diagnostic"],
        ),
    ]
)

SUPPORT_CHAT_REFERENCES = make_references(
    [
        (
            "NeuralConsult/Psy-RAG",
            "Support 24/7 tabacologie",
            "Le soutien doit rester bref, humain et concret: accueillir l'emotion, nommer le besoin principal, proposer un micro-pas immediat et limiter a une seule question de suivi.",
            ["psychologue", "24 7", "empathie", "micro pas"],
        ),
        (
            "NeuralConsult/Psy-RAG",
            "Craving et regulation emotionnelle",
            "En cas d'envie de fumer, prioriser respiration guidee, eloignement du declencheur, hydratation, rappel du motif d'arret et activation d'un soutien humain si necessaire.",
            ["craving", "stress", "rechute", "regulation"],
        ),
        (
            "NeuralConsult/Psy-RAG",
            "Escalade vers le medecin",
            "Si l'echange fait apparaitre danger, detresse severe, panique, idee suicidaire ou rechute imminente, activer should_alert_doctor et resumer la raison de facon medicale.",
            ["alerte", "urgent", "danger", "medecin"],
        ),
    ]
)

CLINICAL_NOTES_REFERENCES = make_references(
    [
        (
            "NeuralConsult/Notes-RAG",
            "Structure de note medicale de sevrage",
            "Toujours organiser la note autour de l'identite, du contexte tabagique, des scores, des risques medicaux, du contexte social et des informations manquantes.",
            ["note medicale", "synthese", "structure"],
        ),
        (
            "NeuralConsult/Notes-RAG",
            "Zero hallucination",
            "Une note clinique automatisee doit expliciter les donnees absentes au lieu de les supposer. Les champs manquants doivent etre listes clairement pour le medecin.",
            ["zero hallucination", "donnees manquantes", "medecin"],
        ),
        (
            "NeuralConsult/Notes-RAG",
            "Interpretation sobre des scores",
            "Les scores HAD et Fagerstrom doivent etre presentes comme des reperes d'aide a la decision, sans conclure a eux seuls a un diagnostic.",
            ["had", "fagerstrom", "interpretation"],
        ),
    ]
)

CLINICAL_INTELLIGENCE_REFERENCES = make_references(
    [
        (
            "NeuralConsult/Clinical-Intel-RAG",
            "Lecture transversale du dossier tabacologie",
            "La synthese globale doit croiser evaluation initiale, scores psychologiques, niveau de dependance, vulnerabilites sociales et journal quotidien pour faire ressortir les priorites cliniques.",
            ["resume global", "phase", "journal", "tests"],
        ),
        (
            "NeuralConsult/Clinical-Intel-RAG",
            "Plans candidats de sevrage",
            "Les plans IA doivent rester des pistes: un plan intensif si dependance ou fragilite elevee, un plan equilibre si le patient peut s'engager avec suivi regulier, un plan long terme si l'adherence progressive domine.",
            ["plan intensive", "balanced", "long term"],
        ),
        (
            "NeuralConsult/Clinical-Intel-RAG",
            "Resumes de phase medicaux",
            "Chaque phase doit livrer 2 a 3 lignes utiles au patient et au medecin: ce qui est etabli, ce qui fragilise le sevrage et ce qui reste a confirmer.",
            ["resume de phase", "medecin", "patient"],
        ),
    ]
)


class QuestionAssistantKnowledgeBaseClient(StaticKnowledgeBaseClient):
    def __init__(self) -> None:
        super().__init__(domain_name="question-assistant", references=QUESTION_ASSISTANT_REFERENCES)


class SupportChatKnowledgeBaseClient(StaticKnowledgeBaseClient):
    def __init__(self) -> None:
        super().__init__(domain_name="support-chat", references=SUPPORT_CHAT_REFERENCES)


class ClinicalNotesKnowledgeBaseClient(StaticKnowledgeBaseClient):
    def __init__(self) -> None:
        super().__init__(domain_name="clinical-notes", references=CLINICAL_NOTES_REFERENCES)


class ClinicalIntelligenceKnowledgeBaseClient(StaticKnowledgeBaseClient):
    def __init__(self) -> None:
        super().__init__(domain_name="clinical-intelligence", references=CLINICAL_INTELLIGENCE_REFERENCES)

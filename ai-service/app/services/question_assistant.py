from __future__ import annotations

import json
import re
import unicodedata
from typing import Any, Dict, List, Optional, Sequence, Tuple

from app.services.domain_knowledge import QuestionAssistantKnowledgeBaseClient
from app.services.knowledge_base import KnowledgeReference
from app.services.llm_client import DefaultLlmClient


YES_ALIASES = [
    "oui",
    "ouais",
    "bien sur",
    "c est le cas",
    "cest le cas",
    "effectivement",
    "actuellement oui",
    "toujours",
    "souvent",
    "tout a fait",
    "exactement",
    "c est vrai",
    "confirme",
    "diagnostique",
    "diagnostiquee",
    "on m a dit",
    "on m a diagnostique",
]

NO_ALIASES = [
    "non",
    "jamais",
    "pas du tout",
    "aucun",
    "aucune",
    "plus maintenant",
    "plus du tout",
    "j ai arrete",
    "je n ai pas",
    "je ne fume pas",
    "je crois pas",
    "je pense pas",
    "pas vraiment",
]

HEDGING_ALIASES = [
    "peut etre",
    "peut-etre",
    "je crois",
    "je pense",
    "je ne sais pas",
    "je ne suis pas sur",
    "pas certain",
    "incertain",
    "suspecte",
    "pas diagnostique",
    "non diagnostique",
]

QUESTION_CHOICE_ALIASES: Dict[str, Dict[str, List[str]]] = {
    "consultationObjective": {
        "STOP_COMPLETELY": ["arreter completement", "arret complet", "stop complet", "arreter totalement"],
        "REDUCE": ["reduire", "diminuer", "baisser ma consommation"],
        "INFO": ["renseignements", "informations", "juste comprendre", "explications"],
        "MAINTAIN_QUIT": ["maintenir l arret", "tenir sans refumer", "eviter la rechute"],
    },
    "professionalStatus": {
        "ACTIVE": ["je travaille", "actif", "salarie", "independant", "en emploi"],
        "UNEMPLOYED_RSA": ["au chomage", "sans emploi", "rsa"],
        "STUDENT": ["etudiant", "formation", "j etudie", "apprenti"],
        "RETIRED": ["retraite"],
        "HOMEMAKER": ["au foyer", "femme au foyer", "homme au foyer"],
        "DISABILITY": ["invalidite", "aah", "handicap", "incapacite"],
    },
    "educationLevel": {
        "NO_DIPLOMA": ["sans diplome", "pas de diplome"],
        "SECONDARY": ["college", "lycee", "niveau secondaire"],
        "CAP_BEP": ["cap", "bep"],
        "BAC": ["bac", "baccalaureat"],
        "BAC_PLUS_2": ["bac plus 2", "dut", "bts", "deug"],
        "ABOVE_BAC_PLUS_2": ["licence", "master", "doctorat", "ingenieur", "bac plus 3", "bac plus 4", "bac plus 5"],
    },
    "referralSource": {
        "HOSPITALIZATION": ["hospitalisation", "hopital", "medecin hospitalier"],
        "ENTOURAGE": ["entourage", "famille", "amis", "proche"],
        "GP": ["medecin traitant", "generaliste"],
        "SPECIALIST": ["specialiste", "pneumologue", "cardiologue"],
        "OCCUPATIONAL_DOCTOR": ["medecin du travail"],
        "PHARMACIST": ["pharmacien", "pharmacie"],
        "TABAC_INFO_SERVICE": ["tabac info service"],
        "PERSONAL_DECISION": ["demarche personnelle", "moi meme", "seul", "personnellement"],
    },
    "sex": {
        "FEMALE": ["femme", "feminin"],
        "MALE": ["homme", "masculin"],
        "OTHER": ["autre", "non binaire"],
    },
    "pregnancyTrimester": {
        "1": ["1er trimestre", "premier trimestre", "1 trimestre", "1 mois", "2 mois", "3 mois"],
        "2": ["2eme trimestre", "deuxieme trimestre", "4 mois", "5 mois", "6 mois"],
        "3": ["3eme trimestre", "troisieme trimestre", "7 mois", "8 mois", "9 mois"],
    },
    "motivationStage": {
        "1": ["je ne veux pas arreter", "pas envie d arreter", "je veux continuer"],
        "2": ["je devrais arreter mais", "je sais que je devrais", "pas vraiment envie"],
        "3": ["je veux arreter mais pas encore quand", "pas reflechi au moment", "pas de date"],
        "4": ["je veux reellement arreter mais je ne sais pas quand", "je ne sais pas encore quand"],
        "5": ["bientot", "prochainement", "dans pas longtemps"],
        "6": ["dans le trimestre", "dans quelques mois", "dans 2 ou 3 mois"],
        "7": ["dans le mois", "ce mois ci", "dans les prochaines semaines"],
    },
    "physicalActivityLevel": {
        "NONE": ["aucune", "pas de sport", "jamais"],
        "LESS_THAN_30_MIN": ["moins de 30 minutes", "moins de 30 min"],
        "ONE_TO_TWO_HOURS": ["1 heure", "2 heures", "entre 1 et 2 heures"],
        "TWO_TO_FOUR_HOURS": ["entre 2 et 4 heures", "3 heures", "4 heures"],
        "MORE_THAN_FOUR_HOURS": ["plus de 4 heures", "5 heures", "6 heures", "tous les jours"],
    },
    "incomeBracket": {
        "BELOW_1000": ["moins de 1000", "900", "800", "petit revenu"],
        "FROM_1001_TO_2000": ["1001", "1500", "1800", "2000"],
        "FROM_2001_TO_3000": ["2200", "2500", "2800", "3000"],
        "FROM_3001_TO_4000": ["3200", "3500", "3800", "4000"],
        "ABOVE_4000": ["plus de 4000", "4500", "5000", "6000"],
    },
    "cannabisFrequency": {
        "NONE": ["aucune", "jamais", "0 fois"],
        "LESS_THAN_3": ["1 fois", "2 fois", "une ou deux fois"],
        "THREE_TO_5": ["3 fois", "4 fois", "5 fois", "trois a cinq fois"],
        "SIX_TO_9": ["6 fois", "7 fois", "8 fois", "9 fois"],
        "TEN_TO_19": ["10 fois", "15 fois", "dix a dix neuf fois"],
        "TWENTY_TO_29": ["20 fois", "25 fois", "vingt a vingt neuf fois"],
        "DAILY": ["tous les jours", "quotidien", "chaque jour"],
    },
    "alcoholFrequency": {
        "0": ["jamais", "aucune", "je ne bois pas"],
        "1": ["1 fois par mois", "une fois par mois", "mensuel"],
        "2": ["2 fois par mois", "3 fois par mois", "4 fois par mois", "quelques fois par mois"],
        "3": ["2 fois par semaine", "3 fois par semaine", "quelques fois par semaine"],
        "4": ["4 fois par semaine", "presque tous les jours", "chaque jour", "quotidien"],
    },
    "alcoholBinge": {
        "0": ["jamais", "aucune"],
        "1": ["moins d une fois par mois", "rarement"],
        "2": ["1 fois par mois", "une fois par mois"],
        "3": ["1 fois par semaine", "une fois par semaine"],
        "4": ["chaque jour", "presque tous les jours", "quotidien"],
    },
}


FREE_TEXT_QUESTION_IDS = {
    "city",
    "countryCode",
    "occupation",
    "medicalHistoryNotes",
    "otherHealthIssues",
    "otherTobaccoDetails",
    "nicotineCartridgeDosage",
    "quitReasons",
    "quitFears",
    "triggers",
    "notes",
    "cancerOtherDetails",
}


def _safe_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_text(value: Any) -> str:
    text = _safe_text(value).lower()
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _latest_user_message(payload: Dict[str, Any]) -> str:
    direct_message = _safe_text(payload.get("patient_message"))
    if direct_message:
        return direct_message

    for item in reversed(payload.get("conversation_history") or []):
        if _safe_text(item.get("role")) == "user":
            return _safe_text(item.get("content"))
    return ""


def _all_user_messages(payload: Dict[str, Any]) -> List[str]:
    messages: List[str] = []
    for item in payload.get("conversation_history") or []:
        if _safe_text(item.get("role")) == "user":
            content = _safe_text(item.get("content"))
            if content:
                messages.append(content)
    direct_message = _safe_text(payload.get("patient_message"))
    if direct_message:
        messages.append(direct_message)
    return messages


def _combined_user_messages(payload: Dict[str, Any]) -> str:
    return " ".join(_all_user_messages(payload)).strip()


def _choices(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    return list(payload.get("official_choices") or [])


def _question_id(payload: Dict[str, Any]) -> str:
    return _safe_text(payload.get("question_id"))


def _question_label(payload: Dict[str, Any]) -> str:
    return _safe_text(payload.get("question_label")) or "cette question"


def _question_context(payload: Dict[str, Any]) -> str:
    return _safe_text(payload.get("question_context"))

def _is_free_text_question(question_id: str, choices: Sequence[Dict[str, Any]]) -> bool:
    if question_id in FREE_TEXT_QUESTION_IDS:
        return True
    return len(choices) == 0


def _is_yes_no_choice_set(choices: Sequence[Dict[str, Any]]) -> bool:
    values = {_safe_text(choice.get("value")) for choice in choices}
    return values == {"true", "false"}


def _is_score_choice_set(choices: Sequence[Dict[str, Any]]) -> bool:
    values = [_safe_text(choice.get("value")) for choice in choices]
    return bool(values) and all(value.isdigit() for value in values)


def _contains_any(text: str, patterns: Sequence[str]) -> bool:
    return any(pattern in text for pattern in patterns)


def _extract_integer(text: str) -> Optional[int]:
    match = re.search(r"\b(\d{1,4})\b", text)
    return int(match.group(1)) if match else None


def _choice_label_lookup(choices: Sequence[Dict[str, Any]]) -> Dict[str, str]:
    return {_safe_text(choice.get("value")): _safe_text(choice.get("label")) for choice in choices}


def _format_conversation_for_prompt(payload: Dict[str, Any]) -> str:
    lines: List[str] = []
    for item in payload.get("conversation_history") or []:
        role = _safe_text(item.get("role")) or "assistant"
        content = _safe_text(item.get("content"))
        if content:
            speaker = "Patient" if role == "user" else "Assistant"
            lines.append(f"{speaker}: {content}")

    direct_message = _safe_text(payload.get("patient_message"))
    if direct_message:
        lines.append(f"Patient: {direct_message}")

    return "\n".join(lines) if lines else "Aucun echange precedent. C'est le premier tour du dialogue."


def _format_choices_for_prompt(choices: Sequence[Dict[str, Any]]) -> str:
    if not choices:
        return "Aucun choix officiel ferme. La question attend une reponse libre ou factuelle."
    lines = []
    for index, choice in enumerate(choices, start=1):
        lines.append(
            f"{index}. value={_safe_text(choice.get('value'))} | label={_safe_text(choice.get('label'))}"
        )
    return "\n".join(lines)


def _format_patient_facts_for_prompt(payload: Dict[str, Any]) -> str:
    facts = payload.get("patient_facts") or {}
    if not facts:
        return "Aucun fait patient supplementaire disponible."
    return json.dumps(facts, ensure_ascii=False, indent=2)


def _format_references_for_prompt(references: Sequence[KnowledgeReference]) -> str:
    if not references:
        return "Aucune reference RAG externe disponible."
    return "\n".join(
        f"- {reference.title} ({reference.source}) : {reference.excerpt}"
        for reference in references
    )


def _question_mode(payload: Dict[str, Any], choices: Sequence[Dict[str, Any]]) -> str:
    question_id = _question_id(payload)
    if _is_free_text_question(question_id, choices):
        return "free_text"
    if _is_yes_no_choice_set(choices):
        return "yes_no"
    if _is_score_choice_set(choices):
        return "score"
    return "closed_choice"


class QuestionAssistantService:
    """
    Clinical conversational assistant for form filling.

    Invariants:
    - The AI helps the patient understand the question.
    - The AI can interview the patient with targeted follow-up questions.
    - The AI may suggest the closest official answer only when evidence is sufficient.
    - The patient always confirms the final answer.
    """

    def __init__(self) -> None:
        self.kb = QuestionAssistantKnowledgeBaseClient()
        self.llm = DefaultLlmClient()

    async def assist(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        references = self.kb.retrieve(
            query=_safe_text(payload.get("question_label")) or _latest_user_message(payload),
            facts=payload,
        )

        if self.llm.is_configured():
            try:
                result = await self._assist_with_llm(payload, references)
                result["engine"] = self.llm.provider
                return self._validate_result(result, payload, references)
            except Exception as exc:
                fallback = self._fallback(payload)
                fallback["engine"] = "fallback"
                fallback["engine_warning"] = self._humanize_llm_error(str(exc), self.llm.provider)
                return self._validate_result(fallback, payload, references)

        fallback = self._fallback(payload)
        fallback["engine"] = "fallback"
        fallback["engine_warning"] = "Aucun moteur LLM distant n'est configure pour ce service."
        return self._validate_result(fallback, payload, references)

    def _humanize_llm_error(self, error_text: str, provider: str) -> str:
        normalized = _normalize_text(error_text)
        provider_label = "Groq" if provider == "groq" else "Gemini"
        if "429" in error_text and ("quota" in normalized or "resource exhausted" in normalized):
            return (
                f"{provider_label} est bien appele, mais le provider refuse actuellement la requete a cause du quota ou des limites du projet. "
                "Le service a donc bascule sur l'assistant local de secours."
            )
        if "api key" in normalized and "not configured" in normalized:
            return f"{provider_label} n'est pas configure dans l'environnement du service."
        if "invalid json" in normalized:
            return f"{provider_label} a repondu dans un format non exploitable pour cette aide contextuelle."
        return f"{provider_label} est temporairement indisponible, le service utilise donc l'assistant local de secours."

    async def _assist_with_llm(
        self,
        payload: Dict[str, Any],
        references: List[KnowledgeReference],
    ) -> Dict[str, Any]:
        choices = _choices(payload)
        question_mode = _question_mode(payload, choices)
        conversation = _format_conversation_for_prompt(payload)
        last_patient_message = _latest_user_message(payload) or "Aucun message patient encore saisi."

        system_prompt = (
            "Tu es un assistant clinique francophone de tabacologie pour NeuralConsult. "
            "Ton style doit ressembler a un mini entretien medical humain, rassurant, precis et adapte a la derniere reponse du patient. "
            "Tu ne fais pas de simple detection de mots-clefs : tu interpretes le sens, les nuances, l'incertitude, les symptomes decrits et les hesitations. "
            "A chaque tour, tu dois d'abord repondre au dernier message du patient, puis poser 2 a 4 questions breves et intelligentes qui permettent d'approcher la bonne reponse officielle. "
            "Tu dois reutiliser l'historique de la conversation pour ne pas reposer exactement les memes questions ni repeter le meme paragraphe d'un tour a l'autre. "
            "Tu t'appuies uniquement sur la question exacte du dossier, son contexte clinique, les choix officiels, les faits patient et les references RAG fournies. "
            "Tu ne dois jamais inventer de diagnostic, jamais remplir la reponse finale a la place du patient et jamais proposer une valeur hors des choix officiels quand il y en a. "
            "Si les informations restent insuffisantes ou ambiguës, tu laisses suggested_choice_value a null et tu expliques simplement ce qu'il faut encore clarifier. "
            "Pour une question de maladie ou d'antecedent, distingue bien ce qui est medicalement connu, ce qui est seulement suspecte par le patient et ce qui est absent. "
            "Ta sortie doit etre un JSON valide uniquement, sans markdown."
        )

        user_prompt = (
            "Analyse cette aide contextuelle au remplissage d'un dossier medical de sevrage tabagique.\n\n"
            f"Phase: {_safe_text(payload.get('phase_label')) or 'Non precisee'}\n"
            f"Question exacte: {_question_label(payload)}\n"
            f"Question id: {_question_id(payload)}\n"
            f"Type de question: {question_mode}\n"
            f"Contexte clinique: {_question_context(payload) or 'Aucun contexte additionnel fourni.'}\n"
            f"Reponse actuelle du formulaire: {json.dumps(payload.get('current_answer'), ensure_ascii=False)}\n\n"
            "Choix officiels autorises:\n"
            f"{_format_choices_for_prompt(choices)}\n\n"
            "Historique reel de conversation:\n"
            f"{conversation}\n\n"
            f"Dernier message du patient a traiter en priorite: {last_patient_message}\n\n"
            "Faits patient deja connus:\n"
            f"{_format_patient_facts_for_prompt(payload)}\n\n"
            "References RAG utiles:\n"
            f"{_format_references_for_prompt(references)}\n\n"
            "Retourne un objet JSON de cette forme exacte:\n"
            "{\n"
            '  "explanation": "reponse naturelle au dernier message du patient + explication clinique breve de la question",\n'
            '  "clarifying_questions": ["2 a 4 nouvelles questions courtes, precises, non redondantes"],\n'
            '  "suggested_choice_value": "valeur officielle ou null",\n'
            '  "suggested_choice_label": "label officiel ou null",\n'
            '  "suggestion_reason": "pourquoi ce choix semble le plus proche OU pourquoi il faut encore clarifier",\n'
            '  "needs_patient_confirmation": true,\n'
            '  "safety_note": "rappel court que le patient doit confirmer"\n'
            "}\n\n"
            "Contraintes importantes:\n"
            "- Ta reponse doit changer reellement selon le message du patient et l'historique.\n"
            "- Ne repete pas mot pour mot la meme explication si le patient avance de nouvelles informations.\n"
            "- Tu peux poser des questions en dehors des choix, si elles aident a comprendre la bonne option.\n"
            "- Tu dois citer ou rappeler explicitement les choix officiels quand ils existent.\n"
            "- Tes questions de clarification doivent aider a distinguer les choix les uns des autres.\n"
            "- N'ecris pas de diagnostic.\n"
            "- Si la question demande un nombre ou un texte libre, tu aides a le formuler sans inventer la valeur.\n"
            "- Si le patient donne deja une affirmation suffisamment claire, tu peux proposer un choix officiel tout en gardant 1 ou 2 questions de verification maximum.\n"
            "- Pour une question Oui/Non, si le patient parle de symptomes sans diagnostic etabli, tu peux expliquer la nuance et garder suggested_choice_value a null tant que la distinction n'est pas assez claire."
        )

        return await self.llm.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.05,
        )

    def _fallback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        choices = _choices(payload)
        question_id = _question_id(payload)
        suggestion_value, suggestion_label = self._infer_suggestion(payload, choices)
        if _is_free_text_question(question_id, choices) and not suggestion_value:
            draft = _latest_user_message(payload)
            if draft:
                suggestion_value = draft
                suggestion_label = "Proposition de formulation"

        return {
            "explanation": self._build_explanation(payload, choices),
            "clarifying_questions": self._build_clarifying_questions(payload, choices),
            "suggested_choice_value": suggestion_value,
            "suggested_choice_label": suggestion_label,
            "suggestion_reason": self._build_suggestion_reason(payload, suggestion_value, suggestion_label),
            "needs_patient_confirmation": True,
            "safety_note": (
                "Je m'appuie sur la question exacte, les choix officiels et vos messages. "
                "Je peux vous guider, mais c'est vous qui confirmez la reponse finale."
                if choices or question_id in FREE_TEXT_QUESTION_IDS
                else "Je vous aide a clarifier la question, mais vous gardez la decision finale."
            ),
        }

    def _build_explanation(self, payload: Dict[str, Any], choices: Sequence[Dict[str, Any]]) -> str:
        context = _question_context(payload)
        choice_labels = [_safe_text(choice.get("label")) for choice in choices if _safe_text(choice.get("label"))]
        latest_message = _latest_user_message(payload)
        question_id = _question_id(payload)

        if not latest_message:
            if _is_yes_no_choice_set(choices):
                if context:
                    return f"Bonjour. {context} Je vais te poser deux petites questions pour verifier la reponse la plus juste."
                return "Bonjour. Je vais te poser deux petites questions pour verifier si la reponse la plus juste est Oui ou Non."
            if _is_free_text_question(question_id, choices):
                return "Bonjour. Dis-moi avec tes mots ce que tu veux dire, et je t'aiderai a le reformuler proprement."
            if choice_labels:
                return (
                    "Bonjour. Je vais t'aider a trouver l'option la plus proche parmi les choix du dossier, "
                    "avec quelques questions simples."
                )
            return "Bonjour. Je vais t'aider a clarifier cette question avec quelques questions simples."

        if _is_yes_no_choice_set(choices):
            if context:
                return f"D'accord. {context} Pour etre sur de ne pas te tromper, j'ai besoin de verifier un ou deux points."
            return "D'accord. Pour ne pas te proposer la mauvaise reponse, j'ai besoin de verifier un ou deux points."

        if _is_free_text_question(question_id, choices):
            return "D'accord. Dis-m'en un peu plus et je t'aiderai a formuler une reponse claire et fidele a ta situation."

        if choice_labels:
            return "D'accord. Je vais te poser quelques questions tres courtes pour approcher l'option la plus proche."

        return "D'accord. Je vais t'aider a preciser ta reponse pas a pas."

    def _build_clarifying_questions(self, payload: Dict[str, Any], choices: Sequence[Dict[str, Any]]) -> List[str]:
        question_id = _question_id(payload)
        label = _question_label(payload)
        choice_labels = [_safe_text(choice.get("label")) for choice in choices if _safe_text(choice.get("label"))]

        targeted_questions: Dict[str, List[str]] = {
            "consultationObjective": [
                "Aujourd'hui, cherchez-vous surtout a arreter completement, a reduire, a obtenir des informations, ou a tenir apres un arret deja commence ?",
                "Si je devais ne garder qu'un seul objectif principal pour cette consultation, lequel serait le plus exact ?",
            ],
            "motivationStage": [
                "Si vous pensez a l'arret du tabac aujourd'hui, avez-vous deja decide quand vous voudriez passer a l'action ?",
                "Parlez-vous plutot d'un projet lointain, dans quelques mois, ou dans le mois qui vient ?",
            ],
            "alcoholFrequency": [
                "En pensant a l'annee ecoulee, l'alcool vous arrive-t-il plutot jamais, mensuellement, quelques fois par mois, quelques fois par semaine, ou presque tous les jours ?",
                "Sur un mois habituel, a peu pres combien de jours avec alcool avez-vous ?",
            ],
            "alcoholQuantity": [
                "Lorsqu'il vous arrive de boire, combien de verres standards prenez-vous d'habitude au cours d'une journee ordinaire ?",
                "Si vous pensez a une occasion habituelle, etes-vous plutot autour de 1-2, 3-4, 5-6, 7-9, ou 10 verres ou plus ?",
            ],
            "alcoholBinge": [
                "Sur l'annee ecoulee, les episodes de 6 verres ou plus vous arrivent-ils jamais, rarement, mensuellement, hebdomadairement, ou presque chaque jour ?",
                "Ces grosses consommations sont-elles exceptionnelles ou plutot regulieres ?",
            ],
            "currentlySmoking": [
                "Aujourd'hui, fumez-vous encore du tabac ou avez-vous completement arrete ?",
                "Si vous avez arrete, depuis quand n'avez-vous plus fume du tout ?",
            ],
            "smokesDaily": [
                "Sur une semaine habituelle, y a-t-il du tabac tous les jours ou seulement certains jours ?",
                "Avez-vous au moins une cigarette quasiment chaque jour ?",
            ],
            "cannabisFrequency": [
                "Sur les 30 derniers jours, environ combien de jours avez-vous consomme du cannabis ?",
                "Parmi les categories du dossier, laquelle est la plus proche de votre frequence reelle ?",
            ],
            "incomeBracket": [
                "Si vous pensez a vos revenus mensuels nets habituels, dans quelle tranche tombez-vous le plus souvent ?",
                "Il ne faut pas un montant exact: la tranche la plus proche suffit. Quelle est-elle ?",
            ],
            "professionalStatus": [
                "Quelle est votre situation principale en ce moment: travail, etudes, chomage, retraite, foyer ou invalidite ?",
                "Si plusieurs situations existent, laquelle decrit le mieux votre quotidien actuel ?",
            ],
            "educationLevel": [
                "Quel est le diplome ou niveau le plus eleve que vous avez valide ?",
                "Parmi les choix du dossier, lequel correspond le mieux a ce niveau ?",
            ],
            "respiratoryAsthma": [
                "Un medecin vous a-t-il deja diagnostique de l'asthme ou prescrit un traitement specifique ?",
                "Si ce n'est pas diagnostique, quels symptomes concrets ressentez-vous (sifflements, gene respiratoire, crise) ?",
            ],
        }

        if question_id in targeted_questions:
            return targeted_questions[question_id][:4]

        if _is_yes_no_choice_set(choices):
            return [
                f"Concretement, pour \"{label}\", est-ce que la reponse est plutot Oui ou plutot Non dans votre situation reelle ?",
                "Pouvez-vous me donner un exemple concret ou une precision courte pour que je verifie le bon sens de la reponse ?",
            ]

        if question_id in FREE_TEXT_QUESTION_IDS:
            return [
                f"Pour \"{label}\", quels sont les elements les plus importants que vous voulez faire apparaitre ?",
                "Souhaitez-vous que je vous aide a reformuler votre idee en une phrase courte et claire avant de l'ecrire ?",
            ]

        if _is_score_choice_set(choices):
            return [
                f"Si 0 signifie le minimum et {len(choices) - 1} le maximum, ou vous situez-vous sincerement aujourd'hui ?",
                "Qu'est-ce qui vous ferait choisir ce chiffre plutot qu'un point au-dessus ou en dessous ?",
            ]

        if choice_labels:
            return [
                f"Parmi ces choix officiels - {', '.join(choice_labels)} - lequel vous ressemble le plus ?",
                "Qu'est-ce qui vous fait hesiter entre les options encore possibles ?",
            ]

        return [
            f"Pour \"{label}\", quelle est l'information la plus exacte que vous pouvez donner maintenant ?",
            "Si vous hesitez, dites-moi ce qui est certain et ce qui reste approximatif.",
        ]

    def _infer_suggestion(
        self,
        payload: Dict[str, Any],
        choices: Sequence[Dict[str, Any]],
    ) -> Tuple[Optional[str], Optional[str]]:
        if not choices:
            return None, None

        combined = _normalize_text(_combined_user_messages(payload))
        if not combined:
            return None, None

        labels = _choice_label_lookup(choices)
        question_id = _question_id(payload)

        if _is_yes_no_choice_set(choices):
            inferred = self._infer_yes_no(question_id, combined)
            if inferred in labels:
                return inferred, labels[inferred]
            return None, None

        if _is_score_choice_set(choices):
            number = _extract_integer(combined)
            if number is not None:
                candidate = str(number)
                if candidate in labels:
                    return candidate, labels[candidate]

        question_specific = self._infer_question_specific_choice(question_id, combined, labels)
        if question_specific:
            return question_specific, labels[question_specific]

        best_choice = self._score_choice_matches(question_id, combined, choices)
        if best_choice:
            value = _safe_text(best_choice.get("value"))
            return value, _safe_text(best_choice.get("label"))

        return None, None

    def _infer_yes_no(self, question_id: str, normalized_message: str) -> Optional[str]:
        if not normalized_message:
            return None

        has_yes = _contains_any(normalized_message, YES_ALIASES + ["oui", "ouais"])
        has_no = _contains_any(normalized_message, NO_ALIASES + ["non"])
        has_hedge = _contains_any(normalized_message, HEDGING_ALIASES)

        if has_yes and has_no:
            return None

        if question_id == "respiratoryAsthma":
            if "asthme" in normalized_message and has_hedge:
                return None
            if "asthme" in normalized_message and has_yes:
                return "true"
            if "pas d asthme" in normalized_message or ("asthme" in normalized_message and has_no):
                return "false"

        if has_yes:
            return "true"
        if has_no:
            return "false"

        return None

    def _infer_question_specific_choice(
        self,
        question_id: str,
        normalized_message: str,
        labels: Dict[str, str],
    ) -> Optional[str]:
        if question_id == "alcoholQuantity":
            number = _extract_integer(normalized_message)
            if number is not None:
                if number <= 2:
                    return "0"
                if number <= 4:
                    return "1"
                if number <= 6:
                    return "2"
                if number <= 9:
                    return "3"
                return "4"

        if question_id == "weeklyTobaccoSpend":
            return None

        if question_id == "pregnancyTrimester":
            number = _extract_integer(normalized_message)
            if number in (1, 2, 3):
                return str(number)

        for value, aliases in QUESTION_CHOICE_ALIASES.get(question_id, {}).items():
            if value in labels and _contains_any(normalized_message, [_normalize_text(alias) for alias in aliases]):
                return value
        return None

    def _score_choice_matches(
        self,
        question_id: str,
        normalized_message: str,
        choices: Sequence[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        token_set = set(normalized_message.split())
        best_choice: Optional[Dict[str, Any]] = None
        best_score = 0

        for choice in choices:
            value = _safe_text(choice.get("value"))
            label = _safe_text(choice.get("label"))
            normalized_label = _normalize_text(label)
            normalized_value = _normalize_text(value)
            score = 0

            if normalized_label and normalized_label in normalized_message:
                score += 10
            if normalized_value and normalized_value in normalized_message:
                score += 6

            label_tokens = {token for token in normalized_label.split() if len(token) > 2}
            score += len(token_set.intersection(label_tokens))

            for alias in QUESTION_CHOICE_ALIASES.get(question_id, {}).get(value, []):
                if _normalize_text(alias) in normalized_message:
                    score += 12

            if score > best_score:
                best_score = score
                best_choice = choice

        return best_choice if best_score >= 6 else None

    def _build_suggestion_reason(
        self,
        payload: Dict[str, Any],
        suggestion_value: Optional[str],
        suggestion_label: Optional[str],
    ) -> str:
        choices = _choices(payload)
        question_id = _question_id(payload)
        if suggestion_value and suggestion_label:
            last_message = _latest_user_message(payload)
            if last_message:
                if _is_free_text_question(question_id, choices):
                    return (
                        "Je peux te proposer cette formulation a partir de tes propres mots. "
                        "Tu peux la garder telle quelle ou la modifier."
                    )
                return (
                    f"Pour l'instant, l'option qui me semble la plus proche est \"{suggestion_label}\". "
                    "Dis-moi si cela correspond bien a ta situation."
                )
            return (
                f"Pour l'instant, l'option la plus coherente me semble etre \"{suggestion_label}\". "
                "A confirmer seulement si cela te correspond vraiment."
            )
        return (
            "Pour l'instant, je prefere encore clarifier un peu avant de te proposer une option."
        )

    def _validate_result(
        self,
        result: Dict[str, Any],
        payload: Dict[str, Any],
        references: List[KnowledgeReference],
    ) -> Dict[str, Any]:
        official_choices = _choices(payload)
        allowed_values = {_safe_text(choice.get("value")) for choice in official_choices}
        label_to_value = {
            _normalize_text(choice.get("label")): _safe_text(choice.get("value"))
            for choice in official_choices
            if _safe_text(choice.get("label")) and _safe_text(choice.get("value"))
        }
        value_to_label = {
            _safe_text(choice.get("value")): _safe_text(choice.get("label"))
            for choice in official_choices
            if _safe_text(choice.get("label")) and _safe_text(choice.get("value"))
        }

        def pick(key_camel: str, key_snake: str) -> Any:
            return result.get(key_camel, result.get(key_snake))

        suggested_choice_value = _safe_text(pick("suggestedChoiceValue", "suggested_choice_value")) or None
        suggested_choice_label = _safe_text(pick("suggestedChoiceLabel", "suggested_choice_label")) or None
        explanation_text = _safe_text(pick("explanation", "explanation"))
        suggestion_reason_text = _safe_text(pick("suggestionReason", "suggestion_reason"))
        if allowed_values:
            if not suggested_choice_value and suggested_choice_label:
                suggested_choice_value = label_to_value.get(_normalize_text(suggested_choice_label))
            if suggested_choice_value and not suggested_choice_label:
                suggested_choice_label = value_to_label.get(suggested_choice_value)
            if not suggested_choice_value:
                combined_text = _normalize_text(f"{explanation_text} {suggestion_reason_text}")
                inferred_values = [
                    value
                    for normalized_label, value in label_to_value.items()
                    if normalized_label and normalized_label in combined_text
                ]
                inferred_values = list(dict.fromkeys(inferred_values))
                if len(inferred_values) == 1:
                    suggested_choice_value = inferred_values[0]
                    suggested_choice_label = value_to_label.get(suggested_choice_value)
            if suggested_choice_value not in allowed_values:
                suggested_choice_value = None
                suggested_choice_label = None
        else:
            if suggested_choice_value and not suggested_choice_label:
                suggested_choice_label = "Proposition de formulation"

        return {
            "explanation": _safe_text(pick("explanation", "explanation"))
            or "Je vais vous aider a comprendre la question puis a verifier quel choix officiel est le plus proche.",
            "clarifying_questions": [
                _safe_text(item)
                for item in (pick("clarifyingQuestions", "clarifying_questions") or [])
                if _safe_text(item)
            ][:4],
            "suggested_choice_value": suggested_choice_value,
            "suggested_choice_label": suggested_choice_label,
            "suggestion_reason": _safe_text(pick("suggestionReason", "suggestion_reason"))
            or "Je n'ai pas encore une suggestion suffisamment fiable.",
            "needs_patient_confirmation": True,
            "safety_note": _safe_text(pick("safetyNote", "safety_note"))
            or "Le patient garde toujours la decision finale sur la reponse.",
            "engine": _safe_text(pick("engine", "engine")) or "fallback",
            "engine_warning": _safe_text(pick("engineWarning", "engine_warning")) or None,
            "references": [
                {"source": ref.source, "title": ref.title, "excerpt": ref.excerpt}
                for ref in references
            ],
        }

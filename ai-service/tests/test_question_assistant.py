import asyncio

from app.services.question_assistant import QuestionAssistantService


def test_question_assistant_prefers_gemini_output(monkeypatch):
    payload = {
        "question_id": "respiratoryAsthma",
        "question_label": "Avez-vous de l'asthme ?",
        "question_context": "Repondre Oui si l'asthme est actuel ou deja connu medicalement.",
        "patient_message": "Effectivement, un medecin m'a deja diagnostique un asthme.",
        "official_choices": [
            {"value": "true", "label": "Oui"},
            {"value": "false", "label": "Non"},
        ],
        "patient_facts": {},
        "conversation_history": [],
    }

    async def fake_generate_json(self, **kwargs):
        assert "Avez-vous de l'asthme ?" in kwargs["user_prompt"]
        assert "Effectivement, un medecin m'a deja diagnostique un asthme." in kwargs["user_prompt"]
        return {
            "explanation": "Vous dites qu'un diagnostic a deja ete pose, donc je m'oriente vers Oui.",
            "clarifying_questions": [
                "Pouvez-vous confirmer si ce diagnostic a ete pose par un medecin ?"
            ],
            "suggested_choice_value": "true",
            "suggested_choice_label": "Oui",
            "suggestion_reason": "Le diagnostic medical explicite rend Oui le choix le plus proche.",
            "needs_patient_confirmation": True,
            "safety_note": "Confirmez si cela correspond bien a votre situation.",
        }

    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.is_configured", lambda self: True)
    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.provider", property(lambda self: "groq"))
    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.generate_json", fake_generate_json)

    result = asyncio.run(QuestionAssistantService().assist(payload))

    assert result["suggested_choice_value"] == "true"
    assert result["suggested_choice_label"] == "Oui"
    assert "diagnostic" in result["suggestion_reason"].lower()


def test_question_assistant_discards_non_official_gemini_choice(monkeypatch):
    payload = {
        "question_id": "respiratoryAsthma",
        "question_label": "Avez-vous de l'asthme ?",
        "question_context": "Repondre Oui si l'asthme est actuel ou deja connu medicalement.",
        "patient_message": "Je ne suis pas sur.",
        "official_choices": [
            {"value": "true", "label": "Oui"},
            {"value": "false", "label": "Non"},
        ],
        "patient_facts": {},
        "conversation_history": [],
    }

    async def fake_generate_json(self, **kwargs):
        return {
            "explanation": "Je dois encore clarifier la situation.",
            "clarifying_questions": ["Un medecin vous l'a-t-il deja confirme ?"],
            "suggested_choice_value": "maybe",
            "suggested_choice_label": "Peut-etre",
            "suggestion_reason": "Il manque encore des informations.",
            "needs_patient_confirmation": True,
            "safety_note": "Ne confirmez qu'une fois certain.",
        }

    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.is_configured", lambda self: True)
    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.provider", property(lambda self: "groq"))
    monkeypatch.setattr("app.services.llm_client.DefaultLlmClient.generate_json", fake_generate_json)

    result = asyncio.run(QuestionAssistantService().assist(payload))

    assert result["suggested_choice_value"] is None
    assert result["suggested_choice_label"] is None
    assert result["clarifying_questions"] == ["Un medecin vous l'a-t-il deja confirme ?"]

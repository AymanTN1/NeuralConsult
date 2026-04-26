from app.services.domain_knowledge import (
    ClinicalIntelligenceKnowledgeBaseClient,
    ClinicalNotesKnowledgeBaseClient,
    QuestionAssistantKnowledgeBaseClient,
    SupportChatKnowledgeBaseClient,
)


def test_domain_knowledge_clients_return_their_own_references():
    question_refs = QuestionAssistantKnowledgeBaseClient().retrieve(
        "question medicale asthme diagnostic",
        {"patient_message": "On m'a parle d'asthme"},
    )
    support_refs = SupportChatKnowledgeBaseClient().retrieve(
        "je vais craquer rechute stress",
        {"patient_facts": {"had_anxiety_score": 12}},
    )
    notes_refs = ClinicalNotesKnowledgeBaseClient().retrieve(
        "note medicale structurée scores had fagerstrom",
        {"patient_profile": {"had_anxiety_score": 10}},
    )
    intelligence_refs = ClinicalIntelligenceKnowledgeBaseClient().retrieve(
        "resume global journal plan sevrage",
        {"tests": {"fagerstrom_latest": {"score": 7}}},
    )

    assert question_refs
    assert support_refs
    assert notes_refs
    assert intelligence_refs
    assert all(ref.source.startswith("NeuralConsult/") for ref in question_refs + support_refs + notes_refs + intelligence_refs)

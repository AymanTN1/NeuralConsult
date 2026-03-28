from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass(frozen=True)
class KnowledgeReference:
    source: str
    title: str
    excerpt: str


class KnowledgeBaseClient:
    """
    RAG preparation stub.

    Future plan:
    - Index official clinical guidelines (e.g., INPES 2007) into a Vector DB.
    - Retrieve relevant snippets based on the patient's clinical facts.
    - Provide citations (source + excerpt) to the generator to enrich outputs.

    IMPORTANT:
    - Today this returns an empty list by design (no external medical KB wired yet).
    - Keeping this as a separate class makes the codebase ready for RAG later.
    """

    def retrieve(self, query: str, facts: Dict[str, Any]) -> List[KnowledgeReference]:
        # TODO(RAG): Connect to vector database and return top-k guideline chunks.
        # Example:
        #   hits = vectordb.search(query=query, filters={"doc": "INPES_2007"}, top_k=5)
        #   return [KnowledgeReference(...from hit...) for hit in hits]
        _ = (query, facts)
        return []


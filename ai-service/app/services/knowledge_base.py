from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Sequence, Tuple


@dataclass(frozen=True)
class KnowledgeReference:
    source: str
    title: str
    excerpt: str
    tags: Tuple[str, ...] = field(default_factory=tuple)


class KnowledgeBaseClient:
    """
    Base contract for domain-specific RAG clients.

    Each AI capability can now own an independent retrieval layer instead of
    sharing a single generic RAG stub.
    """

    def retrieve(self, query: str, facts: Dict[str, Any]) -> List[KnowledgeReference]:
        _ = (query, facts)
        return []


class StaticKnowledgeBaseClient(KnowledgeBaseClient):
    """
    Lightweight in-repo retriever.

    We keep the retrieval deterministic and local for now:
    - no vector DB dependency
    - each AI domain gets its own curated knowledge pack
    - replacing this later with a real retriever will stay localized
    """

    def __init__(self, *, domain_name: str, references: Sequence[KnowledgeReference], default_top_k: int = 3) -> None:
        self.domain_name = domain_name
        self.references = list(references)
        self.default_top_k = default_top_k

    def retrieve(self, query: str, facts: Dict[str, Any]) -> List[KnowledgeReference]:
        if not self.references:
            return []

        query_tokens = self._tokenize(" ".join(filter(None, [query, self._facts_to_text(facts)])))
        if not query_tokens:
            return self.references[: self.default_top_k]

        ranked: List[Tuple[int, KnowledgeReference]] = []
        for reference in self.references:
            corpus_tokens = self._tokenize(
                " ".join([reference.title, reference.excerpt, *reference.tags, reference.source, self.domain_name])
            )
            overlap = len(query_tokens.intersection(corpus_tokens))
            if overlap == 0:
                continue

            phrase_bonus = 0
            normalized_query = self._normalize(query)
            normalized_excerpt = self._normalize(reference.excerpt)
            if normalized_query and normalized_query in normalized_excerpt:
                phrase_bonus += 3
            if any(tag in normalized_query for tag in map(self._normalize, reference.tags)):
                phrase_bonus += 2

            ranked.append((overlap + phrase_bonus, reference))

        if not ranked:
            return self.references[: self.default_top_k]

        ranked.sort(key=lambda item: item[0], reverse=True)
        return [reference for _, reference in ranked[: self.default_top_k]]

    def _facts_to_text(self, facts: Dict[str, Any]) -> str:
        if not facts:
            return ""
        try:
            return json.dumps(facts, ensure_ascii=False, default=str)
        except TypeError:
            return str(facts)

    def _tokenize(self, text: str) -> set[str]:
        normalized = self._normalize(text)
        return {token for token in normalized.split() if len(token) > 2}

    def _normalize(self, text: Any) -> str:
        raw = str(text or "").strip().lower()
        if not raw:
            return ""
        raw = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode("ascii")
        raw = re.sub(r"[^a-z0-9\s]", " ", raw)
        return re.sub(r"\s+", " ", raw).strip()


def make_references(items: Iterable[Tuple[str, str, str, Sequence[str]]]) -> List[KnowledgeReference]:
    return [
        KnowledgeReference(source=source, title=title, excerpt=excerpt, tags=tuple(tags))
        for source, title, excerpt, tags in items
    ]

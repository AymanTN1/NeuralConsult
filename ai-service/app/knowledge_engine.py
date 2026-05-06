import os
from typing import List
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

class KnowledgeEngine:
    def __init__(self, docs_path: str, persist_directory: str = "./chroma_db"):
        self.docs_path = docs_path
        self.persist_directory = persist_directory
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=os.getenv("GEMINI_API_KEY"))
        self.vector_store = None
        self._initialize_db()

    def _initialize_db(self):
        if os.path.exists(self.persist_directory) and os.listdir(self.persist_directory):
            print("Loading existing knowledge base...")
            self.vector_store = Chroma(persist_directory=self.persist_directory, embedding_function=self.embeddings)
        else:
            print("Creating new knowledge base from documents...")
            documents = self._load_documents()
            if documents:
                self.vector_store = Chroma.from_documents(
                    documents=documents,
                    embedding=self.embeddings,
                    persist_directory=self.persist_directory
                )
                self.vector_store.persist()
            else:
                print("No documents found in", self.docs_path)

    def _load_documents(self) -> List[Document]:
        documents = []
        if not os.path.exists(self.docs_path):
            return []

        for filename in os.listdir(self.docs_path):
            if filename.endswith(".pdf"):
                path = os.path.join(self.docs_path, filename)
                try:
                    doc = fitz.open(path)
                    text = ""
                    for page in doc:
                        text += page.get_text()
                    
                    # Create chunks
                    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
                    chunks = text_splitter.split_text(text)
                    
                    for i, chunk in enumerate(chunks):
                        documents.append(Document(
                            page_content=chunk,
                            metadata={"source": filename, "chunk": i}
                        ))
                except Exception as e:
                    print(f"Error processing {filename}: {e}")
        
        return documents

    def query(self, query_text: str, n_results: int = 3):
        if not self.vector_store:
            return []
        results = self.vector_store.similarity_search(query_text, k=n_results)
        return results

    def get_clinical_guidance(self, topic: str):
        """Specifically tailored for medical guidance extraction"""
        results = self.query(topic, n_results=5)
        guidance = []
        for res in results:
            guidance.append({
                "content": res.page_content,
                "source": res.metadata.get("source", "Unknown"),
                "relevance": "High"
            })
        return guidance

# Global instance for the app
# Path to documents in the frontend public folder (relative to ai-service)
DOCS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "papiersMedicales"))
PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "knowledge_db"))

knowledge_engine = KnowledgeEngine(docs_path=DOCS_PATH, persist_directory=PERSIST_DIR)

import uuid
from typing import List, Dict, Any
from pypdf import PdfReader
from app.database import db

class RAGService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extracts raw text content from a text-based PDF file."""
        reader = PdfReader(file_path)
        full_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
        return "\n".join(full_text)

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Splits raw text into smaller overlapping chunks to maintain semantic context."""
        words = text.split()
        chunks = []
        
        # Simple sliding window chunker
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i : i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
                
        return chunks

    @classmethod
    def process_and_store_document(cls, file_path: str, filename: str) -> List[str]:
        """Runs the extraction, chunking, and storage loop for an uploaded document."""
        raw_text = cls.extract_text_from_pdf(file_path)
        chunks = cls.chunk_text(raw_text)
        
        ids = [f"chunk_{uuid.uuid4().hex[:8]}" for _ in chunks]
        metadatas = [{"filename": filename} for _ in chunks]
        
        # Access the global database client/fallback abstraction
        collection = db.get_collection()
        collection.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas
        )
        
        return ids

    @staticmethod
    def retrieve_relevant_context(query: str, n_results: int = 5) -> str:
        """Queries the store for the top-k most semantically matching text blocks."""
        collection = db.get_collection()
        results = collection.query(query_texts=[query], n_results=n_results)
        
        # Flatten retrieved list structures safely
        documents = results.get("documents", [[]])[0]
        return "\n\n---\n\n".join(documents)
from functools import lru_cache
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

from src.config import api_key


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Use an API-based embedding model instead of loading
    SentenceTransformers/PyTorch into the Render process.

    This keeps the backend memory footprint much lower.
    """
    return OpenAIEmbeddings(
        model="text-embedding-3-small",
        api_key=api_key,
    )


def create_embedding(data, dict_loc, collection_name):
    """
    Create/update the Chroma vector store using API embeddings.
    """
    vector_store = Chroma.from_documents(
        documents=data,
        embedding=get_embedding_model(),
        collection_name=collection_name,
        persist_directory=dict_loc,
    )
    return vector_store
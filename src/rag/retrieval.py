from functools import lru_cache
from langchain_community.vectorstores import Chroma
from src.config import chroma_loc
from src.rag.embeddings import get_embedding_model

COLLECTION_NAME = "kb_fixed_size"

@lru_cache(maxsize=1)
def get_vectorstore():
    """
    Lazily initialize the Chroma vector store.

    The embedding model is an API-based embedding model,
    so no PyTorch/SentenceTransformer model is loaded
    into the Render process.
    """
    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=chroma_loc,
        embedding_function=get_embedding_model(),
    )


@lru_cache(maxsize=1)
def get_retriever():
    """
    Lazily create the retriever.
    """
    return get_vectorstore().as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},
    )


class LazyRetriever:
    """
    Compatibility wrapper for existing generation.py code.

    The actual Chroma store and embedding model are created
    only when retrieval is actually requested.
    """

    def invoke(self, query):
        return get_retriever().invoke(query)


# Keep this name because generation.py currently imports it.
retreiver = LazyRetriever()


def retrieve_chunks(user_query, retriever):
    """
    Retrieve the most relevant document chunks.
    """
    return retriever.invoke(user_query)


def retrieve_chunks_with_score(user_query: str, k: int = 5):
    """
    Retrieve documents and calculate cosine similarity
    between the query embedding and retrieved documents.

    Returns:
        (documents, top1_score)
    """

    vectorstore = get_vectorstore()

    docs_with_distance = vectorstore.similarity_search_with_score(
        user_query,
        k=k,
    )

    if not docs_with_distance:
        return [], 0.0

    embedding_model = get_embedding_model()

    query_vec = embedding_model.embed_query(user_query)

    docs = [doc for doc, _ in docs_with_distance]

    doc_vecs = embedding_model.embed_documents(
        [doc.page_content for doc in docs]
    )

    import numpy as np

    query_vec = np.asarray(query_vec, dtype=np.float32)
    doc_vecs = np.asarray(doc_vecs, dtype=np.float32)

    query_norm = np.linalg.norm(query_vec)
    doc_norms = np.linalg.norm(doc_vecs, axis=1)

    sims = (
        doc_vecs @ query_vec
    ) / (
        doc_norms * query_norm + 1e-10
    )

    top1_score = float(sims[0])

    return docs, top1_score


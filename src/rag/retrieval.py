from functools import lru_cache

import numpy as np
from langchain_community.vectorstores import Chroma

from src.config import chroma_loc
from src.rag.embeddings import get_embedding_model


collection_name = "kb_fixed_size"


@lru_cache(maxsize=1)
def get_vectorstore():
    return Chroma(
        collection_name=collection_name,
        persist_directory=chroma_loc,
        embedding_function=get_embedding_model(),
    )


@lru_cache(maxsize=1)
def get_retriever():
    return get_vectorstore().as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},
    )


# Keep the existing name expected by generation.py.
# It is a lightweight proxy, so the actual vector store/model
# is initialized only when invoke() is called.
class LazyRetriever:
    def invoke(self, query):
        return get_retriever().invoke(query)


retreiver = LazyRetriever()


def retrieve_chunks(user_query, retriever):
    return retriever.invoke(user_query)


def retrieve_chunks_with_score(user_query, k: int = 5):
    vectorstore = get_vectorstore()

    docs_with_distance = vectorstore.similarity_search_with_score(
        user_query,
        k=k,
    )

    if not docs_with_distance:
        return [], 0.0

    embedding_model = get_embedding_model()

    query_vec = np.array(
        embedding_model.embed_query(user_query)
    )

    docs = [doc for doc, _ in docs_with_distance]

    doc_vecs = np.array(
        embedding_model.embed_documents(
            [doc.page_content for doc in docs]
        )
    )

    sims = (
        doc_vecs @ query_vec
    ) / (
        np.linalg.norm(doc_vecs, axis=1)
        * np.linalg.norm(query_vec)
        + 1e-10
    )

    top1_score = float(sims[0])

    return docs, top1_score
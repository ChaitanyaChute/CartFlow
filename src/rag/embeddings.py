from functools import lru_cache

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


@lru_cache(maxsize=1)
def get_embedding_model():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def create_embedding(data, dict_loc, collection_name):
    vector_store = Chroma.from_documents(
        data,
        get_embedding_model(),
        collection_name=collection_name,
        persist_directory=dict_loc,
    )

    return vector_store
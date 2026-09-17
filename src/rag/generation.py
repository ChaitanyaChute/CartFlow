import logging

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

from src.config import (
    rag_prompt,
    rag_temperature,
    rag_model,
)

from src.rag.retrieval import (
    retrieve_chunks,
    retreiver,
    retrieve_chunks_with_score,
)

from src.llm_client import get_llm_client

SIMILARITY_THRESHOLD = 0.3282

logger = logging.getLogger("rag_generation")

client = get_llm_client()

qna_user_message_template = """
###Context
Here are some documents and their source that may be relevant to the question mentioned below.
{context}

###Question
{question}
"""

@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(
        multiplier=1,
        min=1,
        max=10,
    ),
    before_sleep=before_sleep_log(
        logger,
        logging.WARNING,
    ),
)
def rag_generate(user_input: str) -> str:
    """
    Retrieve relevant documents and generate an answer using the LLM.
    """

    relevant_document_chunks = retrieve_chunks(
        user_input,
        retreiver,
    )

    context_list = [
        d.page_content
        + "\n ###Source: "
        + d.metadata.get("source", "unknown")
        + "\n\n"
        for d in relevant_document_chunks
    ]

    context_for_query = ". ".join(context_list)

    prompt = [
        {
            "role": "system",
            "content": rag_prompt,
        },
        {
            "role": "user",
            "content": qna_user_message_template.format(
                context=context_for_query,
                question=user_input,
            ),
        },
    ]

    try:
        logger.info("RAG API CALL")

        response = client.chat.completions.create(
            model=rag_model,
            messages=prompt,
            temperature=rag_temperature,
        )

        prediction = response.choices[0].message.content

        logger.info("RAG API SUCCESS")

        return prediction

    except Exception as exc:
        logger.error(
            "RAG API FAILED: %s",
            exc,
        )
        raise

def rag_generate_with_score(
    user_input: str,
    return_score: bool = False,
):
    """
    Retrieve documents, calculate similarity, and generate an answer.
    """

    relevant_document_chunks, top1_score = retrieve_chunks_with_score(
        user_input
    )

    context_list = [
        d.page_content
        + "\n ###Source: "
        + d.metadata.get("source", "unknown")
        + "\n\n"
        for d in relevant_document_chunks
    ]

    context_for_query = ". ".join(context_list)

    prompt = [
        {
            "role": "system",
            "content": rag_prompt,
        },
        {
            "role": "user",
            "content": qna_user_message_template.format(
                context=context_for_query,
                question=user_input,
            ),
        },
    ]

    try:
        logger.info("RAG API CALL")

        response = client.chat.completions.create(
            model=rag_model,
            messages=prompt,
            temperature=rag_temperature,
        )

        prediction = response.choices[0].message.content

        logger.info("RAG API SUCCESS")

    except Exception as exc:
        logger.error(
            "RAG API FAILED: %s",
            exc,
        )
        raise

    return (
        (prediction, top1_score)
        if return_score
        else prediction
    )

import json
import logging
from typing import TypeVar
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from pydantic import BaseModel


Draft = TypeVar("Draft", bound=BaseModel)


class GroqGenerationError(Exception):
    """Raised when Groq fails or returns an invalid draft."""


def _provider_error_code(error: HTTPError) -> str | None:
    try:
        with error:
            code = json.loads(error.read(8192))["error"]["code"]
    except (OSError, ValueError, KeyError, TypeError):
        return None
    return code if isinstance(code, str) and len(code) <= 80 and code.isidentifier() else None


def generate_draft(
    api_key: str,
    instructions: str,
    prompt: str,
    schema: type[Draft],
    *,
    text_field: str | None = None,
) -> Draft:
    payload = {
        "model": "openai/gpt-oss-20b",
        "response_format": {"type": "text" if text_field else "json_object"},
        "messages": [
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt},
        ],
    }
    request = Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "User-Agent": "LearnForge/1.0",
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=20) as response:
            result = json.load(response)

        content = result["choices"][0]["message"]["content"]
        if text_field is not None:
            return schema.model_validate({text_field: content})
        return schema.model_validate_json(content)
    except (OSError, ValueError, KeyError, IndexError, TypeError) as error:
        logging.getLogger(__name__).warning(
            "Groq generation failed for %s: %s, HTTP status=%s, code=%s, cause=%s",
            schema.__name__,
            type(error).__name__,
            getattr(error, "code", None),
            _provider_error_code(error) if isinstance(error, HTTPError) else None,
            type(getattr(error, "reason", None)).__name__,
        )
        raise GroqGenerationError from error

from io import BytesIO

from pypdf import PdfReader, apply_configuration
from pypdf.errors import PyPdfError


MAX_PDF_BYTES = 3 * 1024 * 1024
MAX_PDF_PAGES = 20
MAX_SOURCE_BYTES = 6000


class PdfSourceError(Exception):
    """Raised when a PDF cannot be used as a course source."""


def extract_pdf_source(data: bytes) -> str:
    if not data.startswith(b"%PDF-"):
        raise PdfSourceError("Upload a valid PDF file")

    try:
        with apply_configuration(
            maximum_declared_stream_length=3 * 1024 * 1024,
            stream_decoding_work_maximum_length=8 * 1024 * 1024,
            page_tree_maximum_page_entries=1000,
        ):
            reader = PdfReader(
                BytesIO(data),
                root_object_recovery_limit=1000,
                xref_stream_maximum_entries=50000,
            )
            if reader.is_encrypted:
                raise PdfSourceError("Upload a PDF without password protection")
            if len(reader.pages) > MAX_PDF_PAGES:
                raise PdfSourceError(f"Upload a PDF with at most {MAX_PDF_PAGES} pages")

            source = bytearray()
            for page in reader.pages:
                text = page.extract_text().strip()
                if text:
                    remaining = MAX_SOURCE_BYTES - len(source)
                    source.extend((text + "\n\n").encode("utf-8")[:remaining])
                    if len(source) == MAX_SOURCE_BYTES:
                        break
    except (PyPdfError, OSError, RecursionError, TypeError, ValueError) as error:
        raise PdfSourceError("Could not read this PDF") from error

    if not source:
        raise PdfSourceError("The PDF has no selectable text")

    return source.decode("utf-8", errors="ignore").strip()

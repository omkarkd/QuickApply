"""
Upload page — pick Resume or JD first, then upload, then parse.

Flow:
  1. Radio: "Resume" or "JD"   (default = Resume)
  2. File picker (PDF / DOCX / DOC / TXT)
  3. "Extract text"   → text is extracted + saved to /api/uploads
  4. "Parse (simple)" / "Parse (AI)"   → parsed result is shown briefly,
     then the user is auto-redirected to the matching Editor with the
     fields pre-filled.
"""
from __future__ import annotations

import streamlit as st

import auth
import api_client as api
import upload_extract as uex

ACCEPTED = ["pdf", "docx", "doc", "txt"]
MAX_MB = 20  # soft cap — uploads larger than this get a warning


def _parse_endpoint(doc_type: str, parser: str) -> str:
    """Return the api_client function name to call for a given doc_type + parser."""
    if doc_type == "jd":
        return "parse_jd_ai" if parser == "ai" else "parse_jd_simple"
    # resume
    return "parse_resume_ai" if parser == "ai" else "parse_resume_simple"


def _nav_target(doc_type: str) -> str:
    """Which sidebar page to jump to after a successful parse."""
    return "jd_editor" if doc_type == "jd" else "resume_editor"


def _seed_editor_state(doc_type: str, title: str, raw_text: str, parsed: dict) -> None:
    """Populate the matching Editor's session_state so it opens pre-filled."""
    if doc_type == "jd":
        st.session_state["je_title"] = title
        st.session_state["je_raw"] = raw_text
        st.session_state["je_parsed"] = parsed
        st.session_state["je_loaded_id"] = None
        st.session_state["je_saved_id"] = None
    else:
        st.session_state["re_title"] = title
        st.session_state["re_raw"] = raw_text
        st.session_state["re_parsed"] = parsed
        st.session_state["re_loaded_id"] = None
        st.session_state["re_saved_id"] = None
        st.session_state["editing_resume_id"] = None


def render() -> None:
    auth.require_auth()

    st.header("📤 Upload Document")
    st.caption(
        "Pick a document type, upload a **PDF**, **DOCX**, **DOC**, or **TXT** file, "
        "extract its text, then run the parser. You'll be sent to the matching editor."
    )

    # ---------- 1. Type radio (always visible) ----------
    doc_type = st.radio(
        "What kind of document is this?",
        options=["resume", "jd"],
        format_func=lambda v: "📄 Resume" if v == "resume" else "💼 Job Description (JD)",
        horizontal=True,
        key="upload_doc_type",
    )

    # ---------- 2. File picker ----------
    f = st.file_uploader(
        "Choose a file",
        type=ACCEPTED,
        accept_multiple_files=False,
        help=f"PDF, DOCX, DOC, TXT — up to ~{MAX_MB} MB",
        key=f"upload_file_{doc_type}",   # reset the picker when type changes
    )

    if f is None:
        st.info("No file selected yet.")
        return

    blob = f.getvalue()
    size_mb = len(blob) / (1024 * 1024)
    st.caption(f"**{f.name}** — {size_mb:.2f} MB")
    if size_mb > MAX_MB:
        st.warning(f"File is larger than {MAX_MB} MB — extraction may be slow.")

    # ---------- 3. Extract ----------
    if st.button("⚙️  Extract text", type="primary", use_container_width=True, key="upload_extract"):
        with st.spinner(f"Extracting text from {f.name}…"):
            try:
                text = uex.extract(blob, filename=f.name)
            except uex.UnsupportedFileType as e:
                st.error(str(e))
                return
            except RuntimeError as e:
                st.error(str(e))
                return
            except Exception as e:  # noqa: BLE001
                st.error(f"Unexpected error: {e}")
                return

        # Persist to Mongo through the new /api/uploads route
        try:
            saved = api.create_upload(doc_type=doc_type, filename=f.name, raw_text=text)
            st.session_state["upload_id"] = saved["id"]
            st.session_state["upload_text"] = text
            st.session_state["upload_name"] = f.name
            st.session_state["upload_doc_type"] = doc_type
            st.success(
                f"Extracted {len(text):,} characters. "
                f"Saved to your uploads (id {saved['id'][:8]}…). "
                f"Now click a parse button below."
            )
        except Exception as e:  # noqa: BLE001
            st.error(f"Saved extraction failed: {e}")
            return

    # ---------- 4. Preview + parse ----------
    text = st.session_state.get("upload_text")
    if not text:
        return

    # If the user switched the radio after extracting, surface that and stop.
    if st.session_state.get("upload_doc_type") != doc_type:
        st.warning(
            "You changed the document type after extracting. "
            "Click 'Extract text' again to re-save with the new type."
        )
        return

    c1, c2, c3 = st.columns(3)
    c1.metric("Characters", f"{len(text):,}")
    c2.metric("Words", f"{len(text.split()):,}")
    c3.metric("Lines", f"{text.count(chr(10)) + 1:,}")

    with st.expander("Preview (first 2,000 chars)", expanded=True):
        st.text(text[:2000] + ("…" if len(text) > 2000 else ""))

    st.divider()
    st.subheader(f"Parse the {doc_type.upper()}")

    p1, p2 = st.columns(2)
    parse_simple_clicked = p1.button(
        "⚙️  Parse (simple)", use_container_width=True, key="upload_parse_simple"
    )
    parse_ai_clicked = p2.button(
        "🤖  Parse (AI)", type="primary", use_container_width=True, key="upload_parse_ai"
    )

    if not (parse_simple_clicked or parse_ai_clicked):
        return

    parser = "ai" if parse_ai_clicked else "simple"
    fn_name = _parse_endpoint(doc_type, parser)
    fn = getattr(api, fn_name, None)
    if fn is None:
        st.error(f"api_client.{fn_name} is missing.")
        return

    with st.spinner(f"Running {parser} {doc_type} parser…"):
        try:
            parsed = fn(text)
        except Exception as e:  # noqa: BLE001
            # Per your choice: show the error in red, keep the user on this page.
            st.error(f"Parser failed: {e}")
            st.info(
                "Tip: the AI parser requires `ANTHROPIC_API_KEY` in `backend/.env`. "
                "If it's missing, use 'Parse (simple)'."
            )
            return

    # Show a quick preview of what was parsed (so the user knows it worked)
    with st.expander("Parsed result (preview)", expanded=True):
        st.json(parsed)

    # ---------- 5. Auto-redirect to the right editor ----------
    title_guess = (st.session_state.get("upload_name") or "Uploaded").rsplit(".", 1)[0]
    _seed_editor_state(doc_type=doc_type, title=title_guess, raw_text=text, parsed=parsed)

    target = _nav_target(doc_type)
    target_label = "Resume Editor" if target == "resume_editor" else "JD Editor"
    st.success(f"Parsed. Redirecting to {target_label}…")
    st.session_state["nav"] = target
    st.rerun()

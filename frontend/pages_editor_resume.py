"""Resume Editor — parse text (simple or AI), edit parsed fields, save, download."""
from __future__ import annotations

import json

import streamlit as st

import api_client as api


def _default_parsed() -> dict:
    return {
        "name": "",
        "email": "",
        "linkedin": "",
        "professional_summary": "",
        "technical_skills": [],
        "experiences": [],
        "projects": [],
        "education": [],
    }


def _load_existing(resume_id: str) -> dict | None:
    try:
        return api.get_resume(resume_id)
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        return None


def render() -> None:
    st.header("📝 Resume Editor")
    rid = st.session_state.get("editing_resume_id")

    # ---- Top bar: pick existing or start new ----
    try:
        resumes = api.list_resumes()
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        resumes = []

    options = ["— New resume —"] + [f"{r['title']}  ({r['id'][:8]})" for r in resumes]
    if rid:
        # Try to keep the current selection
        current_label = next((options[i] for i, r in enumerate(resumes, 1) if r["id"] == rid), options[0])
    else:
        current_label = options[0]
    choice = st.selectbox("Resume", options, index=options.index(current_label) if current_label in options else 0)
    if choice == options[0]:
        rid = None
        st.session_state["editing_resume_id"] = None
    else:
        idx = options.index(choice) - 1
        rid = resumes[idx]["id"]
        st.session_state["editing_resume_id"] = rid

    # ---- Load state ----
    if rid:
        rec = _load_existing(rid) or {}
    else:
        rec = {"title": "", "raw_text": "", "parsed_data": _default_parsed()}

    if "re_title" not in st.session_state or st.session_state.get("re_loaded_id") != rid:
        st.session_state["re_title"] = rec.get("title", "")
        st.session_state["re_raw"] = rec.get("raw_text", "")
        st.session_state["re_parsed"] = rec.get("parsed_data") or _default_parsed()
        st.session_state["re_loaded_id"] = rid
        st.session_state["re_saved_id"] = rid

    title = st.text_input("Title", value=st.session_state["re_title"], key="re_title_input")

    # ---- 0. Inline upload (optional) ----
    with st.expander("📤  Or upload a file (PDF / DOCX / DOC / TXT)", expanded=False):
        import upload_extract as uex  # local import to keep the editor's deps narrow
        up_f = st.file_uploader(
            "Pick a resume file",
            type=["pdf", "docx", "doc", "txt"],
            accept_multiple_files=False,
            key="re_inline_upload",
            help="Extracted text will be loaded into the editor below and run through the simple parser.",
        )
        if up_f is not None and st.button("⚙️  Extract & load", use_container_width=True, key="re_inline_extract"):
            with st.spinner(f"Extracting text from {up_f.name}…"):
                try:
                    text = uex.extract(up_f.getvalue(), filename=up_f.name)
                except uex.UnsupportedFileType as e:
                    st.error(str(e))
                except RuntimeError as e:
                    st.error(str(e))
                except Exception as e:  # noqa: BLE001
                    st.error(f"Unexpected error: {e}")
                else:
                    # Persist to the intermediate store (best-effort; ignore failures here)
                    try:
                        api.create_upload(
                            doc_type="resume", filename=up_f.name, raw_text=text
                        )
                    except Exception:
                        pass
                    # Seed editor state
                    st.session_state["re_raw"] = text
                    st.session_state["re_title"] = (
                        up_f.name.rsplit(".", 1)[0] or "Uploaded Resume"
                    )
                    st.session_state["re_loaded_id"] = None
                    st.session_state["re_saved_id"] = None
                    st.session_state["editing_resume_id"] = None
                    # Run the simple parser right away
                    with st.spinner("Running simple parser…"):
                        try:
                            parsed = api.parse_resume_simple(text)
                            st.session_state["re_parsed"] = parsed
                        except Exception as e:  # noqa: BLE001
                            st.error(f"Parser failed: {e}")
                    st.success(
                        f"Loaded {len(text):,} characters from {up_f.name}. "
                        f"Review the fields below and click 'Save' when ready."
                    )
                    st.rerun()

    # ---- Parse step ----
    st.subheader("1. Paste resume text")
    raw = st.text_area("Raw text", value=st.session_state["re_raw"], height=200, key="re_raw_input")
    pc1, pc2 = st.columns(2)
    with pc1:
        if st.button("⚙️  Parse (simple)", use_container_width=True):
            with st.spinner("Parsing…"):
                try:
                    parsed = api.parse_resume_simple(raw)
                    st.session_state["re_parsed"] = parsed
                    st.session_state["re_raw"] = raw
                    st.success("Parsed.")
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))
    with pc2:
        if st.button("🤖  Parse (AI)", use_container_width=True, type="primary"):
            with st.spinner("AI parsing… this can take a minute"):
                try:
                    parsed = api.parse_resume_ai(raw)
                    st.session_state["re_parsed"] = parsed
                    st.session_state["re_raw"] = raw
                    st.success("AI-parsed.")
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))

    # ---- Edit step ----
    st.subheader("2. Edit structured fields")
    parsed = dict(st.session_state["re_parsed"])  # shallow copy

    c1, c2 = st.columns(2)
    with c1:
        parsed["name"] = st.text_input("Name", value=parsed.get("name", ""))
        parsed["email"] = st.text_input("Email", value=parsed.get("email", ""))
    with c2:
        parsed["linkedin"] = st.text_input("LinkedIn / URL", value=parsed.get("linkedin", ""))

    parsed["professional_summary"] = st.text_area(
        "Professional summary",
        value=parsed.get("professional_summary", ""),
        height=120,
    )

    skills_str = st.text_area(
        "Technical skills (one per line)",
        value="\n".join(parsed.get("technical_skills") or []),
        height=120,
    )
    parsed["technical_skills"] = [s.strip() for s in skills_str.splitlines() if s.strip()]

    with st.expander("Experiences (JSON)", expanded=False):
        exp_default = json.dumps(parsed.get("experiences") or [], indent=2)
        exp_text = st.text_area("Experiences JSON", value=exp_default, height=200, key="re_exp")
        try:
            parsed["experiences"] = json.loads(exp_text) if exp_text.strip() else []
        except json.JSONDecodeError as e:
            st.warning(f"Experiences JSON invalid: {e}")
    with st.expander("Projects (JSON)", expanded=False):
        proj_default = json.dumps(parsed.get("projects") or [], indent=2)
        proj_text = st.text_area("Projects JSON", value=proj_default, height=200, key="re_proj")
        try:
            parsed["projects"] = json.loads(proj_text) if proj_text.strip() else []
        except json.JSONDecodeError as e:
            st.warning(f"Projects JSON invalid: {e}")
    with st.expander("Education (JSON)", expanded=False):
        edu_default = json.dumps(parsed.get("education") or [], indent=2)
        edu_text = st.text_area("Education JSON", value=edu_default, height=160, key="re_edu")
        try:
            parsed["education"] = json.loads(edu_text) if edu_text.strip() else []
        except json.JSONDecodeError as e:
            st.warning(f"Education JSON invalid: {e}")

    st.session_state["re_parsed"] = parsed

    # ---- Save + download ----
    st.subheader("3. Save & download")
    s1, s2, s3 = st.columns(3)
    save_clicked = s1.button("💾  Save", type="primary", use_container_width=True)
    pdf_clicked = s2.button("📄  Download PDF", use_container_width=True)
    docx_clicked = s3.button("📝  Download DOCX", use_container_width=True)

    if save_clicked:
        payload = {"title": title or "Untitled", "raw_text": raw, "parsed_data": parsed}
        try:
            if st.session_state["re_saved_id"]:
                rec = api.update_resume(st.session_state["re_saved_id"], payload)
            else:
                rec = api.create_resume(payload)
                st.session_state["re_saved_id"] = rec["id"]
                st.session_state["editing_resume_id"] = rec["id"]
            st.success(f"Saved. id={rec['id'][:8]}…")
        except Exception as e:  # noqa: BLE001
            st.error(str(e))

    if pdf_clicked:
        try:
            data = api.download_pdf({"title": title or "Resume", "parsed_data": parsed})
            st.download_button("⬇️  Save PDF", data=data, file_name=f"{title or 'resume'}.pdf",
                               mime="application/pdf", use_container_width=True)
        except Exception as e:  # noqa: BLE001
            st.error(str(e))

    if docx_clicked:
        try:
            data = api.download_docx({"title": title or "Resume", "parsed_data": parsed})
            st.download_button("⬇️  Save DOCX", data=data, file_name=f"{title or 'resume'}.docx",
                               mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                               use_container_width=True)
        except Exception as e:  # noqa: BLE001
            st.error(str(e))

    if st.session_state.get("re_saved_id") and not rid:
        if st.button("🗑  Delete this resume", type="secondary"):
            try:
                api.delete_resume(st.session_state["re_saved_id"])
                st.session_state["re_saved_id"] = None
                st.session_state["editing_resume_id"] = None
                for k in ("re_title", "re_raw", "re_parsed", "re_loaded_id"):
                    st.session_state.pop(k, None)
                st.success("Deleted.")
                st.rerun()
            except Exception as e:  # noqa: BLE001
                st.error(str(e))

"""JD Editor — parse JD text, edit structured fields, save."""
from __future__ import annotations

import streamlit as st

import api_client as api


def _default_parsed() -> dict:
    return {
        "job_title": "",
        "company": "",
        "location": "",
        "must_have_skills": [],
        "good_to_have_skills": [],
        "experience_required": "",
        "salary_range": "",
        "job_type": "",
        "description": "",
    }


def _load_existing(jd_id: str) -> dict | None:
    try:
        return api.get_jd(jd_id)
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        return None


def render() -> None:
    st.header("💼 JD Editor")
    jid = st.session_state.get("editing_jd_id")

    try:
        jds = api.list_jds()
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        jds = []

    options = ["— New JD —"] + [f"{j['title']}  ({j['id'][:8]})" for j in jds]
    if jid:
        current_label = next(
            (options[i] for i, j in enumerate(jds, 1) if j["id"] == jid), options[0]
        )
    else:
        current_label = options[0]
    choice = st.selectbox("JD", options, index=options.index(current_label) if current_label in options else 0)
    if choice == options[0]:
        jid = None
        st.session_state["editing_jd_id"] = None
    else:
        idx = options.index(choice) - 1
        jid = jds[idx]["id"]
        st.session_state["editing_jd_id"] = jid

    if jid:
        rec = _load_existing(jid) or {}
    else:
        rec = {"title": "", "raw_text": "", "parsed_data": _default_parsed()}

    if "je_title" not in st.session_state or st.session_state.get("je_loaded_id") != jid:
        st.session_state["je_title"] = rec.get("title", "")
        st.session_state["je_raw"] = rec.get("raw_text", "")
        st.session_state["je_parsed"] = rec.get("parsed_data") or _default_parsed()
        st.session_state["je_loaded_id"] = jid
        st.session_state["je_saved_id"] = jid

    title = st.text_input("Title", value=st.session_state["je_title"], key="je_title_input")

    st.subheader("1. Paste job description text")
    raw = st.text_area("Raw text", value=st.session_state["je_raw"], height=200, key="je_raw_input")
    pc1, pc2 = st.columns(2)
    with pc1:
        if st.button("⚙️  Parse (simple)", use_container_width=True):
            with st.spinner("Parsing…"):
                try:
                    parsed = api.parse_jd_simple(raw)
                    st.session_state["je_parsed"] = parsed
                    st.session_state["je_raw"] = raw
                    st.success("Parsed.")
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))
    with pc2:
        if st.button("🤖  Parse (AI)", use_container_width=True, type="primary"):
            with st.spinner("AI parsing… this can take a minute"):
                try:
                    parsed = api.parse_jd_ai(raw)
                    st.session_state["je_parsed"] = parsed
                    st.session_state["je_raw"] = raw
                    st.success("AI-parsed.")
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))

    st.subheader("2. Edit structured fields")
    parsed = dict(st.session_state["je_parsed"])

    c1, c2 = st.columns(2)
    with c1:
        parsed["job_title"] = st.text_input("Job title", value=parsed.get("job_title", ""))
        parsed["company"] = st.text_input("Company", value=parsed.get("company", ""))
        parsed["location"] = st.text_input("Location", value=parsed.get("location", ""))
    with c2:
        parsed["experience_required"] = st.text_input("Experience required", value=parsed.get("experience_required", ""))
        parsed["salary_range"] = st.text_input("Salary range", value=parsed.get("salary_range", ""))
        parsed["job_type"] = st.text_input("Job type (Full-time / Part-time / Contract)", value=parsed.get("job_type", ""))

    parsed["description"] = st.text_area("Description", value=parsed.get("description", ""), height=160)

    c3, c4 = st.columns(2)
    with c3:
        must_str = st.text_area(
            "Must-have skills (one per line)",
            value="\n".join(parsed.get("must_have_skills") or []),
            height=120,
        )
        parsed["must_have_skills"] = [s.strip() for s in must_str.splitlines() if s.strip()]
    with c4:
        good_str = st.text_area(
            "Good-to-have skills (one per line)",
            value="\n".join(parsed.get("good_to_have_skills") or []),
            height=120,
        )
        parsed["good_to_have_skills"] = [s.strip() for s in good_str.splitlines() if s.strip()]

    st.session_state["je_parsed"] = parsed

    st.subheader("3. Save")
    if st.button("💾  Save JD", type="primary", use_container_width=True):
        payload = {"title": title or "Untitled JD", "raw_text": raw, "parsed_data": parsed}
        try:
            if st.session_state["je_saved_id"]:
                rec = api.update_jd(st.session_state["je_saved_id"], payload)
            else:
                rec = api.create_jd(payload)
                st.session_state["je_saved_id"] = rec["id"]
                st.session_state["editing_jd_id"] = rec["id"]
            st.success(f"Saved. id={rec['id'][:8]}…")
        except Exception as e:  # noqa: BLE001
            st.error(str(e))

    if st.session_state.get("je_saved_id") and not jid:
        if st.button("🗑  Delete this JD", type="secondary"):
            try:
                api.delete_jd(st.session_state["je_saved_id"])
                st.session_state["je_saved_id"] = None
                st.session_state["editing_jd_id"] = None
                for k in ("je_title", "je_raw", "je_parsed", "je_loaded_id"):
                    st.session_state.pop(k, None)
                st.success("Deleted.")
                st.rerun()
            except Exception as e:  # noqa: BLE001
                st.error(str(e))

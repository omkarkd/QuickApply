"""AI Resume Rewriter — pick a resume + JD, get a tailored rewrite + score."""
from __future__ import annotations

import streamlit as st

import api_client as api


def _pick(label: str, items: list[dict], key: str) -> dict | None:
    if not items:
        st.info(f"No {label.lower()}s yet.")
        return None
    options = [f"{it['title']}  ({it['id'][:8]})" for it in items]
    choice = st.selectbox(label, options, key=key)
    idx = options.index(choice)
    return items[idx]


def render() -> None:
    st.header("✨ AI Resume Rewriter")
    st.caption("Pick a resume and a JD — the AI tailors the resume to the role and shows before/after match scores.")

    try:
        resumes = api.list_resumes()
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        resumes = []
    try:
        jds = api.list_jds()
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        jds = []

    c1, c2 = st.columns(2)
    with c1:
        resume = _pick("Resume", resumes, "rw_resume")
    with c2:
        jd = _pick("Job description", jds, "rw_jd")

    if not resume or not jd:
        return

    use_full = st.checkbox(
        "Use full parsed content (otherwise uses raw text)",
        value=True,
        help="If the resume was parsed, the AI will work from the structured fields.",
    )
    if use_full and resume.get("parsed_data"):
        resume_text = _resume_from_parsed(resume)
    else:
        resume_text = resume.get("raw_text", "")

    if use_full and jd.get("parsed_data"):
        jd_text = _jd_from_parsed(jd)
    else:
        jd_text = jd.get("raw_text", "")

    if st.button("🚀  Rewrite resume", type="primary", use_container_width=True):
        with st.spinner("AI is rewriting… this can take 1–2 minutes"):
            try:
                result = api.rewrite_resume(resume_text=resume_text, jd_text=jd_text)
                st.session_state["rw_result"] = result
            except Exception as e:  # noqa: BLE001
                st.error(str(e))

    result = st.session_state.get("rw_result")
    if not result:
        return

    st.divider()
    c1, c2, c3 = st.columns(3)
    c1.metric("Match score (before)", f"{result.get('score_before', 0):.1f}")
    c2.metric("Match score (after)", f"{result.get('score_after', 0):.1f}")
    delta = (result.get("score_after", 0) - result.get("score_before", 0))
    c3.metric("Δ Improvement", f"{delta:+.1f}")

    st.subheader("Improvements")
    for imp in result.get("improvements") or []:
        st.markdown(f"- {imp}")

    st.subheader("Rewritten resume")
    rewritten = result.get("rewritten_resume", "")
    st.text_area("Copy this text", value=rewritten, height=400)
    st.download_button(
        "⬇️  Download as .txt",
        data=rewritten.encode("utf-8"),
        file_name=f"{resume['title']}_tailored.txt",
        mime="text/plain",
        use_container_width=True,
    )


def _resume_from_parsed(r: dict) -> str:
    p = r.get("parsed_data") or {}
    parts = [p.get("name", ""), p.get("email", ""), p.get("linkedin", "")]
    parts = [x for x in parts if x]
    parts.append("\n--- Summary ---\n" + (p.get("professional_summary") or ""))
    if p.get("technical_skills"):
        parts.append("\n--- Skills ---\n" + ", ".join(p["technical_skills"]))
    if p.get("experiences"):
        parts.append("\n--- Experience ---")
        for e in p["experiences"]:
            parts.append(str(e))
    if p.get("projects"):
        parts.append("\n--- Projects ---")
        for proj in p["projects"]:
            parts.append(str(proj))
    if p.get("education"):
        parts.append("\n--- Education ---")
        for ed in p["education"]:
            parts.append(str(ed))
    return "\n".join([x for x in parts if x])


def _jd_from_parsed(j: dict) -> str:
    p = j.get("parsed_data") or {}
    parts = [p.get("job_title", ""), p.get("company", "")]
    parts = [x for x in parts if x]
    parts.append("\n--- Description ---\n" + (p.get("description") or ""))
    if p.get("must_have_skills"):
        parts.append("\nMust-have: " + ", ".join(p["must_have_skills"]))
    if p.get("good_to_have_skills"):
        parts.append("Good-to-have: " + ", ".join(p["good_to_have_skills"]))
    if p.get("experience_required"):
        parts.append(f"Experience: {p['experience_required']}")
    return "\n".join([x for x in parts if x])

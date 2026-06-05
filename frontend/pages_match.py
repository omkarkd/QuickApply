"""Match Score — pick a resume + JD, get a 0-100 score with breakdown."""
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
    st.header("🎯 Match Score")
    st.caption("Score a resume against a job description. The AI returns an overall score plus a per-dimension breakdown.")

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
        resume = _pick("Resume", resumes, "ms_resume")
    with c2:
        jd = _pick("Job description", jds, "ms_jd")

    if not resume or not jd:
        return

    if st.button("🎯  Score match", type="primary", use_container_width=True):
        with st.spinner("Scoring…"):
            try:
                result = api.match_score(
                    resume_text=resume.get("raw_text", ""),
                    jd_text=jd.get("raw_text", ""),
                )
                st.session_state["ms_result"] = result
            except Exception as e:  # noqa: BLE001
                st.error(str(e))

    result = st.session_state.get("ms_result")
    if not result:
        return

    overall = float(result.get("overall_score", 0))
    st.divider()

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Overall", f"{overall:.1f}")
    m2.metric("Keywords", f"{float(result.get('keywords_score', 0)):.1f}")
    m3.metric("Alignment", f"{float(result.get('alignment_score', 0)):.1f}")
    m4.metric("RPM", f"{float(result.get('rpm_score', 0)):.1f}")

    st.progress(min(overall / 100.0, 1.0))

    c1, c2 = st.columns(2)
    with c1:
        st.subheader("✅ Present keywords")
        for k in result.get("present_keywords") or []:
            st.markdown(f"- {k}")
    with c2:
        st.subheader("❌ Missing keywords")
        for k in result.get("missing_keywords") or []:
            st.markdown(f"- {k}")

    details = result.get("keyword_details") or []
    if details:
        with st.expander("Keyword details", expanded=False):
            for d in details:
                mark = "✅" if d.get("present") else "❌"
                ctx = d.get("context") or ""
                st.markdown(f"{mark} **{d.get('keyword','')}**" + (f" — _{ctx}_" if ctx else ""))

    st.subheader("💡 Suggestions")
    for s in result.get("suggestions") or []:
        st.markdown(f"- {s}")

"""JD List — browse + delete JDs."""
from __future__ import annotations

import streamlit as st

import api_client as api


@st.cache_data(ttl=10, show_spinner=False)
def _fetch(_uid: str) -> list[dict]:
    return api.list_jds()


def render() -> None:
    st.header("📋 Job Descriptions")
    user = st.session_state.get("user", {}) or {}
    if st.button("🔄  Refresh"):
        _fetch.clear()
        st.rerun()

    try:
        jds = _fetch(user.get("id", "anon"))
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        jds = []

    if not jds:
        st.info("No JDs yet. Create one in **JD Editor**.")
        return

    for j in jds:
        with st.container(border=True):
            c1, c2, c3 = st.columns([4, 1, 1])
            c1.markdown(f"### {j.get('title','(untitled)')}")
            c1.caption(
                f"Created {j.get('created_at','')[:19].replace('T',' ')} · "
                f"Updated {j.get('updated_at','')[:19].replace('T',' ')}"
            )
            if c2.button("✏️  Edit", key=f"jledit_{j['id']}", use_container_width=True):
                st.session_state["editing_jd_id"] = j["id"]
                st.session_state["nav"] = "jd_editor"
                st.rerun()
            if c3.button("🗑  Delete", key=f"jldel_{j['id']}", use_container_width=True):
                try:
                    api.delete_jd(j["id"])
                    _fetch.clear()
                    st.success(f"Deleted '{j.get('title')}'.")
                    st.rerun()
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))

            pd = j.get("parsed_data") or {}
            if pd:
                cols = st.columns(3)
                cols[0].markdown(
                    f"**Company:** {pd.get('company','—')}<br>"
                    f"**Location:** {pd.get('location','—')}",
                    unsafe_allow_html=True,
                )
                cols[1].markdown(
                    f"**Type:** {pd.get('job_type','—')}<br>"
                    f"**Experience:** {pd.get('experience_required','—')}",
                    unsafe_allow_html=True,
                )
                cols[2].markdown(
                    f"**Must-have:** {len(pd.get('must_have_skills') or [])} · "
                    f"**Good-to-have:** {len(pd.get('good_to_have_skills') or [])}",
                )

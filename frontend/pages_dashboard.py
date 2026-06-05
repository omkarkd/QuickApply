"""Dashboard — list user's resumes + JDs, quick links to create."""
from __future__ import annotations

import streamlit as st

import api_client as api


@st.cache_data(ttl=15, show_spinner=False)
def _fetch_resumes(_user_id: str) -> list[dict]:
    return api.list_resumes()


@st.cache_data(ttl=15, show_spinner=False)
def _fetch_jds(_user_id: str) -> list[dict]:
    return api.list_jds()


def render() -> None:
    st.header("📊 Dashboard")
    user = st.session_state.get("user", {}) or {}
    st.caption(f"Signed in as **{user.get('name','')}**")

    c1, c2 = st.columns(2)

    with c1:
        st.subheader("📄 Resumes")
        try:
            resumes = _fetch_resumes(user.get("id", "anon"))
        except Exception as e:  # noqa: BLE001
            st.error(str(e))
            resumes = []
        if not resumes:
            st.info("No resumes yet. Create one in **Resume Editor**.")
        else:
            for r in resumes:
                with st.container(border=True):
                    tcol, acol = st.columns([3, 1])
                    tcol.markdown(f"**{r.get('title','(untitled)')}**")
                    tcol.caption(f"Updated {r.get('updated_at','')[:19].replace('T',' ')}")
                    if acol.button("Open", key=f"open_resume_{r['id']}", use_container_width=True):
                        st.session_state["editing_resume_id"] = r["id"]
                        st.session_state["nav"] = "resume_editor"
                        st.rerun()
        st.link_button("➕  New resume", "#", disabled=True) if False else None
        if st.button("➕  New resume", use_container_width=True, type="primary"):
            st.session_state["editing_resume_id"] = None
            st.session_state["nav"] = "resume_editor"
            st.rerun()

    with c2:
        st.subheader("💼 Job Descriptions")
        try:
            jds = _fetch_jds(user.get("id", "anon"))
        except Exception as e:  # noqa: BLE001
            st.error(str(e))
            jds = []
        if not jds:
            st.info("No JDs yet. Create one in **JD Editor**.")
        else:
            for j in jds:
                with st.container(border=True):
                    tcol, acol = st.columns([3, 1])
                    tcol.markdown(f"**{j.get('title','(untitled)')}**")
                    tcol.caption(f"Updated {j.get('updated_at','')[:19].replace('T',' ')}")
                    if acol.button("Open", key=f"open_jd_{j['id']}", use_container_width=True):
                        st.session_state["editing_jd_id"] = j["id"]
                        st.session_state["nav"] = "jd_editor"
                        st.rerun()
        if st.button("➕  New JD", use_container_width=True, type="primary"):
            st.session_state["editing_jd_id"] = None
            st.session_state["nav"] = "jd_editor"
            st.rerun()

    st.divider()
    st.subheader("🚀 Quick actions")
    a, b, c = st.columns(3)
    if a.button("✨ Rewrite a resume", use_container_width=True):
        st.session_state["nav"] = "rewriter"
        st.rerun()
    if b.button("🎯 Match score", use_container_width=True):
        st.session_state["nav"] = "match"
        st.rerun()
    if c.button("⚙️  Telegram settings", use_container_width=True):
        st.session_state["nav"] = "telegram"
        st.rerun()

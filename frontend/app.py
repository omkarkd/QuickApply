"""
QuickResume — single-file Streamlit app.

Run:
    streamlit run app.py

The 9 pages are defined as functions below and selected via st.sidebar.radio.
The Streamlit multi-page-routing convention (pages/N_Name.py) was avoided so the
whole UI lives in one tree and one file for easy review.
"""
from __future__ import annotations

import streamlit as st

import auth
import pages_dashboard, pages_editor_resume, pages_editor_jd
import pages_jd_list, pages_rewriter, pages_match, pages_telegram  # noqa: F401
import pages_upload  # noqa: F401  -- new, additive


st.set_page_config(
    page_title="QuickResume",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)


# Custom CSS — minor brand polish; Streamlit's defaults are fine for the rest
st.markdown(
    """
    <style>
      .stApp header { background: transparent; }
      .block-container { padding-top: 2rem; max-width: 1100px; }
      h1 { font-weight: 800; letter-spacing: -0.02em; }
      h2 { font-weight: 700; letter-spacing: -0.01em; }
      .stButton>button { font-weight: 600; }
    </style>
    """,
    unsafe_allow_html=True,
)


PAGES_AUTHED = [
    ("📊 Dashboard",     "dashboard",     pages_dashboard.render),
    ("📤 Upload",        "upload",        pages_upload.render),
    ("📝 Resume Editor", "resume_editor", pages_editor_resume.render),
    ("💼 JD Editor",     "jd_editor",     pages_editor_jd.render),
    ("📋 JD List",       "jd_list",       pages_jd_list.render),
    ("✨ Rewriter",      "rewriter",      pages_rewriter.render),
    ("🎯 Match Score",   "match",         pages_match.render),
    ("⚙️  Telegram",     "telegram",      pages_telegram.render),
]


def render_landing() -> None:
    st.title("QuickResume")
    st.subheader("Parse, edit, score, and rewrite resumes against job descriptions — in one place.")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("### 📝 Smart parsing\nDrop in raw text. We structure it.")
    with c2:
        st.markdown("### 🎯 Match scoring\nSee how a resume fits a JD, with a breakdown.")
    with c3:
        st.markdown("### ✨ AI rewriting\nTailor a resume to a specific role.")
    st.divider()
    user = auth.current_user()
    if user:
        st.success(f"Signed in as **{user.get('name','')}** ({user.get('email','')}).")
        if st.button("Go to dashboard →", type="primary"):
            st.session_state["nav"] = "dashboard"
            st.rerun()
    else:
        st.info("Sign in or create an account to start.")
        col_l, col_s = st.columns(2)
        with col_l:
            if st.button("Sign in", type="primary", use_container_width=True):
                st.session_state["auth_view"] = "login"
                st.rerun()
        with col_s:
            if st.button("Create account", use_container_width=True):
                st.session_state["auth_view"] = "signup"
                st.rerun()
        _render_inline_auth()


def _render_inline_auth() -> None:
    st.divider()
    view = st.session_state.get("auth_view", "login")
    tabs = st.tabs(["Sign in", "Create account"])
    with tabs[0]:
        _login_form()
    with tabs[1]:
        _signup_form()


def _login_form() -> None:
    with st.form("inline_login", clear_on_submit=False):
        email = st.text_input("Email", key="in_email")
        password = st.text_input("Password", type="password", key="in_pw")
        ok = st.form_submit_button("Sign in", type="primary", use_container_width=True)
    if ok:
        try:
            auth.do_login(email=email, password=password)
            st.session_state["nav"] = "dashboard"
            st.rerun()
        except Exception as e:  # noqa: BLE001
            st.error(str(e))


def _signup_form() -> None:
    with st.form("inline_signup", clear_on_submit=False):
        name = st.text_input("Full name", key="in_su_name")
        email = st.text_input("Email", key="in_su_email")
        password = st.text_input("Password", type="password", key="in_su_pw")
        password2 = st.text_input("Confirm password", type="password", key="in_su_pw2")
        ok = st.form_submit_button("Create account", type="primary", use_container_width=True)
    if ok:
        if password != password2:
            st.error("Passwords don't match.")
        elif len(password) < 6:
            st.error("Password must be at least 6 characters.")
        else:
            try:
                auth.do_signup(name=name, email=email, password=password)
                st.session_state["nav"] = "dashboard"
                st.rerun()
            except Exception as e:  # noqa: BLE001
                st.error(str(e))


def main() -> None:
    if "nav" not in st.session_state:
        st.session_state["nav"] = "landing"

    # Sidebar nav
    with st.sidebar:
        st.title("QuickResume")
        user = auth.current_user()
        if user:
            st.caption(f"Signed in as **{user.get('name','?')}**")
            labels = [p[0] for p in PAGES_AUTHED] + ["🏠 Home"]
            keys = [p[1] for p in PAGES_AUTHED] + ["landing"]
            current = st.session_state["nav"]
            try:
                idx = keys.index(current)
            except ValueError:
                idx = 0
            choice = st.radio("Navigation", labels, index=idx, label_visibility="collapsed")
            st.session_state["nav"] = keys[labels.index(choice)]
            st.divider()
            auth.render_logout_button()
        else:
            st.caption("Not signed in.")
            st.session_state["nav"] = "landing"

    # Route
    nav = st.session_state["nav"]
    if nav == "landing":
        render_landing()
        return

    # All other pages require auth
    auth.require_auth()
    for label, key, fn in PAGES_AUTHED:
        if key == nav:
            fn()
            return
    # Fallback
    render_landing()


if __name__ == "__main__":
    main()

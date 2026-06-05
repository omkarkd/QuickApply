"""
Streamlit auth helpers.

Session state keys we own:
  * `token`     — JWT string returned by /auth/login
  * `user`      — dict returned by /auth/me ({id, name, email})
  * `auth_view` — "login" | "signup", used by the home page when logged out
"""
from __future__ import annotations

import streamlit as st

import api_client as api


def is_logged_in() -> bool:
    return bool(st.session_state.get("token"))


def current_user() -> dict | None:
    return st.session_state.get("user")


def do_login(email: str, password: str) -> None:
    """Call backend /auth/login, store token, fetch /auth/me."""
    resp = api.login(email=email, password=password)
    token = resp.get("session_token") or resp.get("access_token") or resp.get("token")
    if not token:
        raise RuntimeError(f"Login succeeded but no token in response: {resp}")
    st.session_state["token"] = token
    # The login response also embeds the user object — use it to avoid an extra /me call
    user_obj = resp.get("user")
    if user_obj:
        st.session_state["user"] = user_obj
    else:
        st.session_state["user"] = api.me()
    st.session_state.pop("auth_view", None)
    st.toast(f"Welcome back, {st.session_state['user'].get('name', '')}!", icon="✅")


def do_signup(name: str, email: str, password: str) -> None:
    api.register(name=name, email=email, password=password)
    # Auto-login after successful signup
    do_login(email=email, password=password)


def do_logout() -> None:
    api.logout()
    for k in ("token", "user"):
        st.session_state.pop(k, None)
    st.session_state["auth_view"] = "login"
    st.toast("Signed out.", icon="👋")


def require_auth() -> dict:
    """
    Call as the first line of every protected page. Returns the current user.
    If not logged in, shows the auth form and stops the script.
    """
    if not is_logged_in():
        st.warning("Please sign in to continue.")
        # Inline auth UI — same as the Login page, but in-place
        _render_auth_form()
        st.stop()
    return current_user()


def _render_auth_form() -> None:
    view = st.session_state.get("auth_view", "login")
    tab_login, tab_signup = st.tabs(["Sign in", "Create account"])
    with tab_login:
        with st.form("login_form", clear_on_submit=True):
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_pw")
            submitted = st.form_submit_button("Sign in", use_container_width=True)
        if submitted:
            try:
                do_login(email=email, password=password)
                st.rerun()
            except Exception as e:  # noqa: BLE001
                st.error(str(e))
    with tab_signup:
        with st.form("signup_form", clear_on_submit=True):
            name = st.text_input("Full name", key="su_name")
            email = st.text_input("Email", key="su_email")
            password = st.text_input("Password", type="password", key="su_pw")
            password2 = st.text_input("Confirm password", type="password", key="su_pw2")
            submitted = st.form_submit_button("Create account", use_container_width=True)
        if submitted:
            if password != password2:
                st.error("Passwords don't match.")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters.")
            else:
                try:
                    do_signup(name=name, email=email, password=password)
                    st.rerun()
                except Exception as e:  # noqa: BLE001
                    st.error(str(e))


def render_logout_button() -> None:
    """Small 'Sign out' button — call from the sidebar."""
    if st.sidebar.button("Sign out", use_container_width=True):
        do_logout()
        st.rerun()

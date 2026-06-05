"""
Thin httpx-based client for the QuickApply FastAPI backend.

Streamlit pages call these helpers instead of issuing HTTP directly so that:
  * JWT is read from session_state and attached as `Authorization: Bearer …`
  * 401 responses clear auth and trigger a re-login
  * Errors are converted into user-friendly st.toast() messages
"""
from __future__ import annotations

import os
from typing import Any, Optional

import httpx
import streamlit as st


def _backend_url() -> str:
    # Allow override at app launch: BACKEND_URL=http://host:port streamlit run …
    return os.environ.get("BACKEND_URL", "http://localhost:8001")


def _api_prefix() -> str:
    return os.environ.get("API_PREFIX", "/api")


def _headers() -> dict[str, str]:
    h: dict[str, str] = {"Accept": "application/json"}
    token: Optional[str] = st.session_state.get("token")
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def _url(path: str) -> str:
    # Accept both "/auth/login" and "auth/login"
    if not path.startswith("/"):
        path = "/" + path
    return f"{_backend_url()}{_api_prefix()}{path}"


def _handle(resp: httpx.Response) -> Any:
    """Raise a friendly st.error on non-2xx, return parsed JSON otherwise."""
    if resp.status_code == 401:
        # Token expired or invalid — clear and force re-login
        for k in ("token", "user"):
            st.session_state.pop(k, None)
        st.toast("Session expired. Please log in again.", icon="🔒")
        st.stop()
    if resp.status_code >= 400:
        # Try to surface a FastAPI `detail` field
        try:
            detail = resp.json().get("detail") or resp.text
        except Exception:  # noqa: BLE001
            detail = resp.text
        raise RuntimeError(f"{resp.status_code} — {detail}")
    if resp.status_code == 204 or not resp.content:
        return None
    return resp.json()


# ---------- Auth ----------
def register(name: str, email: str, password: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.post(_url("/auth/register"),
                   json={"name": name, "email": email, "password": password})
    return _handle(r)


def login(email: str, password: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.post(_url("/auth/login"),
                   json={"email": email, "password": password})
    return _handle(r)


def me() -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url("/auth/me"), headers=_headers())
    return _handle(r)


def logout() -> None:
    try:
        with httpx.Client(timeout=15) as c:
            c.post(_url("/auth/logout"), headers=_headers())
    except Exception:  # noqa: BLE001
        pass


# ---------- Resume parsing ----------
def parse_resume_simple(text: str) -> dict:
    with httpx.Client(timeout=60) as c:
        r = c.post(_url("/parse/simple"), json={"text": text})
    return _handle(r)


def parse_resume_ai(text: str) -> dict:
    with httpx.Client(timeout=180) as c:
        r = c.post(_url("/parse/ai"), json={"text": text})
    return _handle(r)


# ---------- JD parsing ----------
def parse_jd_simple(text: str) -> dict:
    with httpx.Client(timeout=60) as c:
        r = c.post(_url("/parse/jd/simple"), json={"text": text})
    return _handle(r)


def parse_jd_ai(text: str) -> dict:
    with httpx.Client(timeout=180) as c:
        r = c.post(_url("/parse/jd/ai"), json={"text": text})
    return _handle(r)


# ---------- Resumes CRUD ----------
def list_resumes() -> list[dict]:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url("/resumes"), headers=_headers())
    return _handle(r) or []


def get_resume(resume_id: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url(f"/resumes/{resume_id}"), headers=_headers())
    return _handle(r)


def create_resume(payload: dict) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.post(_url("/resumes"), json=payload, headers=_headers())
    return _handle(r)


def update_resume(resume_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.put(_url(f"/resumes/{resume_id}"), json=payload, headers=_headers())
    return _handle(r)


def delete_resume(resume_id: str) -> None:
    with httpx.Client(timeout=30) as c:
        r = c.delete(_url(f"/resumes/{resume_id}"), headers=_headers())
    _handle(r)


# ---------- JDs CRUD ----------
def list_jds() -> list[dict]:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url("/jds"), headers=_headers())
    return _handle(r) or []


def get_jd(jd_id: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url(f"/jds/{jd_id}"), headers=_headers())
    return _handle(r)


def create_jd(payload: dict) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.post(_url("/jds"), json=payload, headers=_headers())
    return _handle(r)


def update_jd(jd_id: str, payload: dict) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.put(_url(f"/jds/{jd_id}"), json=payload, headers=_headers())
    return _handle(r)


def delete_jd(jd_id: str) -> None:
    with httpx.Client(timeout=30) as c:
        r = c.delete(_url(f"/jds/{jd_id}"), headers=_headers())
    _handle(r)


# ---------- AI features ----------
def rewrite_resume(resume_text: str, jd_text: str) -> dict:
    with httpx.Client(timeout=300) as c:
        r = c.post(_url("/rewrite-resume"),
                   json={"resume_text": resume_text, "jd_text": jd_text},
                   headers=_headers())
    return _handle(r)


def match_score(resume_text: str, jd_text: str) -> dict:
    with httpx.Client(timeout=300) as c:
        r = c.post(_url("/match-score"),
                   json={"resume_text": resume_text, "jd_text": jd_text},
                   headers=_headers())
    return _handle(r)


# ---------- Downloads ----------
def download_pdf(resume_data: dict) -> bytes:
    with httpx.Client(timeout=60) as c:
        r = c.post(_url("/download/pdf"), json=resume_data, headers=_headers())
    if r.status_code >= 400:
        raise RuntimeError(f"{r.status_code} — {r.text[:200]}")
    return r.content


def download_docx(resume_data: dict) -> bytes:
    with httpx.Client(timeout=60) as c:
        r = c.post(_url("/download/docx"), json=resume_data, headers=_headers())
    if r.status_code >= 400:
        raise RuntimeError(f"{r.status_code} — {r.text[:200]}")
    return r.content


# ---------- Telegram ----------
def get_telegram_settings() -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url("/telegram/settings"), headers=_headers())
    return _handle(r)


def put_telegram_settings(bot_token: str, chat_id: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.put(_url("/telegram/settings"),
                  json={"bot_token": bot_token, "chat_id": chat_id},
                  headers=_headers())
    return _handle(r)


# ---------- Uploads (intermediate store for the Upload page) ----------
def create_upload(doc_type: str, filename: str, raw_text: str) -> dict:
    """Save extracted text from the Upload page. doc_type is 'resume' or 'jd'."""
    with httpx.Client(timeout=30) as c:
        r = c.post(_url("/uploads"),
                   json={"doc_type": doc_type, "filename": filename, "raw_text": raw_text},
                   headers=_headers())
    return _handle(r)


def list_uploads() -> list[dict]:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url("/uploads"), headers=_headers())
    return _handle(r) or []


def get_upload(upload_id: str) -> dict:
    with httpx.Client(timeout=30) as c:
        r = c.get(_url(f"/uploads/{upload_id}"), headers=_headers())
    return _handle(r)

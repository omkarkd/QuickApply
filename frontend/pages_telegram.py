"""Telegram settings — store bot token + chat_id for /start and notification delivery."""
from __future__ import annotations

import streamlit as st

import api_client as api


def render() -> None:
    st.header("⚙️  Telegram Settings")
    st.caption(
        "Connect a Telegram bot to receive new-job alerts and forward parsed resumes/JDs. "
        "Message your bot, then paste the chat_id you receive."
    )

    try:
        s = api.get_telegram_settings() or {}
    except Exception as e:  # noqa: BLE001
        st.error(str(e))
        return

    cur_token = s.get("bot_token") or ""
    cur_chat = s.get("chat_id") or ""
    cur_active = bool(s.get("is_active"))

    with st.form("tg_form"):
        token = st.text_input(
            "Bot token (from @BotFather)",
            value=cur_token,
            type="password",
            help="Looks like: 123456789:ABCdefGhIJKlmnOPQrstUVwxYZ",
        )
        chat_id = st.text_input(
            "Chat ID",
            value=cur_chat,
            help="Send /start to your bot, then check the server logs or @userinfobot for your chat id.",
        )
        active = st.checkbox("Enabled", value=cur_active)
        ok = st.form_submit_button("💾  Save", use_container_width=True)

    if ok:
        try:
            api.put_telegram_settings(bot_token=token, chat_id=chat_id)
            # The PUT model only carries bot_token in the backend; is_active is toggled there
            st.success("Telegram settings saved.")
        except Exception as e:  # noqa: BLE001
            st.error(str(e))

    st.divider()
    st.subheader("How to get these values")
    st.markdown(
        """
1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts. Copy the **token** it gives you.
2. In a new chat with your bot, send `/start`. Your chat_id appears in the bot's incoming-message log
   (or use **@userinfobot** from any chat to find your own user id).
3. Paste both above and save. The backend will use this bot when delivering /start-triggered flows.
        """
    )

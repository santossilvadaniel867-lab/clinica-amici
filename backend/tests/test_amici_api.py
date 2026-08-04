"""Backend API tests for Clínica ÂMICI (content, auth, chat, admin content persistence)."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://skills-gallery-15.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "admin@clinicamici.com"
ADMIN_PASSWORD = "Amiciadmin2026"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and isinstance(data["token"], str) and data["token"]
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


# ---------------- Content (public) ----------------
class TestContent:
    def test_get_content_public(self, api):
        r = api.get(f"{BASE_URL}/api/content", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for key in ("brand", "hero", "gallery", "results", "testimonials", "history", "assistant", "contact"):
            assert key in d, f"missing section {key}"
        assert isinstance(d["brand"], dict)
        assert d["brand"].get("name")


# ---------------- Auth ----------------
class TestAuth:
    def test_login_wrong_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_token(self, api, token):
        r = api.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------------- Content persistence ----------------
class TestContentPersistence:
    def test_put_content_and_verify(self, api, token):
        # Fetch current content
        r = api.get(f"{BASE_URL}/api/content", timeout=30)
        assert r.status_code == 200
        current = r.json()
        original_tagline = current["brand"].get("tagline", "")
        new_tagline = "TEST_TAGLINE_persist_check"
        current["brand"]["tagline"] = new_tagline

        # PUT
        r2 = api.put(f"{BASE_URL}/api/content", json=current,
                     headers={"Authorization": f"Bearer {token}"}, timeout=30)
        assert r2.status_code == 200, r2.text
        assert r2.json().get("ok") is True

        # GET and verify persistence
        r3 = api.get(f"{BASE_URL}/api/content", timeout=30)
        assert r3.status_code == 200
        assert r3.json()["brand"]["tagline"] == new_tagline

        # Restore
        current["brand"]["tagline"] = original_tagline
        api.put(f"{BASE_URL}/api/content", json=current,
                headers={"Authorization": f"Bearer {token}"}, timeout=30)

    def test_put_content_requires_auth(self):
        # fresh session to avoid inherited cookies from login
        r = requests.put(f"{BASE_URL}/api/content", json={"brand": {"name": "X"}}, timeout=30)
        assert r.status_code == 401


# ---------------- AI Chat ----------------
class TestChat:
    def test_chat_pt_br(self, api):
        r = api.post(f"{BASE_URL}/api/chat",
                     json={"message": "Quais procedimentos a Dra. Alice faz?", "session_id": "qa-test"},
                     timeout=90)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        d = r.json()
        assert "reply" in d and isinstance(d["reply"], str) and len(d["reply"].strip()) > 0
        assert d.get("session_id") == "qa-test"

    def test_chat_empty_message(self, api):
        r = api.post(f"{BASE_URL}/api/chat", json={"message": "", "session_id": "qa-test"}, timeout=30)
        assert r.status_code == 400

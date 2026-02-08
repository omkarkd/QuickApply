"""
Backend API Tests for Resume Formatter App - New Features
Tests the Match Score and Resume Rewriter endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials - will be used for authentication
TEST_USER_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "Test User"


class TestHealthAndBasicEndpoints:
    """Basic endpoint health tests"""
    
    def test_api_base_accessible(self):
        """Test if API base is accessible"""
        response = requests.get(f"{BASE_URL}/api/resumes", timeout=10)
        # 401 expected without auth
        assert response.status_code in [401, 200]
        print(f"API base accessible, status: {response.status_code}")
    
    def test_parse_simple_endpoint(self):
        """Test simple parsing endpoint (no auth required)"""
        response = requests.post(
            f"{BASE_URL}/api/parse/simple",
            json={"text": "John Doe\njohn@email.com\nSkills: Python, React"},
            timeout=10
        )
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        print(f"Simple parsing works, name: {data.get('name')}")


class TestAuthFlow:
    """Authentication flow tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Register a test user
        register_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
        )
        
        if register_response.status_code == 200:
            data = register_response.json()
            session_token = data.get("session_token")
            session.headers.update({"Authorization": f"Bearer {session_token}"})
            print(f"Registered and authenticated as: {TEST_USER_EMAIL}")
        elif register_response.status_code == 400:
            # User already exists, login instead
            login_response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
            )
            if login_response.status_code == 200:
                data = login_response.json()
                session_token = data.get("session_token")
                session.headers.update({"Authorization": f"Bearer {session_token}"})
                print(f"Logged in as: {TEST_USER_EMAIL}")
            else:
                pytest.skip(f"Could not authenticate: {login_response.text}")
        else:
            pytest.skip(f"Could not register: {register_response.text}")
        
        return session
    
    def test_get_current_user(self, auth_session):
        """Test get current user endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        print(f"Authenticated user: {data.get('email')}")


class TestMatchScoreAPI:
    """Match Score endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session for match score tests"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        unique_email = f"match_test_{uuid.uuid4().hex[:8]}@example.com"
        
        register_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "matchtest123",
                "name": "Match Test User"
            }
        )
        
        if register_response.status_code == 200:
            data = register_response.json()
            session_token = data.get("session_token")
            session.headers.update({"Authorization": f"Bearer {session_token}"})
        else:
            pytest.skip(f"Auth failed: {register_response.text}")
        
        return session
    
    def test_match_score_unauthorized(self):
        """Test match-score returns 401 without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/match-score",
            json={
                "resume_text": "John Doe - Python Developer",
                "jd_text": "Looking for Python Developer"
            }
        )
        assert response.status_code == 401
        print("Match score correctly requires authentication")
    
    def test_match_score_success(self, auth_session):
        """Test match-score returns proper score breakdown"""
        resume_text = """
        John Doe
        Senior Software Engineer
        
        Skills: Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes
        
        Experience:
        - Led development of microservices architecture, reducing latency by 40%
        - Implemented CI/CD pipelines, improving deployment frequency by 200%
        - Managed team of 5 engineers
        """
        
        jd_text = """
        Senior Software Engineer
        
        Requirements:
        - 5+ years experience with Python and JavaScript
        - Experience with React and Node.js
        - Knowledge of AWS, Docker, and Kubernetes
        - CI/CD experience
        - Team leadership experience
        
        Nice to have:
        - Machine Learning experience
        - Go language
        """
        
        response = auth_session.post(
            f"{BASE_URL}/api/match-score",
            json={"resume_text": resume_text, "jd_text": jd_text},
            timeout=60  # LLM calls can be slow
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields in response
        assert "overall_score" in data, "Missing overall_score"
        assert "keywords_score" in data, "Missing keywords_score"
        assert "alignment_score" in data, "Missing alignment_score"
        assert "rpm_score" in data, "Missing rpm_score"
        assert "present_keywords" in data, "Missing present_keywords"
        assert "missing_keywords" in data, "Missing missing_keywords"
        
        # Verify score types
        assert isinstance(data["overall_score"], (int, float))
        assert isinstance(data["keywords_score"], (int, float))
        assert isinstance(data["alignment_score"], (int, float))
        assert isinstance(data["rpm_score"], (int, float))
        
        # Verify keyword lists
        assert isinstance(data["present_keywords"], list)
        assert isinstance(data["missing_keywords"], list)
        
        print(f"Match Score Response:")
        print(f"  Overall Score: {data['overall_score']}")
        print(f"  Keywords Score: {data['keywords_score']}")
        print(f"  Alignment Score: {data['alignment_score']}")
        print(f"  RPM Score: {data['rpm_score']}")
        print(f"  Present Keywords: {data['present_keywords'][:5]}...")
        print(f"  Missing Keywords: {data['missing_keywords'][:5]}...")
    
    def test_match_score_empty_input(self, auth_session):
        """Test match-score with empty inputs"""
        response = auth_session.post(
            f"{BASE_URL}/api/match-score",
            json={"resume_text": "", "jd_text": ""}
        )
        # Should either return 422 validation error or handle gracefully
        assert response.status_code in [422, 400, 500]
        print(f"Empty input handled with status: {response.status_code}")


class TestRewriteResumeAPI:
    """Resume Rewriter endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session for rewrite tests"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        unique_email = f"rewrite_test_{uuid.uuid4().hex[:8]}@example.com"
        
        register_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "rewritetest123",
                "name": "Rewrite Test User"
            }
        )
        
        if register_response.status_code == 200:
            data = register_response.json()
            session_token = data.get("session_token")
            session.headers.update({"Authorization": f"Bearer {session_token}"})
        else:
            pytest.skip(f"Auth failed: {register_response.text}")
        
        return session
    
    def test_rewrite_resume_unauthorized(self):
        """Test rewrite-resume returns 401 without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/rewrite-resume",
            json={
                "resume_text": "John Doe - Developer",
                "jd_text": "Looking for Developer"
            }
        )
        assert response.status_code == 401
        print("Rewrite resume correctly requires authentication")
    
    def test_rewrite_resume_success(self, auth_session):
        """Test rewrite-resume returns rewritten content"""
        resume_text = """
        Jane Smith
        
        Skills: Python, SQL
        
        Experience:
        - Worked on data projects
        - Built some reports
        - Helped with database stuff
        """
        
        jd_text = """
        Data Engineer
        
        Requirements:
        - Strong Python skills
        - SQL and database experience
        - Experience with data pipelines
        - AWS or cloud experience
        - Performance optimization
        """
        
        response = auth_session.post(
            f"{BASE_URL}/api/rewrite-resume",
            json={"resume_text": resume_text, "jd_text": jd_text},
            timeout=90  # LLM rewriting can take time
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "rewritten_resume" in data, "Missing rewritten_resume"
        assert "improvements" in data, "Missing improvements"
        assert "score_before" in data, "Missing score_before"
        assert "score_after" in data, "Missing score_after"
        
        # Verify types
        assert isinstance(data["rewritten_resume"], str)
        assert isinstance(data["improvements"], list)
        assert isinstance(data["score_before"], (int, float))
        assert isinstance(data["score_after"], (int, float))
        
        # Verify rewritten resume is not empty
        assert len(data["rewritten_resume"]) > 0
        
        # Score after should generally be >= score before
        print(f"Rewrite Resume Response:")
        print(f"  Score Before: {data['score_before']}")
        print(f"  Score After: {data['score_after']}")
        print(f"  Improvements: {len(data['improvements'])} items")
        print(f"  Rewritten Resume Length: {len(data['rewritten_resume'])} chars")


class TestResumeAndJDCRUD:
    """Test Resume and JD CRUD for saved items dropdown"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        unique_email = f"crud_test_{uuid.uuid4().hex[:8]}@example.com"
        
        register_response = session.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "password": "crudtest123",
                "name": "CRUD Test User"
            }
        )
        
        if register_response.status_code == 200:
            data = register_response.json()
            session_token = data.get("session_token")
            session.headers.update({"Authorization": f"Bearer {session_token}"})
        else:
            pytest.skip(f"Auth failed: {register_response.text}")
        
        return session
    
    def test_create_and_list_resume(self, auth_session):
        """Test creating and listing resumes for dropdown"""
        # Create a resume
        resume_data = {
            "title": "TEST_Resume for Match Score",
            "raw_text": "Test resume content for matching",
            "parsed_data": None
        }
        
        create_response = auth_session.post(f"{BASE_URL}/api/resumes", json=resume_data)
        assert create_response.status_code == 200
        created = create_response.json()
        assert "id" in created
        print(f"Created resume with ID: {created['id']}")
        
        # List resumes
        list_response = auth_session.get(f"{BASE_URL}/api/resumes")
        assert list_response.status_code == 200
        resumes = list_response.json()
        assert isinstance(resumes, list)
        assert len(resumes) >= 1
        print(f"Found {len(resumes)} resumes for dropdown")
    
    def test_create_and_list_jd(self, auth_session):
        """Test creating and listing JDs for dropdown"""
        # Create a JD
        jd_data = {
            "title": "TEST_JD for Match Score",
            "raw_text": "Test JD content for matching",
            "parsed_data": None
        }
        
        create_response = auth_session.post(f"{BASE_URL}/api/jds", json=jd_data)
        assert create_response.status_code == 200
        created = create_response.json()
        assert "id" in created
        print(f"Created JD with ID: {created['id']}")
        
        # List JDs
        list_response = auth_session.get(f"{BASE_URL}/api/jds")
        assert list_response.status_code == 200
        jds = list_response.json()
        assert isinstance(jds, list)
        assert len(jds) >= 1
        print(f"Found {len(jds)} JDs for dropdown")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

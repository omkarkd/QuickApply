import requests
import sys
import json
from datetime import datetime

class ResumeFormatterAPITester:
    def __init__(self, base_url="https://resume-parser-33.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test("Health Check", "GET", "", 200)
        return success

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_{timestamp}@example.com",
            "password": "password123",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_user)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"✅ Registered user: {test_user['email']}")
            return True
        return False

    def test_login(self):
        """Test user login with test credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"✅ Logged in as: {login_data['email']}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return success

    def test_resume_simple_parse(self):
        """Test simple resume parsing"""
        resume_text = """
        John Doe
        john.doe@email.com
        linkedin.com/in/johndoe
        
        Professional Summary
        Experienced software engineer with 5+ years in web development
        
        Technical Skills
        Python, JavaScript, React, Node.js, MongoDB
        
        Experience
        Senior Software Engineer at TechCorp
        • Developed web applications using React and Node.js
        • Led team of 3 developers
        
        Projects
        E-commerce Platform
        • Built full-stack application
        • Implemented payment integration
        
        Education
        Bachelor of Computer Science - University of Tech
        """
        
        success, response = self.run_test(
            "Resume Simple Parse", 
            "POST", 
            "parse/simple", 
            200, 
            {"text": resume_text}
        )
        return success, response

    def test_resume_ai_parse(self):
        """Test AI resume parsing"""
        resume_text = """
        Jane Smith
        jane.smith@email.com
        
        Professional Summary
        Full-stack developer with expertise in modern web technologies
        
        Skills
        React, Python, AWS, Docker
        
        Experience
        Software Developer at StartupCo (2020-2023)
        - Built scalable web applications
        - Implemented CI/CD pipelines
        """
        
        success, response = self.run_test(
            "Resume AI Parse", 
            "POST", 
            "parse/ai", 
            200, 
            {"text": resume_text}
        )
        return success, response

    def test_jd_simple_parse(self):
        """Test simple JD parsing"""
        jd_text = """
        Software Engineer at TechCorp
        Location: San Francisco, CA
        
        We are looking for a skilled Software Engineer to join our team.
        
        Requirements:
        - 3+ years of experience in software development
        - Python, JavaScript, React
        - Experience with databases
        
        Preferred:
        - AWS experience
        - Docker knowledge
        
        Salary: $100,000 - $150,000
        Job Type: Full-time
        """
        
        success, response = self.run_test(
            "JD Simple Parse", 
            "POST", 
            "parse/jd/simple", 
            200, 
            {"text": jd_text}
        )
        return success, response

    def test_jd_ai_parse(self):
        """Test AI JD parsing"""
        jd_text = """
        Senior Frontend Developer
        Company: InnovateTech
        Location: Remote
        
        We're seeking a Senior Frontend Developer to build amazing user experiences.
        
        Must Have:
        - 5+ years React experience
        - TypeScript proficiency
        - State management (Redux/Zustand)
        
        Nice to Have:
        - Next.js experience
        - Testing frameworks
        - Design system experience
        
        Experience: 5+ years
        Compensation: $120k-$180k
        Type: Full-time
        """
        
        success, response = self.run_test(
            "JD AI Parse", 
            "POST", 
            "parse/jd/ai", 
            200, 
            {"text": jd_text}
        )
        return success, response

    def test_resume_crud(self):
        """Test resume CRUD operations"""
        # Create resume
        resume_data = {
            "title": "Test Resume",
            "raw_text": "Test resume content",
            "parsed_data": {
                "name": "Test User",
                "email": "test@example.com",
                "technical_skills": ["Python", "JavaScript"]
            }
        }
        
        success, response = self.run_test("Create Resume", "POST", "resumes", 200, resume_data)
        if not success:
            return False
        
        resume_id = response.get('id')
        if not resume_id:
            print("❌ No resume ID returned")
            return False
        
        # Get resume
        success, _ = self.run_test("Get Resume", "GET", f"resumes/{resume_id}", 200)
        if not success:
            return False
        
        # List resumes
        success, _ = self.run_test("List Resumes", "GET", "resumes", 200)
        if not success:
            return False
        
        # Update resume
        update_data = {"title": "Updated Resume Title"}
        success, _ = self.run_test("Update Resume", "PUT", f"resumes/{resume_id}", 200, update_data)
        if not success:
            return False
        
        # Delete resume
        success, _ = self.run_test("Delete Resume", "DELETE", f"resumes/{resume_id}", 200)
        return success

    def test_jd_crud(self):
        """Test JD CRUD operations"""
        # Create JD
        jd_data = {
            "title": "Test Job Description",
            "raw_text": "Test JD content",
            "parsed_data": {
                "job_title": "Software Engineer",
                "company": "TestCorp",
                "must_have_skills": ["Python", "React"],
                "good_to_have_skills": ["AWS", "Docker"]
            }
        }
        
        success, response = self.run_test("Create JD", "POST", "jds", 200, jd_data)
        if not success:
            return False
        
        jd_id = response.get('id')
        if not jd_id:
            print("❌ No JD ID returned")
            return False
        
        # Get JD
        success, _ = self.run_test("Get JD", "GET", f"jds/{jd_id}", 200)
        if not success:
            return False
        
        # List JDs
        success, _ = self.run_test("List JDs", "GET", "jds", 200)
        if not success:
            return False
        
        # Update JD
        update_data = {"title": "Updated JD Title"}
        success, _ = self.run_test("Update JD", "PUT", f"jds/{jd_id}", 200, update_data)
        if not success:
            return False
        
        # Delete JD
        success, _ = self.run_test("Delete JD", "DELETE", f"jds/{jd_id}", 200)
        return success

    def test_telegram_settings(self):
        """Test Telegram settings"""
        # Get settings
        success, response = self.run_test("Get Telegram Settings", "GET", "telegram/settings", 200)
        if not success:
            return False
        
        # Update settings
        settings_data = {
            "bot_token": "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ",
            "is_active": True
        }
        success, _ = self.run_test("Update Telegram Settings", "PUT", "telegram/settings", 200, settings_data)
        return success

    def test_download_endpoints(self):
        """Test download endpoints"""
        resume_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "technical_skills": ["Python", "JavaScript"],
            "experiences": [
                {
                    "title": "Software Engineer",
                    "company": "TechCorp",
                    "bullets": ["Developed web apps", "Led team"]
                }
            ]
        }
        
        # Test PDF download
        success, _ = self.run_test("Download PDF", "POST", "download/pdf", 200, resume_data)
        if not success:
            return False
        
        # Test DOCX download
        success, _ = self.run_test("Download DOCX", "POST", "download/docx", 200, resume_data)
        return success

def main():
    print("🚀 Starting Resume Formatter API Tests...")
    tester = ResumeFormatterAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("User Login", tester.test_login),
        ("Get Current User", tester.test_get_me),
        ("Resume Simple Parse", tester.test_resume_simple_parse),
        ("Resume AI Parse", tester.test_resume_ai_parse),
        ("JD Simple Parse", tester.test_jd_simple_parse),
        ("JD AI Parse", tester.test_jd_ai_parse),
        ("Resume CRUD", tester.test_resume_crud),
        ("JD CRUD", tester.test_jd_crud),
        ("Telegram Settings", tester.test_telegram_settings),
        ("Download Endpoints", tester.test_download_endpoints),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Running: {test_name}")
        print('='*50)
        
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print(f"\n{'='*60}")
    print(f"📊 FINAL RESULTS")
    print('='*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print(f"\n✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
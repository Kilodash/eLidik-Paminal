#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SimonduAPITester:
    def __init__(self, base_url="https://dumas-disposisi.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.current_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (>10s)")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            f"Login ({email})",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.current_user = response.get('user', {})
            print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            return True
        return False

    def test_auth_me(self):
        """Test get current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_dashboard_combined(self):
        """Test combined dashboard endpoint"""
        success, response = self.run_test("Dashboard Combined", "GET", "dashboard/combined", 200)
        if success:
            stats = response.get('stats', {})
            print(f"   Stats: Total={stats.get('total', 0)}, Dalam Proses={stats.get('dalam_proses', 0)}")
        return success

    def test_dumas_list(self):
        """Test get dumas list"""
        success, response = self.run_test("Dumas List", "GET", "dumas", 200)
        if success:
            print(f"   Found {len(response)} dumas records")
        return success

    def test_settings(self):
        """Test get settings"""
        success, response = self.run_test("Settings List", "GET", "settings", 200)
        if success:
            print(f"   Found {len(response)} settings")
        return success

    def test_notifications(self):
        """Test notifications"""
        success, response = self.run_test("Notifications", "GET", "notifications", 200)
        if success:
            print(f"   Found {len(response)} notifications")
        return success

    def test_unread_count(self):
        """Test unread notifications count"""
        success, response = self.run_test("Unread Count", "GET", "notifications/unread-count", 200)
        if success:
            print(f"   Unread count: {response.get('count', 0)}")
        return success

    def test_users_list(self):
        """Test users list (admin/superadmin only)"""
        if self.current_user.get('role') in ['admin', 'superadmin']:
            return self.run_test("Users List", "GET", "users", 200)
        else:
            print("⏭️  Skipping Users List (insufficient role)")
            return True

    def test_approval_inbox(self):
        """Test approval inbox (pimpinan/superadmin only)"""
        if self.current_user.get('role') in ['pimpinan', 'superadmin']:
            success, response = self.run_test("Approval Inbox", "GET", "approval/inbox", 200)
            if success:
                print(f"   Found {len(response)} pending approvals")
            return success
        else:
            print("⏭️  Skipping Approval Inbox (insufficient role)")
            return True

    def test_create_dumas(self):
        """Test create dumas (admin/superadmin only)"""
        if self.current_user.get('role') in ['admin', 'superadmin']:
            test_data = {
                "no_dumas": f"TEST/{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "tgl_dumas": "2024-12-22",
                "pelapor": "Test Pelapor",
                "terlapor": "Test Terlapor",
                "satker": "Test Satker",
                "jenis_dumas": "Test Jenis",
                "keterangan": "Test keterangan untuk testing API",
                "status": "dalam_proses"
            }
            success, response = self.run_test("Create Dumas", "POST", "dumas", 201, data=test_data)
            if success:
                dumas_id = response.get('id')
                print(f"   Created dumas ID: {dumas_id}")
                return dumas_id
            return None
        else:
            print("⏭️  Skipping Create Dumas (insufficient role)")
            return True

def main():
    print("🚀 Starting Simondu Web API Testing...")
    print("=" * 50)
    
    tester = SimonduAPITester()
    
    # Test health first
    if not tester.test_health()[0]:
        print("❌ Health check failed, stopping tests")
        return 1

    # Test different user roles
    test_users = [
        ("admin@simondu.polri.go.id", "Admin"),
        ("unit1@simondu.polri.go.id", "Unit"),
        ("kasubbid@simondu.polri.go.id", "Pimpinan"),
        ("superadmin@simondu.polri.go.id", "Superadmin")
    ]

    all_passed = True
    
    for email, role_name in test_users:
        print(f"\n{'='*20} Testing {role_name} User {'='*20}")
        
        # Login
        if not tester.test_login(email, "simondu123"):
            print(f"❌ Login failed for {email}, skipping role tests")
            all_passed = False
            continue
        
        # Test basic endpoints
        tester.test_auth_me()
        tester.test_dashboard_combined()
        tester.test_dumas_list()
        tester.test_notifications()
        tester.test_unread_count()
        
        # Test role-specific endpoints
        tester.test_users_list()
        tester.test_approval_inbox()
        tester.test_settings()
        
        # Test create dumas (admin/superadmin only)
        if role_name in ["Admin", "Superadmin"]:
            dumas_id = tester.test_create_dumas()
            if dumas_id and isinstance(dumas_id, str):
                # Test get specific dumas
                tester.run_test("Get Dumas Detail", "GET", f"dumas/{dumas_id}", 200)

    # Print final results
    print(f"\n{'='*50}")
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        all_passed = False
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
"""
Backend API tests for Fixi app
Tests: Root endpoint, quote endpoints, chat endpoints
"""
import pytest
import requests
import os
import time
from pathlib import Path
from dotenv import load_dotenv

# Use public URL for testing
# Read from frontend .env since pytest runs from backend context
frontend_env = Path(__file__).parent.parent.parent / 'frontend' / '.env'
if frontend_env.exists():
    load_dotenv(frontend_env)

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found. Check frontend/.env file.")

class TestHealth:
    """Health check tests - run first"""
    
    def test_root_endpoint(self):
        """Test GET /api/ returns status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data, "Response should contain 'message' key"
        assert data["message"] == "Fixi API"
        print(f"✓ Root endpoint working: {data}")


class TestQuotes:
    """Quote endpoint tests"""
    
    def test_get_single_quote(self):
        """Test GET /api/quote returns a random quote"""
        response = requests.get(f"{BASE_URL}/api/quote")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "quote" in data, "Response should contain 'quote' key"
        assert isinstance(data["quote"], str), "Quote should be a string"
        assert len(data["quote"]) > 0, "Quote should not be empty"
        print(f"✓ Single quote returned: {data['quote'][:50]}...")
    
    def test_get_all_quotes(self):
        """Test GET /api/quotes returns all quotes"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "quotes" in data, "Response should contain 'quotes' key"
        assert isinstance(data["quotes"], list), "Quotes should be a list"
        assert len(data["quotes"]) > 0, "Quotes list should not be empty"
        print(f"✓ All quotes returned: {len(data['quotes'])} quotes")


class TestChat:
    """Chat endpoint tests with AI integration"""
    
    def test_chat_send_message(self):
        """Test POST /api/chat sends message and gets AI response"""
        session_id = f"test_session_{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Hallo, ich brauche Hilfe beim Schuldenabbau.",
            "user_context": {
                "total_debt": 10000,
                "monthly_payment": 500
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "response" in data, "Response should contain 'response' key"
        assert "session_id" in data, "Response should contain 'session_id' key"
        assert isinstance(data["response"], str), "AI response should be a string"
        assert len(data["response"]) > 0, "AI response should not be empty"
        assert data["session_id"] == session_id, "Session ID should match"
        
        print(f"✓ Chat message sent and AI responded")
        print(f"  AI response (first 100 chars): {data['response'][:100]}...")
        
        # Give AI time to process
        time.sleep(2)
    
    def test_chat_get_history(self):
        """Test GET /api/chat/{session_id} retrieves chat history"""
        # First send a message
        session_id = f"test_history_{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Test message for history",
        }
        
        post_response = requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=30)
        assert post_response.status_code == 200
        
        # Give time for DB write
        time.sleep(1)
        
        # Then retrieve history
        get_response = requests.get(f"{BASE_URL}/api/chat/{session_id}")
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        data = get_response.json()
        assert "messages" in data, "Response should contain 'messages' key"
        assert isinstance(data["messages"], list), "Messages should be a list"
        assert len(data["messages"]) >= 2, "Should have at least 2 messages (user + assistant)"
        
        print(f"✓ Chat history retrieved: {len(data['messages'])} messages")
    
    def test_chat_clear_history(self):
        """Test DELETE /api/chat/{session_id} clears chat history"""
        # First create some history
        session_id = f"test_clear_{int(time.time())}"
        payload = {
            "session_id": session_id,
            "message": "Message to be cleared",
        }
        
        requests.post(f"{BASE_URL}/api/chat", json=payload, timeout=30)
        time.sleep(1)
        
        # Delete the history
        delete_response = requests.delete(f"{BASE_URL}/api/chat/{session_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert "status" in data, "Response should contain 'status' key"
        assert data["status"] == "cleared", "Status should be 'cleared'"
        
        # Verify history is empty
        get_response = requests.get(f"{BASE_URL}/api/chat/{session_id}")
        assert get_response.status_code == 200
        history = get_response.json()
        assert len(history["messages"]) == 0, "History should be empty after clearing"
        
        print(f"✓ Chat history cleared successfully")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

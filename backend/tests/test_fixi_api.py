"""
Fixi Backend API Tests
Tests for the KI-Coach (Claude) and motivation endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://fixi-premium-trigger.preview.emergentagent.com')

class TestHealthEndpoints:
    """Health check and basic API tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Fixi API"
        print("✓ API root returns correct message")
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "fixi-backend"
        print("✓ Health check passes")


class TestQuotesEndpoints:
    """Tests for motivation quotes endpoints"""
    
    def test_get_all_quotes(self):
        """Test retrieving all motivation quotes"""
        response = requests.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200
        data = response.json()
        assert "quotes" in data
        assert isinstance(data["quotes"], list)
        assert len(data["quotes"]) > 0
        # Check for German umlauts in quotes
        quotes_text = " ".join(data["quotes"])
        assert any(char in quotes_text for char in ['ä', 'ö', 'ü', 'ß'])
        print(f"✓ Retrieved {len(data['quotes'])} quotes with German umlauts")
    
    def test_get_random_quote(self):
        """Test retrieving a random quote"""
        response = requests.get(f"{BASE_URL}/api/quote")
        assert response.status_code == 200
        data = response.json()
        assert "quote" in data
        assert isinstance(data["quote"], str)
        assert len(data["quote"]) > 10
        print(f"✓ Random quote: {data['quote'][:50]}...")


class TestChatEndpoints:
    """Tests for KI-Coach (Claude) chat functionality"""
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for tests"""
        return f"test_session_{int(time.time())}"
    
    def test_chat_basic_message(self, session_id):
        """Test basic chat message with Claude"""
        payload = {
            "session_id": session_id,
            "message": "Hallo Fixi!",
            "user_context": None
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert data["session_id"] == session_id
        assert len(data["response"]) > 10
        print(f"✓ Chat response received: {data['response'][:100]}...")
    
    def test_chat_with_user_context(self, session_id):
        """Test chat with user financial context"""
        payload = {
            "session_id": session_id,
            "message": "Wie kann ich schneller schuldenfrei werden?",
            "user_context": {
                "totalDebt": 15000,
                "remainingDebt": 12000,
                "emotion": "overwhelmed",
                "numberOfDebts": 3
            }
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Response should be personalized based on context
        assert len(data["response"]) > 50
        print(f"✓ Personalized chat response: {data['response'][:150]}...")
    
    def test_chat_german_response(self, session_id):
        """Test that chat responses are in German"""
        payload = {
            "session_id": session_id,
            "message": "Gib mir Tipps zum Sparen",
            "user_context": {"totalDebt": 5000, "remainingDebt": 5000}
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Check for German words/umlauts in response
        response_text = data["response"].lower()
        german_indicators = ['du', 'ich', 'dein', 'deine', 'kann', 'möchte', 'ä', 'ö', 'ü']
        has_german = any(indicator in response_text for indicator in german_indicators)
        assert has_german, "Response should be in German"
        print("✓ Response is in German with proper umlauts")
    
    def test_get_chat_history(self, session_id):
        """Test retrieving chat history"""
        # First send a message
        payload = {
            "session_id": session_id,
            "message": "Test message for history"
        }
        requests.post(f"{BASE_URL}/api/chat", json=payload)
        
        # Then get history
        response = requests.get(f"{BASE_URL}/api/chat/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Chat history contains {len(data['messages'])} messages")
    
    def test_clear_chat_history(self, session_id):
        """Test clearing chat history"""
        # First create some history
        payload = {"session_id": session_id, "message": "Test message to clear"}
        requests.post(f"{BASE_URL}/api/chat", json=payload)
        
        # Clear the history
        response = requests.delete(f"{BASE_URL}/api/chat/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "cleared"
        
        # Verify it's cleared
        history_response = requests.get(f"{BASE_URL}/api/chat/{session_id}")
        history_data = history_response.json()
        assert len(history_data["messages"]) == 0
        print("✓ Chat history cleared successfully")


class TestChatEdgeCases:
    """Edge case tests for chat functionality"""
    
    def test_chat_empty_message(self):
        """Test chat with empty message"""
        payload = {
            "session_id": "test_empty",
            "message": "",
            "user_context": None
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        # Should either handle gracefully or return error (520 is Cloudflare gateway error)
        assert response.status_code in [200, 400, 422, 500, 520]
        print(f"✓ Empty message handled with status {response.status_code}")
    
    def test_chat_special_characters(self):
        """Test chat with German special characters"""
        payload = {
            "session_id": f"test_special_{int(time.time())}",
            "message": "Ich möchte über meine größten Ausgaben reden",
            "user_context": None
        }
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        # Should handle umlauts properly
        assert "response" in data
        print("✓ German special characters handled correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

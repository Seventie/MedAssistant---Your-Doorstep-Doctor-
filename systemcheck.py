# system_check.py - Complete system diagnostic
import requests
import json
import time
from datetime import datetime

def print_status(title, status):
    icon = "✅" if status else "❌"
    print(f"{icon} {title}")

def test_endpoint(name, url, method="GET", data=None, headers=None):
    try:
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        if method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        else:
            response = requests.get(url, headers=headers, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                
                # Check for source indicators
                if 'source' in result:
                    print(f"   🎯 Source: {result['source']}")
                if 'method' in result:
                    print(f"   🔧 Method: {result['method']}")
                if 'models_loaded' in result:
                    print(f"   🧠 Models: {result['models_loaded']}")
                if 'timestamp' in result:
                    print(f"   ⏰ Timestamp: {result['timestamp']}")
                
                print_status(f"{name}", True)
                return True, result
            except json.JSONDecodeError:
                print(f"   ⚠️ Non-JSON response: {response.text[:100]}...")
                print_status(f"{name}", False)
                return False, None
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text[:100]}...")
            print_status(f"{name}", False)
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Connection Error: {e}")
        print_status(f"{name}", False)
        return False, None

def main():
    print("🚀 MEDICAL AI SYSTEM DIAGNOSTIC")
    print("=" * 50)
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Test Local Python API
    print("\n📍 LOCAL PYTHON API TESTS")
    print("-" * 30)
    
    # Health check
    test_endpoint(
        "Python API Health", 
        "http://localhost:5000/health"
    )
    
    # QA endpoint
    test_endpoint(
        "Python API Q&A",
        "http://localhost:5000/qa",
        method="POST",
        data={"question": "What is diabetes?"}
    )
    
    # Recommendations endpoint
    test_endpoint(
        "Python API Recommendations",
        "http://localhost:5000/recommend", 
        method="POST",
        data={"symptoms": ["headache"], "additional_info": "mild pain"}
    )
    
    # Search endpoint
    test_endpoint(
        "Python API Search",
        "http://localhost:5000/search",
        method="POST", 
        data={"query": "aspirin", "top_k": 3}
    )
    
    # Test Supabase Edge Functions
    print("\n📍 SUPABASE EDGE FUNCTIONS TESTS")
    print("-" * 35)
    
    auth_header = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbGZwc3pjdHF5dnBzb3Nrb3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDM0NzcsImV4cCI6MjA3NTQxOTQ3N30.o7R1SlwM1g4fULt7-66BvoGZiPHdxA1_FMyqOaY1YHQ",
        "Content-Type": "application/json"
    }
    
    # Medical QA
    test_endpoint(
        "Supabase Medical Q&A",
        "https://hjlfpszctqyvpsoskozu.supabase.co/functions/v1/medical-qa",
        method="POST",
        data={"question": "What is diabetes?"},
        headers=auth_header
    )
    
    # Medicine Recommendations  
    test_endpoint(
        "Supabase Recommendations",
        "https://hjlfpszctqyvpsoskozu.supabase.co/functions/v1/medicine-recommendations",
        method="POST",
        data={"symptoms": ["headache"], "additional_info": "mild pain"},
        headers=auth_header
    )
    
    # Medicine Search
    test_endpoint(
        "Supabase Medicine Search", 
        "https://hjlfpszctqyvpsoskozu.supabase.co/functions/v1/medicine-search",
        method="POST",
        data={"query": "aspirin"},
        headers=auth_header
    )
    
    print("\n📍 SYSTEM SUMMARY")
    print("-" * 20)
    print("🎯 Check the 'Source' and 'Method' fields above to see which AI models are being used:")
    print("   • 'Python DPR + FAISS + GROQ Model' = Your NLP Architecture")
    print("   • 'GROQ (Local)' = GROQ AI Direct")  
    print("   • 'Local GROQ + Database' = GROQ + Your CSV Data")
    print("   • 'GROQ AI (Fallback)' = Supabase Fallback Mode")
    print("\n✅ System diagnostic complete!")

if __name__ == "__main__":
    main()

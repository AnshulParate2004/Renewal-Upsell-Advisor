"""
Quick script to trigger voice calls manually for testing.
"""
import requests
import json

def trigger_calls():
    """Trigger voice calls manually."""
    print("\n" + "="*70)
    print("TRIGGERING VOICE CALLS MANUALLY")
    print("="*70)
    
    url = "http://localhost:8000/api/v1/voice/trigger-calls"
    
    print(f"\n[INFO] Sending POST request to: {url}")
    
    try:
        response = requests.post(url, timeout=30)
        
        if response.status_code == 200:
            print("\n[SUCCESS] Calls triggered!")
            print("\nResponse:")
            try:
                data = response.json()
                print(json.dumps(data, indent=2))
            except:
                print(response.text)
        else:
            print(f"\n[ERROR] Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Cannot connect to server!")
        print("[INFO] Make sure FastAPI server is running:")
        print("  cd Backend")
        print("  uvicorn app.main:app --host 0.0.0.0 --port 8000")
    except Exception as e:
        print(f"\n[ERROR] Failed to trigger calls: {e}")


if __name__ == "__main__":
    trigger_calls()

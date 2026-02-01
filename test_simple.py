"""
Test the test handler with a simple request
"""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

RUNPOD_ENDPOINT_ID = "wymlqaw2mgt2lz"
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")

url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"

payload = {
    "input": {
        "message": "Hello from test!"
    }
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {RUNPOD_API_KEY}"
}

print(f"Testing endpoint: {RUNPOD_ENDPOINT_ID}")
print(f"URL: {url}\n")
print("Sending test request...")

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    result = response.json()
    print("\n[OK] Request sent!")
    print(f"Status: {result.get('status')}")
    print(f"Job ID: {result.get('id')}")
    print(f"\nFull response: {json.dumps(result, indent=2)}")

except requests.exceptions.RequestException as e:
    print(f"\n[ERROR] {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response: {e.response.text}")

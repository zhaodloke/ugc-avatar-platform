"""
Test the RunPod endpoint with a sample request
"""
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Your RunPod endpoint details
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID", "gfnst0ueuswl6u")
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")  # Get from .env file

# Endpoint URL
url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/run"

# Test payload - using raw base64 (no data URI prefix)
payload = {
    "input": {
        "reference_image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",  # 1x1 pixel test
        "audio": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",  # Empty wav test
        "prompt": "Test video generation",
        "emotion": "neutral"
    }
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {RUNPOD_API_KEY}"
}

print(f"Testing endpoint: {RUNPOD_ENDPOINT_ID}")
print(f"URL: {url}")
print("\nSending request...")

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()

    result = response.json()
    print("\n[OK] Request successful!")
    print(f"Status: {result.get('status')}")
    print(f"Job ID: {result.get('id')}")

    # If job is queued, check status
    if result.get('status') in ['IN_QUEUE', 'IN_PROGRESS']:
        job_id = result['id']
        status_url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"

        print(f"\nJob queued. Check status at:")
        print(status_url)
        print("\nNote: First run will take 10-20 minutes to download 67GB of models")

except requests.exceptions.RequestException as e:
    print(f"\n[ERROR] {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response: {e.response.text}")

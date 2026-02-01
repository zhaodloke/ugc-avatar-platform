"""
Check the status of a RunPod job
"""
import requests
import json
import os
import sys
from dotenv import load_dotenv

load_dotenv()

RUNPOD_ENDPOINT_ID = "wymlqaw2mgt2lz"
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")

if len(sys.argv) < 2:
    print("Usage: python check_job_status.py <job_id>")
    sys.exit(1)

job_id = sys.argv[1]

url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {RUNPOD_API_KEY}"
}

print(f"Checking job: {job_id}")
print(f"URL: {url}\n")

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    result = response.json()

    print(f"Status: {result.get('status')}")

    if result.get('status') == 'COMPLETED':
        print("\n[OK] Job completed!")
        if 'output' in result:
            print(f"\nOutput: {json.dumps(result['output'], indent=2)}")
    elif result.get('status') == 'FAILED':
        print("\n[ERROR] Job failed!")
        if 'error' in result:
            print(f"Error: {result['error']}")
    elif result.get('status') in ['IN_QUEUE', 'IN_PROGRESS']:
        print("\n[INFO] Job still processing...")
        if 'executionTime' in result:
            print(f"Execution time: {result['executionTime']}ms")

    # Print full response for debugging
    print(f"\nFull response:\n{json.dumps(result, indent=2)}")

except requests.exceptions.RequestException as e:
    print(f"\n[ERROR] {e}")
    if hasattr(e, 'response') and e.response is not None:
        print(f"Response: {e.response.text}")

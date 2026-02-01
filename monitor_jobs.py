"""
Monitor all jobs in the queue
"""
import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

RUNPOD_ENDPOINT_ID = "wymlqaw2mgt2lz"
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")

def check_endpoint_status():
    """Get overall endpoint status"""
    # Note: This would require the endpoint status API
    # For now, we'll just check individual jobs
    pass

def list_jobs():
    """List all jobs (this is a simplified version, actual API may differ)"""
    print("Job monitoring...")
    print("\nTo check a specific job, use:")
    print("  python check_job_status.py <job_id>")
    print("\nYour test job ID: 15580c86-9950-4589-9f9a-9af49e4093fb-u1")
    print("\nChecking test job status...")

    # Check the test job
    job_id = "15580c86-9950-4589-9f9a-9af49e4093fb-u1"
    url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/status/{job_id}"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {RUNPOD_API_KEY}"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        result = response.json()

        print(f"\nJob ID: {job_id}")
        print(f"Status: {result.get('status')}")

        if result.get('status') == 'COMPLETED':
            print("[OK] Job completed!")
        elif result.get('status') == 'FAILED':
            print("[ERROR] Job failed!")
            if 'error' in result:
                print(f"Error: {result['error']}")
        elif result.get('status') in ['IN_QUEUE', 'IN_PROGRESS']:
            print("[INFO] Job still processing...")

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    list_jobs()

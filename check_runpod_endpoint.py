#!/usr/bin/env python3
"""
Script to check RunPod endpoint status
"""
import requests
import json

# Your RunPod configuration
RUNPOD_API_KEY = "rpa_S76M85G38GEAA0DJZMQFJFMWC22W6MS03C5BZLT11a0qq5"
RUNPOD_ENDPOINT_ID = "wymlqaw2mgt2lz"

def check_endpoint_status():
    """Check if RunPod endpoint is active"""

    print("=" * 60)
    print("RunPod Endpoint Status Check")
    print("=" * 60)
    print(f"\nEndpoint ID: {RUNPOD_ENDPOINT_ID}")
    print(f"API Key: {RUNPOD_API_KEY[:15]}...{RUNPOD_API_KEY[-5:]}")

    # Try to get endpoint health
    health_url = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/health"
    headers = {
        "Authorization": f"Bearer {RUNPOD_API_KEY}",
        "Content-Type": "application/json"
    }

    print(f"\nChecking endpoint health at:")
    print(f"  {health_url}")

    try:
        print("\nAttempting connection...")
        response = requests.get(health_url, headers=headers, timeout=10)

        print(f"\nResponse Status Code: {response.status_code}")

        if response.status_code == 200:
            print("[OK] Endpoint is ACTIVE and healthy!")
            try:
                data = response.json()
                print(f"\nEndpoint Details:")
                print(json.dumps(data, indent=2))
            except:
                print(f"Response: {response.text}")
            return True
        elif response.status_code == 404:
            print("[ERROR] Endpoint NOT FOUND")
            print("The endpoint may have been deleted or the ID is incorrect.")
        elif response.status_code == 401:
            print("[ERROR] UNAUTHORIZED")
            print("Your API key may be invalid or expired.")
        else:
            print(f"[WARNING] Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")

        return False

    except requests.exceptions.SSLError as e:
        print(f"\n[ERROR] SSL Connection Error:")
        print(f"  {e}")
        print("\nThis usually means:")
        print("  1. The endpoint is paused/stopped")
        print("  2. The endpoint doesn't exist")
        print("  3. Network/firewall issues")
        return False

    except requests.exceptions.Timeout:
        print("\n[ERROR] Connection timeout")
        print("The endpoint may be slow to respond or offline.")
        return False

    except requests.exceptions.ConnectionError as e:
        print(f"\n[ERROR] Connection Error:")
        print(f"  {e}")
        return False

    except Exception as e:
        print(f"\n[ERROR] Unexpected error:")
        print(f"  {e}")
        import traceback
        traceback.print_exc()
        return False

def print_instructions():
    """Print instructions for managing RunPod endpoint"""

    print("\n" + "=" * 60)
    print("How to Check and Start Your RunPod Endpoint")
    print("=" * 60)

    print("\n1. Go to RunPod Dashboard:")
    print("   https://www.runpod.io/console/serverless")

    print("\n2. Find your endpoint:")
    print(f"   - Look for endpoint ID: {RUNPOD_ENDPOINT_ID}")
    print("   - Check the status indicator")

    print("\n3. Endpoint Status Indicators:")
    print("   - Green dot = Active and running")
    print("   - Yellow dot = Starting up")
    print("   - Red/Gray dot = Paused or stopped")

    print("\n4. To Start/Resume Endpoint:")
    print("   - Click on your endpoint")
    print("   - Look for 'Start' or 'Resume' button")
    print("   - Click it and wait for it to become active")

    print("\n5. If Endpoint Doesn't Exist:")
    print("   - You need to deploy a new serverless endpoint")
    print("   - Click 'New Endpoint'")
    print("   - Select GPU type (A40, A100, etc.)")
    print("   - Deploy your OmniAvatar handler code")
    print("   - Update .env with the new endpoint ID")

    print("\n6. Endpoint Pricing:")
    print("   - Serverless endpoints charge per second of use")
    print("   - Idle workers are automatically paused to save money")
    print("   - First request may take 30-60s to cold start")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    is_healthy = check_endpoint_status()
    print_instructions()

    if not is_healthy:
        print("\n[ACTION REQUIRED] Please check your RunPod dashboard")
        print("and start/deploy your endpoint before testing video generation.")
    else:
        print("\n[SUCCESS] Your endpoint is ready!")
        print("You can now run: python test_runpod_generation.py")

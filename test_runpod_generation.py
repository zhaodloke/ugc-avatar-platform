#!/usr/bin/env python3
"""
Test script for UGC Avatar Platform with RunPod
"""
import requests
import time
import json

# API configuration
API_BASE_URL = "http://localhost:8000"

def test_video_generation():
    """Test video generation with RunPod"""

    print("=" * 60)
    print("Testing UGC Avatar Platform with RunPod")
    print("=" * 60)

    # 1. Test health endpoint
    print("\n1. Testing health endpoint...")
    response = requests.get(f"{API_BASE_URL}/health")
    print(f"   Status: {response.json()}")

    # 2. Generate video
    print("\n2. Submitting video generation request...")

    with open("C:/Users/loke_/Downloads/test-avatar.jpg", "rb") as f:
        files = {
            "reference_image": ("avatar.jpg", f, "image/jpeg")
        }
        data = {
            "text_input": "Hello! Welcome to the UGC Avatar Platform. This is a test of the RunPod GPU worker integration.",
            "prompt": "Professional presenter in modern office setting",
            "emotion": "happy",
            "style": "testimonial",
            "tier": "standard"
        }

        response = requests.post(
            f"{API_BASE_URL}/api/v1/videos/generate",
            files=files,
            data=data
        )

    if response.status_code == 200:
        video_data = response.json()
        video_id = video_data["id"]
        print(f"   [OK] Video generation started!")
        print(f"   Video ID: {video_id}")
        print(f"   Status: {video_data['status']}")
        print(f"   Reference Image: {video_data.get('reference_image_url', 'N/A')}")
        if video_data.get('audio_url'):
            print(f"   Audio: {video_data['audio_url']}")

        # 3. Poll for completion
        print(f"\n3. Polling for video completion (this may take 2-5 minutes)...")

        max_attempts = 60  # 5 minutes max
        attempt = 0

        while attempt < max_attempts:
            time.sleep(5)
            attempt += 1

            status_response = requests.get(
                f"{API_BASE_URL}/api/v1/videos/{video_id}/status"
            )

            if status_response.status_code == 200:
                status_data = status_response.json()
                current_status = status_data["status"]
                progress = status_data.get("progress", 0)
                message = status_data.get("message", "")

                print(f"   [{attempt}/60] Status: {current_status} | Progress: {progress}% | {message}")

                if current_status == "completed":
                    print(f"\n   [OK] Video generation completed!")
                    print(f"   Output video URL: {status_data['output_video_url']}")
                    return True
                elif current_status == "failed":
                    print(f"\n   [ERROR] Video generation failed!")
                    print(f"   Error: {status_data.get('error_message', 'Unknown error')}")
                    return False
            else:
                print(f"   Error checking status: {status_response.status_code}")

        print(f"\n   [WARNING] Timeout: Video generation took longer than 5 minutes")
        return False

    else:
        print(f"   [ERROR] Error: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

if __name__ == "__main__":
    try:
        success = test_video_generation()
        if success:
            print("\n" + "=" * 60)
            print("[SUCCESS] Test completed successfully!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("[FAILED] Test failed")
            print("=" * 60)
    except Exception as e:
        print(f"\n[ERROR] Test error: {e}")
        import traceback
        traceback.print_exc()

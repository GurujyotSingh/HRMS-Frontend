import urllib.request
import json
import sys

url = "http://127.0.0.1:8000/api/v1/onboarding/offboarding/initiate"
data = json.dumps({
    "employee_id": "123",
    "reason": "test",
    "last_working_date": "2026-06-19T00:00:00Z",
    "tasks": []
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as f:
        print(f.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode("utf-8"))
except Exception as e:
    print(f"Error: {e}")

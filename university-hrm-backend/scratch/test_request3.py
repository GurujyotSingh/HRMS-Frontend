import urllib.request

url = "http://127.0.0.1:8000/api/v1/onboarding/offboarding/all"
req = urllib.request.Request(url)

try:
    with urllib.request.urlopen(req) as f:
        print(f.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode("utf-8"))
except Exception as e:
    print(f"Error: {e}")

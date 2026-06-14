import requests
import json

# Login
resp = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@university.edu", "password": "Divyansh113"})
token = resp.json().get("access_token")

# Get employees
resp = requests.get("http://localhost:8000/api/v1/employees", headers={"Authorization": f"Bearer {token}"})
data = resp.json()

for emp in data.get("items", []):
    print(f"User: {emp['email']}")
    fin = emp.get('financials')
    if fin:
        print(f"  Financials: {json.dumps(fin)}")
    else:
        print("  No financials")

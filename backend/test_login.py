import requests

res = requests.post("http://127.0.0.1:8000/api/login", json={"email": "abhins@gmail.com", "city": "Chennai"})
print("Status Code:", res.status_code)
print("Response:", res.text)

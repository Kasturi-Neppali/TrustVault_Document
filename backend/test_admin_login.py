

import getpass
import requests

BASE_URL = "http://127.0.0.1:5000"

# Step 1: Get Admin credentials
email = input("Enter Admin email: ").strip()
password = getpass.getpass("Enter Admin password: ")

try:
    # Step 2: Login
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": email,
            "password": password
        },
        timeout=15
    )

    print("\nLogin status:", login_response.status_code)

    if login_response.status_code != 200:
        print("Login failed:", login_response.text)
        raise SystemExit

    # Step 3: Extract JWT token
    login_data = login_response.json()
    token = login_data.get("access_token")

    if not token:
        print("Login succeeded, but access_token was not returned.")
        print("Response keys:", list(login_data.keys()))
        raise SystemExit

    print("Admin authentication successful!")
    print("JWT token received.")

    # Step 4: Access protected Admin dashboard
    headers = {
        "Authorization": f"Bearer {token}"
    }

    dashboard_response = requests.get(
        f"{BASE_URL}/api/admin/dashboard",
        headers=headers,
        timeout=15
    )

    print("\nAdmin dashboard status:", dashboard_response.status_code)

    if dashboard_response.status_code == 200:
        print("Admin dashboard access successful!")
        print("Dashboard information:")
        print(dashboard_response.json())

    else:
        print("Dashboard access failed.")
        print(dashboard_response.text)

except requests.exceptions.RequestException as error:
    print("Connection error:", error)


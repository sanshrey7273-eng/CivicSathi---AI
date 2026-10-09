import httpx
import time
import sys
import os

BASE_URL = "http://localhost:8000"

def wait_for_server():
    for _ in range(10):
        try:
            res = httpx.get(f"{BASE_URL}/health")
            if res.status_code == 200:
                print("Server is up!")
                return True
        except:
            time.sleep(1)
    return False

def run_e2e_flow():
    if not wait_for_server():
        print("FAIL: Server not responding.")
        sys.exit(1)

    print("--- STARTING END-TO-END DEMO FLOW ---")

    # 1. Classification (Marathi Garbage)
    print("\n1. Classifying Marathi Garbage Complaint...")
    text = "माझ्या घराजवळ खूप कचरा साचला आहे"
    res_class = httpx.post(f"{BASE_URL}/api/complaints/classify", json={"text": text, "lang": "mr"})
    if res_class.status_code == 200:
        data = res_class.json()
        print(f"   [PASS] Classification successful.")
        print(f"   Category: {data.get('category')}")
        print(f"   Department: {data.get('department_name')}")
        if data.get('category') != "garbage":
            print("   [FAIL] Expected category 'garbage'.")
            sys.exit(1)
    else:
        print(f"   [FAIL] Classification failed with status {res_class.status_code}.")
        sys.exit(1)

    # 2. Complaint Creation & Ref ID Retrieval
    print("\n2. Creating Complaint and Retrieving Reference ID...")
    comp_data = {
        "category": data.get("category"),
        "department_key": data.get("department_key"),
        "department_name": data.get("department_name"),
        "summary_en": data.get("summary_en"),
        "summary_local": data.get("summary_local"),
        "lat": 18.5204,
        "lng": 73.8567,
        "address": "Pune, Maharashtra",
        "ward_id": 1,
        "ward_name": "Shivajinagar-Ghole Road",
        "is_anonymous": True
    }
    res_create = httpx.post(f"{BASE_URL}/api/complaints", json=comp_data)
    if res_create.status_code == 200:
        create_data = res_create.json()
        ref_no = create_data.get("ref_no")
        comp_id = create_data.get("id")
        pdf_url_path = create_data.get("pdf_url")
        print(f"   [PASS] Complaint created.")
        print(f"   Reference ID: {ref_no}")
        print(f"   Internal ID: {comp_id}")
    else:
        print(f"   [FAIL] Complaint creation failed with status {res_create.status_code}.")
        sys.exit(1)

    # 3. PDF Download
    print("\n3. Downloading PDF...")
    # The URL from the creation endpoint might be relative
    pdf_url = f"{BASE_URL}{pdf_url_path}" if pdf_url_path.startswith("/") else f"{BASE_URL}/{pdf_url_path}"
    res_pdf = httpx.get(pdf_url)
    if res_pdf.status_code == 200 and "application/pdf" in res_pdf.headers.get("content-type", ""):
        with open("e2e_download.pdf", "wb") as f:
            f.write(res_pdf.content)
        size = os.path.getsize("e2e_download.pdf")
        print(f"   [PASS] PDF downloaded successfully.")
        print(f"   File size: {size} bytes.")
        if size < 500:
            print("   [WARNING] PDF seems abnormally small.")
    else:
        print(f"   [FAIL] PDF download failed. Status: {res_pdf.status_code}, Type: {res_pdf.headers.get('content-type')}")
        sys.exit(1)

    # 4. Tracking by Reference ID
    print(f"\n4. Tracking Complaint by Reference ID ({ref_no})...")
    res_track = httpx.get(f"{BASE_URL}/api/complaints/{ref_no}")
    if res_track.status_code == 200:
        track_data = res_track.json()
        print(f"   [PASS] Tracking successful.")
        print(f"   Status: {track_data.get('status')}")
        print(f"   Category verified: {track_data.get('category') == 'garbage'}")
    else:
        print(f"   [FAIL] Tracking failed with status {res_track.status_code}.")
        sys.exit(1)

    print("\n--- END-TO-END DEMO COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    run_e2e_flow()

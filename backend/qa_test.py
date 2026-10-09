import httpx
import time
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

def test_qa():
    if not wait_for_server():
        print("FAIL: Server not responding.")
        return

    # 1. Test every implemented endpoint
    endpoints = {
        "/health": httpx.get(f"{BASE_URL}/health"),
        "/api/departments": httpx.get(f"{BASE_URL}/api/departments"),
        "/api/schemes": httpx.get(f"{BASE_URL}/api/schemes"),
        "/api/map/complaints": httpx.get(f"{BASE_URL}/api/map/complaints"),
        "/api/integrations/status": httpx.get(f"{BASE_URL}/api/integrations/status"),
    }
    
    for ep, res in endpoints.items():
        print(f"Testing {ep}: {'PASS' if res.status_code == 200 else 'FAIL'}")

    # 2. Test classification in different languages
    cases = [
        ("English Pothole", "Huge pothole on road", "pothole", "pmc_road"),
        ("Marathi Garbage", "खूप कचरा साचला आहे", "garbage", "pmc_swm"),
        ("Hindi Ration", "राशन कार्ड में नाम गलत है", "ration_card", "food_civil_supplies"),
        ("English Water", "Water leakage from pipe", "water", "water_supply"),
    ]
    for name, text, expected_cat, expected_dep in cases:
        res = httpx.post(f"{BASE_URL}/api/complaints/classify", json={"text": text, "lang": "en"})
        if res.status_code == 200 and res.json().get("category") == expected_cat:
            print(f"Classification {name}: PASS")
        else:
            print(f"Classification {name}: FAIL (Got {res.json().get('category')})")

    # 3. Test complaint creation and tracking
    comp_data = {
        "category": "pothole", "department_key": "pmc_road", "department_name": "Road Maintenance",
        "summary_en": "Test pothole", "summary_local": "Test", "lat": 18.5, "lng": 73.8,
        "address": "Pune", "ward_id": 1, "ward_name": "Ward 1", "is_anonymous": True
    }
    res = httpx.post(f"{BASE_URL}/api/complaints", json=comp_data)
    if res.status_code == 200:
        data = res.json()
        ref_no = data.get("ref_no")
        comp_id = data.get("id")
        print(f"Creation: PASS (Ref: {ref_no}, ID: {comp_id})")
        
        # Track by ref_no
        res_track = httpx.get(f"{BASE_URL}/api/complaints/{ref_no}")
        print(f"Tracking ({ref_no}): {'PASS' if res_track.status_code == 200 else 'FAIL'}")

        # 6. Test PDF generation
        res_pdf = httpx.get(f"{BASE_URL}/api/documents/generate-pdf?id={comp_id}")
        if res_pdf.status_code == 200 and res_pdf.headers["content-type"] == "application/pdf":
            print("PDF Download: PASS")
            with open("test_download.pdf", "wb") as f:
                f.write(res_pdf.content)
            print(f"PDF saved, size: {os.path.getsize('test_download.pdf')} bytes")
        else:
            print(f"PDF Download: FAIL (Status {res_pdf.status_code})")
    else:
        print("Creation: FAIL")

    print("\nChecklist complete.")

if __name__ == "__main__":
    test_qa()

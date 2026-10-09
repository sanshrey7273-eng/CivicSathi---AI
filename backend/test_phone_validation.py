import pytest
from fastapi.testclient import TestClient
from main import app, validate_indian_mobile

client = TestClient(app)

def test_valid_indian_mobile_7020973876():
    """Requirement 9: Valid 7020973876"""
    result = validate_indian_mobile("7020973876")
    assert result == "7020973876"

def test_valid_with_country_code_prefix():
    """Requirements 2 & 4: Treat +91 as separate country prefix, do not validate 13 chars"""
    assert validate_indian_mobile("+917020973876") == "7020973876"
    assert validate_indian_mobile("+91 7020973876") == "7020973876"
    assert validate_indian_mobile("+91-70209-73876") == "7020973876"
    assert validate_indian_mobile("07020973876") == "7020973876"

def test_valid_with_whitespace():
    """Requirement 3: Trim whitespace"""
    assert validate_indian_mobile("   7020973876   ") == "7020973876"

def test_invalid_short_numbers():
    """Requirement 9: Invalid short numbers"""
    with pytest.raises(ValueError, match="10 digits"):
        validate_indian_mobile("70209")
    with pytest.raises(ValueError, match="10 digits"):
        validate_indian_mobile("70209738")

def test_invalid_letters():
    """Requirement 9: Inputs containing letters"""
    with pytest.raises(ValueError, match="letters"):
        validate_indian_mobile("70209abc76")
    with pytest.raises(ValueError, match="letters"):
        validate_indian_mobile("abcdefghij")

def test_invalid_starting_digit():
    """Requirement 9: Invalid starting digit (not 6, 7, 8, 9)"""
    with pytest.raises(ValueError, match="First digit must be 6, 7, 8, or 9"):
        validate_indian_mobile("5020973876")
    with pytest.raises(ValueError, match="First digit must be 6, 7, 8, or 9"):
        validate_indian_mobile("1234567890")
    with pytest.raises(ValueError, match="First digit must be 6, 7, 8, or 9"):
        validate_indian_mobile("4987654321")

def test_valid_starting_digits_6_8_9():
    """Requirement 6: 10 digits starting with 6, 8, 9 are valid"""
    assert validate_indian_mobile("6123456789") == "6123456789"
    assert validate_indian_mobile("8123456789") == "8123456789"
    assert validate_indian_mobile("9822012345") == "9822012345"

def test_api_validate_phone_endpoint():
    """FastAPI validation endpoint"""
    # Valid
    res1 = client.post("/api/validate/phone", json={"phone": "7020973876"})
    assert res1.status_code == 200
    assert res1.json()["valid"] is True
    assert res1.json()["normalized"] == "7020973876"

    # Valid with +91
    res2 = client.post("/api/validate/phone", json={"phone": "+91 7020973876"})
    assert res2.status_code == 200
    assert res2.json()["valid"] is True
    assert res2.json()["normalized"] == "7020973876"

    # Invalid short
    res3 = client.post("/api/validate/phone", json={"phone": "70209"})
    assert res3.status_code == 200
    assert res3.json()["valid"] is False

    # Invalid starting digit
    res4 = client.post("/api/validate/phone", json={"phone": "5020973876"})
    assert res4.status_code == 200
    assert res4.json()["valid"] is False

def test_create_complaint_phone_validation():
    """FastAPI complaint creation with valid and invalid phone"""
    base_payload = {
        "category": "pothole",
        "department_key": "pmc_road",
        "department_name": "Road Maintenance",
        "summary_en": "Pothole on FC road",
        "summary_local": "रस्त्यावर खड्डा",
        "lat": 18.5308,
        "lng": 73.8475,
        "address": "FC Road, Shivajinagar",
        "ward_id": 1,
        "ward_name": "Shivajinagar-Ghole Road",
        "citizen_name": "Rahul Deshmukh"
    }

    # Valid phone
    res_valid = client.post("/api/complaints", json={
        **base_payload,
        "citizen_phone": "7020973876"
    })
    assert res_valid.status_code == 200
    assert "ref_no" in res_valid.json()

    # Valid phone with +91
    res_valid_prefix = client.post("/api/complaints", json={
        **base_payload,
        "citizen_phone": "+91 7020973876"
    })
    assert res_valid_prefix.status_code == 200

    # Invalid phone starting with 5 -> 422 Unprocessable Entity
    res_invalid = client.post("/api/complaints", json={
        **base_payload,
        "citizen_phone": "5020973876"
    })
    assert res_invalid.status_code == 422

    # Invalid short phone -> 422
    res_short = client.post("/api/complaints", json={
        **base_payload,
        "citizen_phone": "70209"
    })
    assert res_short.status_code == 422

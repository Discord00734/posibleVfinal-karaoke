#!/usr/bin/env python3
"""
Additional Backend API Tests for File Upload Endpoints
Tests file upload functionality for comprobantes and videos
"""

import requests
import io
import base64
from PIL import Image

# Configuration
BASE_URL = "https://de385889-24f3-4f3a-8093-6fa1171f68ea.preview.emergentagent.com/api"
TIMEOUT = 30

def create_test_image():
    """Create a small test image in memory"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_file_upload_endpoints():
    """Test file upload endpoints"""
    session = requests.Session()
    session.timeout = TIMEOUT
    
    print("🚀 Testing File Upload Endpoints")
    print("=" * 50)
    
    # First, create an inscription to test file uploads
    test_data = {
        "nombre_completo": "Test User for Upload",
        "nombre_artistico": "Upload Tester", 
        "telefono": "442-999-9999",
        "categoria": "KOE SAN",
        "municipio": "Test City",
        "sede": "Test Venue"
    }
    
    try:
        # Create inscription
        response = session.post(f"{BASE_URL}/inscripciones", json=test_data)
        if response.status_code == 200:
            inscription_id = response.json()["id"]
            print(f"✅ Created test inscription: {inscription_id}")
            
            # Test comprobante upload
            try:
                test_image = create_test_image()
                files = {'archivo': ('test_image.jpg', test_image, 'image/jpeg')}
                
                upload_response = session.post(
                    f"{BASE_URL}/inscripciones/{inscription_id}/comprobante",
                    files=files
                )
                
                if upload_response.status_code == 200:
                    print("✅ PASS Comprobante Upload: File uploaded successfully")
                    print(f"   Response: {upload_response.json()}")
                else:
                    print(f"❌ FAIL Comprobante Upload: HTTP {upload_response.status_code}")
                    print(f"   Response: {upload_response.text}")
                    
            except Exception as e:
                print(f"❌ FAIL Comprobante Upload: {str(e)}")
            
            # Test invalid file upload (non-image)
            try:
                text_file = io.BytesIO(b"This is not an image")
                files = {'archivo': ('test.txt', text_file, 'text/plain')}
                
                invalid_response = session.post(
                    f"{BASE_URL}/inscripciones/{inscription_id}/comprobante",
                    files=files
                )
                
                if invalid_response.status_code == 400:
                    print("✅ PASS Invalid File Type: Correctly rejected non-image file")
                else:
                    print(f"❌ FAIL Invalid File Type: Expected 400, got {invalid_response.status_code}")
                    
            except Exception as e:
                print(f"❌ FAIL Invalid File Type Test: {str(e)}")
                
        else:
            print(f"❌ Failed to create test inscription: HTTP {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error in file upload tests: {str(e)}")
    
    print("=" * 50)

if __name__ == "__main__":
    test_file_upload_endpoints()
import os
import sys
import unittest
import json
from io import BytesIO
from PIL import Image
import numpy as np

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Create a test image in memory
        img = Image.new('L', (64, 64), color=128)  # Gray image
        self.test_img_io = BytesIO()
        img.save(self.test_img_io, 'PNG')
        self.test_img_io.seek(0)

    def test_index_route(self):
        """Test the index route returns 200 status"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        
    def test_process_image(self):
        """Test the process endpoint with a test image"""
        data = {
            'image': (self.test_img_io, 'test_image.png'),
            'model_type': 'dense'
        }
        response = self.client.post(
            '/process',
            data=data,
            content_type='multipart/form-data'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('processed_image', response_data)
        self.assertTrue(response_data['processed_image'].startswith('data:image/png;base64,'))
    
    def test_process_image_no_file(self):
        """Test process endpoint with no file returns error"""
        data = {'model_type': 'dense'}
        response = self.client.post(
            '/process',
            data=data,
            content_type='multipart/form-data'
        )
        
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data)
        self.assertIn('error', response_data)
    
    def test_train_model(self):
        """Test the train endpoint returns a success response"""
        data = {
            'model_type': 'dense',
            'epochs': 5,
            'batch_size': 32,
            'learning_rate': 0.001
        }
        response = self.client.post(
            '/train',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('status', response_data)
        self.assertIn('model_id', response_data)
        
    def test_generate_synthetic_dataset(self):
        """Test generating a synthetic dataset"""
        response = self.client.post('/generate_synthetic_dataset')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertIn('status', response_data)
        self.assertIn('id', response_data)
        self.assertIn('item_count', response_data)
        
if __name__ == '__main__':
    unittest.main()

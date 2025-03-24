import os
import sys
import unittest
import numpy as np
from PIL import Image

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from model.model import UnShineyModel
from model.utils import preprocess_image, image_to_base64, generate_sample_images

class TestModel(unittest.TestCase):
    def setUp(self):
        # Create test image
        self.test_img = Image.new('L', (64, 64), color=128)
        self.test_img_array = np.array(self.test_img)
        
        # Create model instances for testing
        self.dense_model = UnShineyModel(model_type='dense')
        self.conv_model = UnShineyModel(model_type='conv')
        self.hybrid_model = UnShineyModel(model_type='hybrid')
        self.custom_model = UnShineyModel(model_type='custom')
        
        # Create a model with custom config
        self.custom_config = {
            'processing_params': {
                'contrast': 1.5,
                'brightness': 10,
                'sharpen': 0.7
            },
            'layers': [
                {'type': 'dense', 'name': 'Dense 1', 'units': 64, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Output', 'units': 4096, 'activation': 'sigmoid'}
            ]
        }
        self.config_model = UnShineyModel(model_type='custom', config=self.custom_config)

    def test_model_initialization(self):
        """Test model initialization with different types"""
        # Test default architecture for dense model
        self.assertEqual(self.dense_model.model_type, 'dense')
        self.assertGreater(len(self.dense_model.architecture), 0)
        
        # Test model metrics initialization
        self.assertEqual(self.dense_model.metrics['processed_images'], 0)
        self.assertEqual(self.dense_model.metrics['avg_processing_time'], 0)
        
        # Test custom config applied
        self.assertEqual(self.config_model.processing_params['contrast'], 1.5)
        self.assertEqual(len(self.config_model.architecture), 2)

    def test_process_image(self):
        """Test image processing with different model types"""
        # Process image with dense model
        dense_output = self.dense_model.process_image(self.test_img_array)
        self.assertEqual(dense_output.shape, self.test_img_array.shape)
        self.assertEqual(dense_output.dtype, np.uint8)
        
        # Process image with convolutional model
        conv_output = self.conv_model.process_image(self.test_img_array)
        self.assertEqual(conv_output.shape, self.test_img_array.shape)
        
        # Process image with custom config model
        custom_output = self.config_model.process_image(self.test_img_array)
        self.assertEqual(custom_output.shape, self.test_img_array.shape)
        
        # Verify metrics update
        self.assertEqual(self.dense_model.metrics['processed_images'], 1)
        self.assertGreater(self.dense_model.metrics['avg_processing_time'], 0)

    def test_custom_processing(self):
        """Test custom processing parameters"""
        # Create model with specific processing params
        params = {
            'processing_params': {
                'contrast': 1.2,
                'blur': 2.0,
                'sharpen': 0.0,
                'equalize': True
            }
        }
        test_model = UnShineyModel(model_type='custom', config=params)
        
        # Process with custom params
        output = test_model.process_image(self.test_img_array)
        
        # Verify output
        self.assertEqual(output.shape, self.test_img_array.shape)
        self.assertEqual(output.dtype, np.uint8)

    def test_model_save_load_config(self):
        """Test saving and loading model configuration"""
        import tempfile
        import json
        
        # Create temp file
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            config_path = tmp.name
        
        try:
            # Save config
            self.dense_model.save_config(config_path)
            
            # Verify file exists and contains valid JSON
            self.assertTrue(os.path.exists(config_path))
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                self.assertEqual(config_data['model_type'], 'dense')
                self.assertIn('architecture', config_data)
            
            # Load config
            loaded_model = UnShineyModel.load_config(config_path)
            self.assertEqual(loaded_model.model_type, 'dense')
            self.assertEqual(len(loaded_model.architecture), len(self.dense_model.architecture))
            
        finally:
            # Clean up
            if os.path.exists(config_path):
                os.unlink(config_path)

    def test_detect_shine(self):
        """Test shine detection functionality"""
        # Create test image with bright spot
        img = np.ones((64, 64), dtype=np.uint8) * 100
        img[20:30, 20:30] = 240  # Add bright spot
        
        # Detect shine
        shine_mask = self.dense_model.detect_shine(img)
        
        # Verify mask has detected the bright spot
        self.assertEqual(shine_mask.shape, img.shape)
        self.assertTrue(np.any(shine_mask[20:30, 20:30] > 0))

    def test_remove_shine(self):
        """Test shine removal functionality"""
        # Create test image with bright spot
        img = np.ones((64, 64), dtype=np.uint8) * 100
        img[20:30, 20:30] = 240  # Add bright spot
        
        # Create mask
        mask = np.zeros((64, 64), dtype=np.uint8)
        mask[20:30, 20:30] = 1
        
        # Remove shine
        processed = self.dense_model.remove_shine(img, mask)
        
        # Verify bright spot has been modified
        self.assertLess(np.mean(processed[20:30, 20:30]), np.mean(img[20:30, 20:30]))

    def test_model_training(self):
        """Test model training simulation"""
        # Create tiny dataset
        dataset = [(self.test_img_array, self.test_img_array) for _ in range(5)]
        
        # Train model
        history = self.dense_model.train(dataset, epochs=3)
        
        # Verify training occurred
        self.assertEqual(len(history['loss']), 3)
        self.assertEqual(len(history['val_loss']), 3)
        self.assertTrue(self.dense_model.trained)

    def test_utils_preprocess_image(self):
        """Test image preprocessing utility"""
        # Test with PIL image
        processed = preprocess_image(self.test_img)
        self.assertEqual(processed.shape, (64, 64))
        
        # Test with file path (mock by processing from PIL image)
        self.test_img.save('temp_test_img.png')
        try:
            processed = preprocess_image('temp_test_img.png')
            self.assertEqual(processed.shape, (64, 64))
        finally:
            if os.path.exists('temp_test_img.png'):
                os.remove('temp_test_img.png')

    def test_utils_image_to_base64(self):
        """Test image to base64 conversion"""
        base64_str = image_to_base64(self.test_img)
        self.assertTrue(isinstance(base64_str, str))
        self.assertGreater(len(base64_str), 0)

    def test_utils_generate_sample_images(self):
        """Test sample image generation"""
        samples = generate_sample_images(count=3)
        self.assertEqual(len(samples), 3)
        
        for input_img, target_img in samples:
            self.assertTrue(isinstance(input_img, Image.Image))
            self.assertTrue(isinstance(target_img, Image.Image))
            self.assertEqual(input_img.size, target_img.size)

if __name__ == '__main__':
    unittest.main()

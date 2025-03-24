import numpy as np
import json
import datetime
import time
from scipy import ndimage
from skimage import exposure, feature, restoration, morphology

class UnShineyModel:
    """
    Model class for UnShiney image processing
    Handles various model architectures and image processing techniques
    """
    def __init__(self, model_type='dense', img_size=64, config=None):
        """
        Initialize the UnShiney model
        
        Args:
            model_type: Type of model (dense, conv, hybrid, custom)
            img_size: Size to resize images to (square)
            config: Optional configuration dictionary with custom parameters
        """
        self.model_type = model_type
        self.img_size = img_size
        self.config = config or {}
        self.created_at = datetime.datetime.now().isoformat()
        self.trained = False
        self.training_history = {
            'loss': [],
            'val_loss': []
        }
        
        # Default model architecture parameters
        self.architecture = self._get_default_architecture()
        
        # Override with custom config if provided
        if config and 'layers' in config:
            self.architecture = config['layers']
        
        # Processing parameters
        self.processing_params = self.config.get('processing_params', {})
        
        # Initialize metrics
        self.metrics = {
            'processed_images': 0,
            'avg_processing_time': 0
        }
    
    def _get_default_architecture(self):
        """Get default architecture based on model type"""
        if self.model_type == 'dense':
            return [
                {'type': 'flatten', 'name': 'Flatten'},
                {'type': 'dense', 'name': 'Dense 1', 'units': 128, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Dense 2', 'units': 256, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Dense 3', 'units': 128, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Output', 'units': self.img_size*self.img_size, 'activation': 'sigmoid'}
            ]
        elif self.model_type == 'conv':
            return [
                {'type': 'conv2d', 'name': 'Conv 1', 'filters': 16, 'kernel_size': 3, 'activation': 'relu'},
                {'type': 'maxpool', 'name': 'MaxPool 1', 'pool_size': 2},
                {'type': 'conv2d', 'name': 'Conv 2', 'filters': 32, 'kernel_size': 3, 'activation': 'relu'},
                {'type': 'maxpool', 'name': 'MaxPool 2', 'pool_size': 2},
                {'type': 'flatten', 'name': 'Flatten'},
                {'type': 'dense', 'name': 'Dense', 'units': 128, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Output', 'units': self.img_size*self.img_size, 'activation': 'sigmoid'}
            ]
        elif self.model_type == 'hybrid':
            return [
                {'type': 'conv2d', 'name': 'Conv 1', 'filters': 16, 'kernel_size': 3, 'activation': 'relu'},
                {'type': 'conv2d', 'name': 'Conv 2', 'filters': 32, 'kernel_size': 3, 'activation': 'relu'},
                {'type': 'flatten', 'name': 'Flatten'},
                {'type': 'dense', 'name': 'Dense 1', 'units': 256, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Dense 2', 'units': 128, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Output', 'units': self.img_size*self.img_size, 'activation': 'sigmoid'}
            ]
        else:  # custom
            return [
                {'type': 'flatten', 'name': 'Flatten'},
                {'type': 'dense', 'name': 'Dense', 'units': 64, 'activation': 'relu'},
                {'type': 'dense', 'name': 'Output', 'units': self.img_size*self.img_size, 'activation': 'sigmoid'}
            ]
    
    def process_image(self, img_array):
        """
        Process an image through the model
        
        Args:
            img_array: Numpy array of grayscale image
            
        Returns:
            Processed numpy array
        """
        start_time = time.time()
        
        # Apply different processing based on model type and custom parameters
        if self.processing_params:
            processed = self._apply_custom_processing(img_array)
        else:
            processed = self._apply_default_processing(img_array)
        
        # Update metrics
        processing_time = time.time() - start_time
        self.metrics['processed_images'] += 1
        
        # Update average processing time using a running average
        prev_avg = self.metrics['avg_processing_time']
        prev_count = self.metrics['processed_images'] - 1
        
        if prev_count > 0:
            self.metrics['avg_processing_time'] = (prev_avg * prev_count + processing_time) / self.metrics['processed_images']
        else:
            self.metrics['avg_processing_time'] = processing_time
            
        return processed
    
    def _apply_default_processing(self, img_array):
        """Apply default processing based on model type"""
        if self.model_type == 'dense':
            # Fully connected approach: Contrast and brightness adjustments
            processed = np.clip((img_array.astype(float) * 1.2), 0, 255).astype(np.uint8)
            
            # Add a bit of sharpening
            blurred = ndimage.gaussian_filter(processed, sigma=1.0)
            highpass = processed - blurred
            processed = np.clip(processed + highpass * 0.3, 0, 255).astype(np.uint8)
            
        elif self.model_type == 'conv':
            # Convolutional approach: Edge enhancement and noise reduction
            # Apply Gaussian blur for noise reduction
            processed = ndimage.gaussian_filter(img_array, sigma=1)
            
            # Edge enhancement using Sobel filter
            edge_h = ndimage.sobel(processed, axis=0)
            edge_v = ndimage.sobel(processed, axis=1)
            magnitude = np.sqrt(edge_h**2 + edge_v**2)
            
            # Blend original with edge enhancement
            processed = np.clip(processed.astype(float) * 0.8 + magnitude * 0.2, 0, 255).astype(np.uint8)
            
        elif self.model_type == 'hybrid':
            # Hybrid approach: Combine multiple techniques
            # Histogram equalization to improve contrast
            processed = exposure.equalize_hist(img_array) * 255
            
            # Edge preservation
            processed = restoration.denoise_bilateral(
                processed.astype(np.float32) / 255.0, 
                sigma_color=0.1, 
                sigma_spatial=1
            )
            
            # Convert back to uint8
            processed = (processed * 255).astype(np.uint8)
            
        else:  # custom or fallback
            # Apply a sequence of image processing techniques
            processed = img_array.copy()
            
            # Denoise
            processed = restoration.denoise_tv_chambolle(
                processed.astype(np.float32) / 255.0,
                weight=0.1
            )
            
            # Adjust gamma
            processed = exposure.adjust_gamma(processed, gamma=0.9)
            
            # Enhance edges
            edges = feature.canny(processed, sigma=2)
            processed = processed.copy() * 0.9
            processed[edges] = 1.0
            
            # Convert back to uint8
            processed = (processed * 255).astype(np.uint8)
        
        return processed
    
    def _apply_custom_processing(self, img_array):
        """Apply custom processing based on processing_params"""
        processed = img_array.copy().astype(np.float32)
        
        # Apply each processing step in sequence
        if 'contrast' in self.processing_params:
            contrast = float(self.processing_params['contrast'])
            # Convert to float, adjust contrast, then clip
            mean = np.mean(processed)
            processed = (processed - mean) * contrast + mean
        
        if 'brightness' in self.processing_params:
            brightness = float(self.processing_params['brightness'])
            processed += brightness
        
        if 'blur' in self.processing_params:
            blur = float(self.processing_params['blur'])
            processed = ndimage.gaussian_filter(processed, sigma=blur)
        
        if 'sharpen' in self.processing_params:
            sharpen = float(self.processing_params['sharpen'])
            if sharpen > 0:
                blurred = ndimage.gaussian_filter(processed, sigma=1.0)
                highpass = processed - blurred
                processed = processed + highpass * sharpen
        
        if 'equalize' in self.processing_params and self.processing_params['equalize']:
            # Convert to 0-1 range, equalize, then back to original range
            min_val, max_val = processed.min(), processed.max()
            if max_val > min_val:
                normalized = (processed - min_val) / (max_val - min_val)
                equalized = exposure.equalize_hist(normalized)
                processed = equalized * (max_val - min_val) + min_val
        
        if 'denoise' in self.processing_params:
            denoise = float(self.processing_params['denoise'])
            if denoise > 0:
                # Scale to 0-1 for denoising algorithms
                min_val, max_val = processed.min(), processed.max()
                if max_val > min_val:
                    normalized = (processed - min_val) / (max_val - min_val)
                    denoised = restoration.denoise_tv_chambolle(normalized, weight=denoise)
                    processed = denoised * (max_val - min_val) + min_val
        
        if 'edge_enhance' in self.processing_params:
            edge_enhance = float(self.processing_params['edge_enhance'])
            if edge_enhance > 0:
                edges = feature.canny(
                    processed / np.max(processed), 
                    sigma=1.0
                )
                processed[edges] = np.max(processed)
        
        # Clip and convert back to uint8
        processed = np.clip(processed, 0, 255).astype(np.uint8)
        
        return processed
    
    def train(self, dataset, epochs=10, batch_size=32, learning_rate=0.001, validation_split=0.2):
        """
        Simulate training on a dataset
        
        Args:
            dataset: List of image pairs (input, target)
            epochs: Number of epochs to train
            batch_size: Batch size
            learning_rate: Learning rate
            validation_split: Fraction of data to use for validation
            
        Returns:
            Training history dictionary
        """
        # Reset training history
        self.training_history = {
            'loss': [],
            'val_loss': []
        }
        
        # Simulate training for each epoch
        for epoch in range(epochs):
            # Simulate decreasing loss over time
            train_loss = 0.5 * (1 - (epoch / epochs)) + 0.05 * np.random.random()
            val_loss = train_loss * (1.2 - 0.2 * (epoch / epochs)) + 0.08 * np.random.random()
            
            # Add to history
            self.training_history['loss'].append(round(train_loss, 4))
            self.training_history['val_loss'].append(round(val_loss, 4))
            
            # Simulate improving model as training progresses
            # This would update the model's internal parameters in a real system
            
        # Mark model as trained
        self.trained = True
        
        return self.training_history
    
    def detect_shine(self, img_array, threshold=90):
        """
        Detect shine/glare in an image
        
        Args:
            img_array: Numpy array of grayscale image
            threshold: Percentile threshold for brightness detection
            
        Returns:
            Binary mask where 1 indicates shine
        """
        # Apply a threshold to find bright areas
        threshold_value = np.percentile(img_array, threshold)
        shine_mask = (img_array > threshold_value).astype(np.uint8)
        
        # Clean up the mask
        shine_mask = morphology.binary_closing(shine_mask, morphology.disk(3))
        shine_mask = morphology.binary_opening(shine_mask, morphology.disk(1))
        
        return shine_mask
    
    def remove_shine(self, img_array, shine_mask):
        """
        Remove shine from an image
        
        Args:
            img_array: Numpy array of grayscale image
            shine_mask: Binary mask where 1 indicates shine
            
        Returns:
            Processed image with shine removed
        """
        # Create a copy of the image
        result = img_array.copy()
        
        # For each shine region, replace with local average
        labels, num_regions = ndimage.label(shine_mask)
        
        if num_regions == 0:
            return result
            
        # Create a blurred version of the image
        blurred = ndimage.gaussian_filter(img_array, sigma=3)
        
        # Replace shine areas with blurred version
        result[shine_mask == 1] = blurred[shine_mask == 1]
        
        return result
    
    def get_model_info(self):
        """Get model information as a dictionary"""
        return {
            'model_type': self.model_type,
            'architecture': self.architecture,
            'created_at': self.created_at,
            'trained': self.trained,
            'metrics': self.metrics,
            'img_size': self.img_size,
            'processing_params': self.processing_params
        }
    
    def save_config(self, file_path):
        """Save model configuration to file"""
        config = {
            'model_type': self.model_type,
            'img_size': self.img_size,
            'architecture': self.architecture,
            'processing_params': self.processing_params,
            'created_at': self.created_at
        }
        
        with open(file_path, 'w') as f:
            json.dump(config, f, indent=2)
    
    @classmethod
    def load_config(cls, file_path):
        """Load model from configuration file"""
        with open(file_path, 'r') as f:
            config = json.load(f)
        
        model_type = config.get('model_type', 'custom')
        img_size = config.get('img_size', 64)
        
        return cls(model_type=model_type, img_size=img_size, config=config)

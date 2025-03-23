import numpy as np

class UnShineyModel:
    """
    Model class for UnShiney image processing
    Simplified version for the web demo
    """
    def __init__(self, model_type='dense', img_size=64):
        self.model_type = model_type
        self.img_size = img_size
        
    def process_image(self, img_array):
        """Process image through the model"""
        # Simplified simulation of different model types
        if self.model_type == 'dense':
            # Simulate dense model by adjusting contrast
            processed = np.clip((img_array.astype(float) * 1.2), 0, 255).astype(np.uint8)
        elif self.model_type == 'conv':
            # Simulate conv model with blurring
            from scipy import ndimage
            processed = ndimage.gaussian_filter(img_array, sigma=1)
        else:  # hybrid
            # Simulate hybrid model with histogram equalization
            from skimage import exposure
            processed = exposure.equalize_hist(img_array) * 255
            processed = processed.astype(np.uint8)
            
        return processed

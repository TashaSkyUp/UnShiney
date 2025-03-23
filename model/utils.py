import numpy as np
from PIL import Image
import io
import base64

def preprocess_image(img, target_size=64):
    """
    Preprocess an image for the UnShiney model
    
    Args:
        img: PIL Image or file path
        target_size: Size to resize image to (square)
        
    Returns:
        numpy array of resized grayscale image
    """
    if isinstance(img, str):
        img = Image.open(img)
        
    # Convert to grayscale
    img = img.convert('L')
    
    # Resize
    img = img.resize((target_size, target_size), Image.LANCZOS)
    
    # Convert to numpy array
    return np.array(img)

def image_to_base64(img):
    """
    Convert PIL Image to base64 string
    
    Args:
        img: PIL Image
        
    Returns:
        base64 encoded string
    """
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def base64_to_image(base64_str):
    """
    Convert base64 string to PIL Image
    
    Args:
        base64_str: base64 encoded string
        
    Returns:
        PIL Image
    """
    img_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(img_data))

def generate_sample_images():
    """
    Generate sample images for testing
    
    Returns:
        List of tuples (input_image, target_image)
    """
    samples = []
    size = 64
    
    # Sample 1: Gradient with simulated shine
    x = np.linspace(0, 1, size)
    y = np.linspace(0, 1, size)
    xx, yy = np.meshgrid(x, y)
    
    # Input: Gradient with shine
    input_img = (xx * yy * 255).astype(np.uint8)
    shine = np.exp(-((xx-0.7)**2 + (yy-0.3)**2)/0.05) * 200
    input_img = np.clip(input_img + shine.astype(np.uint8), 0, 255).astype(np.uint8)
    
    # Target: Gradient without shine
    target_img = (xx * yy * 255).astype(np.uint8)
    
    # Convert to PIL Images
    input_pil = Image.fromarray(input_img)
    target_pil = Image.fromarray(target_img)
    
    samples.append((input_pil, target_pil))
    
    return samples

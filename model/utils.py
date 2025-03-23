import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import io
import base64
import random
import math

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
    # Handle data URLs that include the MIME type
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
        
    img_data = base64.b64decode(base64_str)
    return Image.open(io.BytesIO(img_data))

def generate_sample_images(count=5, size=256):
    """
    Generate sample images with simulated shine/glare for testing
    
    Args:
        count: Number of image pairs to generate
        size: Size of each image in pixels
        
    Returns:
        List of tuples (input_image, target_image)
    """
    samples = []
    
    # Generate different types of samples
    generators = [
        generate_gradient_with_shine,
        generate_circle_with_shine,
        generate_grid_with_shine,
        generate_text_with_shine,
        generate_pattern_with_shine
    ]
    
    # Generate sample pairs
    for i in range(count):
        generator = generators[i % len(generators)]
        input_img, target_img = generator(size)
        samples.append((input_img, target_img))
    
    return samples

def generate_gradient_with_shine(size=256):
    """Generate a gradient image with a simulated shine spot"""
    # Create a smaller size for efficiency then resize
    small_size = min(size, 64)
    scale_factor = size / small_size
    
    # Generate gradient
    x = np.linspace(0, 1, small_size)
    y = np.linspace(0, 1, small_size)
    xx, yy = np.meshgrid(x, y)
    
    # Create target (clean gradient)
    target_img = (xx * yy * 255).astype(np.uint8)
    
    # Create input (gradient with shine)
    # Add a shine spot
    shine_x = 0.7
    shine_y = 0.3
    shine_radius = 0.05
    shine_intensity = 200
    
    shine = np.exp(-((xx-shine_x)**2 + (yy-shine_y)**2)/shine_radius) * shine_intensity
    input_img = np.clip(target_img + shine.astype(np.uint8), 0, 255).astype(np.uint8)
    
    # Convert to PIL Images and resize
    input_pil = Image.fromarray(input_img).resize((size, size), Image.LANCZOS)
    target_pil = Image.fromarray(target_img).resize((size, size), Image.LANCZOS)
    
    return input_pil, target_pil

def generate_circle_with_shine(size=256):
    """Generate a circle with simulated shine or reflection"""
    # Create image with a circle
    target_img = Image.new('L', (size, size), color=20)
    draw = ImageDraw.Draw(target_img)
    
    # Draw a circle in the middle
    center = size // 2
    radius = size // 3
    draw.ellipse((center-radius, center-radius, center+radius, center+radius), fill=180)
    
    # Create a copy for input image
    input_img = target_img.copy()
    
    # Add shine to the input image
    shine = Image.new('L', (size, size), color=0)
    shine_draw = ImageDraw.Draw(shine)
    
    # Draw an oval shine
    shine_center_x = center + radius // 2
    shine_center_y = center - radius // 2
    shine_width = radius // 2
    shine_height = radius // 1.5
    
    shine_draw.ellipse(
        (shine_center_x-shine_width, shine_center_y-shine_height, 
         shine_center_x+shine_width, shine_center_y+shine_height), 
        fill=200
    )
    
    # Blur the shine
    shine = shine.filter(ImageFilter.GaussianBlur(radius=size//30))
    
    # Compose the input image with shine
    input_array = np.array(input_img)
    shine_array = np.array(shine)
    
    input_array = np.clip(input_array + shine_array, 0, 255).astype(np.uint8)
    input_img = Image.fromarray(input_array)
    
    return input_img, target_img

def generate_grid_with_shine(size=256):
    """Generate a grid pattern with simulated shine"""
    # Create a grid pattern
    target_img = Image.new('L', (size, size), color=20)
    draw = ImageDraw.Draw(target_img)
    
    # Draw a grid
    line_spacing = size // 10
    line_color = 160
    
    # Vertical lines
    for x in range(0, size, line_spacing):
        draw.line([(x, 0), (x, size)], fill=line_color, width=2)
    
    # Horizontal lines
    for y in range(0, size, line_spacing):
        draw.line([(0, y), (size, y)], fill=line_color, width=2)
    
    # Create a copy for input image
    input_img = target_img.copy()
    
    # Create shine mask
    shine = Image.new('L', (size, size), color=0)
    shine_draw = ImageDraw.Draw(shine)
    
    # Draw multiple shine spots
    for _ in range(3):
        x = random.randint(0, size)
        y = random.randint(0, size)
        radius = random.randint(size//10, size//5)
        
        shine_draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=100)
    
    # Blur the shine
    shine = shine.filter(ImageFilter.GaussianBlur(radius=size//20))
    
    # Compose the input image with shine
    input_array = np.array(input_img)
    shine_array = np.array(shine)
    
    input_array = np.clip(input_array + shine_array, 0, 255).astype(np.uint8)
    input_img = Image.fromarray(input_array)
    
    return input_img, target_img

def generate_text_with_shine(size=256):
    """Generate an image with text and simulated glare"""
    # Create base image
    target_img = Image.new('L', (size, size), color=220)
    draw = ImageDraw.Draw(target_img)
    
    # Draw text (simulating text without actual font dependency)
    # Just draw some rectangles to look like text lines
    margin = size // 8
    line_height = size // 10
    line_width = size - 2 * margin
    
    for i in range(margin, size - margin, line_height + 5):
        # Vary line lengths
        this_width = int(line_width * (0.7 + 0.3 * random.random()))
        draw.rectangle((margin, i, margin + this_width, i + line_height), fill=50)
    
    # Create a copy for input image
    input_img = target_img.copy()
    
    # Create a diagonal glare
    shine = Image.new('L', (size, size), color=0)
    shine_draw = ImageDraw.Draw(shine)
    
    # Draw a diagonal line of shine
    line_width = size // 3
    angle = random.uniform(20, 70)
    x1 = size // 2 - (size * math.cos(math.radians(angle)))
    y1 = size // 2 - (size * math.sin(math.radians(angle)))
    x2 = size // 2 + (size * math.cos(math.radians(angle)))
    y2 = size // 2 + (size * math.sin(math.radians(angle)))
    
    for i in range(-line_width//2, line_width//2):
        dx = i * math.sin(math.radians(angle))
        dy = -i * math.cos(math.radians(angle))
        shine_draw.line([(x1+dx, y1+dy), (x2+dx, y2+dy)], fill=150, width=3)
    
    # Blur the shine
    shine = shine.filter(ImageFilter.GaussianBlur(radius=size//15))
    
    # Compose the input image with shine
    input_array = np.array(input_img)
    shine_array = np.array(shine)
    
    input_array = np.clip(input_array + shine_array, 0, 255).astype(np.uint8)
    input_img = Image.fromarray(input_array)
    
    return input_img, target_img

def generate_pattern_with_shine(size=256):
    """Generate a pattern with simulated shine spots"""
    # Create a pattern with circles
    target_img = Image.new('L', (size, size), color=200)
    draw = ImageDraw.Draw(target_img)
    
    # Draw a pattern of circles
    circle_size = size // 12
    spacing = size // 6
    
    for x in range(spacing // 2, size, spacing):
        for y in range(spacing // 2, size, spacing):
            draw.ellipse(
                (x - circle_size, y - circle_size, x + circle_size, y + circle_size), 
                fill=100
            )
    
    # Create a copy for input image
    input_img = target_img.copy()
    
    # Create shine mask with scattered shine spots
    shine = Image.new('L', (size, size), color=0)
    shine_draw = ImageDraw.Draw(shine)
    
    # Add several shine spots
    for _ in range(5):
        x = random.randint(0, size)
        y = random.randint(0, size)
        radius = random.randint(size//20, size//10)
        intensity = random.randint(100, 200)
        
        shine_draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=intensity)
    
    # Blur the shine
    shine = shine.filter(ImageFilter.GaussianBlur(radius=size//25))
    
    # Compose the input image with shine
    input_array = np.array(input_img)
    shine_array = np.array(shine)
    
    input_array = np.clip(input_array + shine_array, 0, 255).astype(np.uint8)
    input_img = Image.fromarray(input_array)
    
    return input_img, target_img

def remove_shine_from_image(image, mask, method='inpainting'):
    """
    Remove shine from an image using the provided mask
    
    Args:
        image: PIL Image with shine
        mask: PIL Image mask where white (255) indicates shine
        method: Removal method ('inpainting', 'blend', 'filter')
        
    Returns:
        PIL Image with shine removed
    """
    # Convert to numpy arrays
    img_array = np.array(image)
    mask_array = np.array(mask)
    
    # Normalize mask to range 0-1
    if mask_array.max() > 1:
        mask_array = mask_array / 255.0
    
    # Method 1: Simple inpainting (replace shine with local average)
    if method == 'inpainting':
        # Convert to grayscale if needed
        if len(img_array.shape) > 2:
            gray_img = np.mean(img_array, axis=2).astype(np.uint8)
        else:
            gray_img = img_array.copy()
        
        # Blur the image to get local averages
        from scipy import ndimage
        blurred = ndimage.gaussian_filter(gray_img, sigma=3)
        
        # Create result by combining original and blurred based on mask
        result = gray_img * (1 - mask_array) + blurred * mask_array
        
    # Method 2: Content-aware fill simulation
    elif method == 'blend':
        # Convert to grayscale if needed
        if len(img_array.shape) > 2:
            gray_img = np.mean(img_array, axis=2).astype(np.uint8)
        else:
            gray_img = img_array.copy()
        
        # Create horizontally and vertically blurred versions
        from scipy import ndimage
        h_blurred = ndimage.gaussian_filter1d(gray_img, sigma=5, axis=1)
        v_blurred = ndimage.gaussian_filter1d(gray_img, sigma=5, axis=0)
        
        # Combine them for a direction-aware blur
        blurred = (h_blurred + v_blurred) / 2
        
        # Create result by combining original and blurred based on mask
        result = gray_img * (1 - mask_array) + blurred * mask_array
        
    # Method 3: Filter-based approach
    else:
        # Convert image to PIL for filtering
        if len(img_array.shape) > 2:
            pil_img = Image.fromarray(img_array)
            pil_img = pil_img.convert('L')  # Convert to grayscale
        else:
            pil_img = Image.fromarray(img_array)
        
        # Apply various filters
        blurred = pil_img.filter(ImageFilter.GaussianBlur(radius=2))
        sharpened = pil_img.filter(ImageFilter.SHARPEN)
        
        # Convert filtered images back to numpy
        blurred_array = np.array(blurred)
        sharpened_array = np.array(sharpened)
        
        # Adjust contrast in shine areas
        contrast = ImageEnhance.Contrast(pil_img)
        contrast_img = contrast.enhance(0.8)  # Reduce contrast
        contrast_array = np.array(contrast_img)
        
        # Create result by combining filtered images based on mask
        result = (
            contrast_array * mask_array +
            sharpened_array * (1 - mask_array) * 0.5 +
            blurred_array * (1 - mask_array) * 0.5
        )
    
    # Convert result back to uint8
    result = np.clip(result, 0, 255).astype(np.uint8)
    
    # Convert back to PIL Image
    return Image.fromarray(result)

def analyze_shine(image):
    """
    Detect likely shine/glare regions in an image
    
    Args:
        image: PIL Image to analyze
        
    Returns:
        PIL Image mask where white (255) indicates probable shine
    """
    # Convert to grayscale and numpy array
    if image.mode != 'L':
        image = image.convert('L')
    
    img_array = np.array(image)
    
    # Apply a threshold to find bright areas
    threshold = np.percentile(img_array, 90)  # Adjust percentile as needed
    
    # Create initial mask of bright pixels
    bright_mask = (img_array > threshold).astype(np.uint8) * 255
    
    # Create mask as PIL Image
    mask = Image.fromarray(bright_mask)
    
    # Clean up the mask with some morphological operations
    mask = mask.filter(ImageFilter.MaxFilter(size=3))  # Dilate
    mask = mask.filter(ImageFilter.MinFilter(size=2))  # Erode
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1))  # Smooth edges
    
    return mask

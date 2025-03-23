from flask import Flask, render_template, request, jsonify
import os
import numpy as np
import base64
import io
from PIL import Image

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
    
    model_type = request.form.get('model_type', 'dense')
    
    # Get image from request
    img = Image.open(file.stream)
    
    # Process image through the selected model
    processed_img = process_with_model(img, model_type)
    
    # Return base64 encoded image
    img_buffer = io.BytesIO()
    processed_img.save(img_buffer, format='PNG')
    img_str = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
    
    return jsonify({
        'processed_image': f'data:image/png;base64,{img_str}'
    })

@app.route('/train', methods=['POST'])
def train_model():
    # Simulate training process - in a real app, this would train on user data
    return jsonify({'status': 'Model trained successfully'})

def process_with_model(image, model_type):
    """
    Process an image using the specified model type.
    
    In a real implementation, this would use TensorFlow models.
    For the demo, we'll simulate the processing.
    """
    # Convert to grayscale and resize
    image = image.convert('L')
    image = image.resize((64, 64), Image.LANCZOS)
    
    # Get image data as numpy array
    img_array = np.array(image)
    
    # Apply different processing based on model type
    if model_type == 'dense':
        # Simulate dense model by adjusting contrast
        img_array = np.clip((img_array.astype(float) * 1.2), 0, 255).astype(np.uint8)
    elif model_type == 'conv':
        # Simulate conv model with edge enhancement
        from scipy import ndimage
        img_array = ndimage.gaussian_filter(img_array, sigma=1)
    else:  # hybrid
        # Simulate hybrid model with histogram equalization
        from skimage import exposure
        img_array = exposure.equalize_hist(img_array) * 255
        img_array = img_array.astype(np.uint8)
    
    # Convert back to PIL Image
    return Image.fromarray(img_array)

if __name__ == '__main__':
    # Make sure dependencies are installed
    try:
        import scipy
        import skimage
    except ImportError:
        print("Installing required packages...")
        import pip
        pip.main(['install', 'scipy', 'scikit-image'])
    
    app.run(debug=True)
